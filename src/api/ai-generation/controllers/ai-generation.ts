import { factories } from '@strapi/strapi';
import axios from 'axios';
import os from 'os';
import path from 'path';
import fs from 'fs';

// 1. 模特母版图配置
const MODEL_TEMPLATES = {
  european: 'https://res.cloudinary.com/daybgtfi3/image/upload/v1782440174/G3_90a167fdc1.png',
  african: 'https://res.cloudinary.com/daybgtfi3/image/upload/v1782440174/G3_90a167fdc1.png',
  southeast_asia: 'https://res.cloudinary.com/daybgtfi3/image/upload/v1782440174/G3_90a167fdc1.png',
};

export default factories.createCoreController('api::ai-generation.ai-generation', ({ strapi }) => ({
  async generateModel(ctx) {
    let tempFilePath = '';

    try {
      const { id } = ctx.request.body as { id: string }; 

      if (!id) {
        return ctx.badRequest('缺少必要的 id 参数');
      }

      const apiKey = process.env.AGNES_API_KEY;
      if (!apiKey) {
        strapi.log.error('❌ 未检测到 AGNES_API_KEY，请检查 .env 文件');
        return ctx.internalServerError('服务器未配置 Agnes AI 大模型凭证');
      }

      // 2. 从数据库读取当前试衣单据（使用 as any 强行绕过未及时同步的 TS 严格检查）
      const record = await strapi.documents('api::ai-generation.ai-generation' as any).findOne({
        documentId: id,
        populate: ['source_image'],
      });

      if (!record) {
        return ctx.notFound(`未找到 ID 为 ${id} 的 AI 生成任务`);
      }
      
      const modelType = record.model_type || 'southeast_asia';
      const sourceImageUrl = record.source_image?.url;

      if (!sourceImageUrl) {
        return ctx.badRequest('该任务记录中没有上传 source_image（衣服平铺图）');
      }

      const personImageUrl = MODEL_TEMPLATES[modelType] || MODEL_TEMPLATES.southeast_asia;

      strapi.log.info(`✈️ [Agnes AI Center] 正在为任务 ${id} 发起极速同步试衣请求...`);

      // 把单据更新为处理中状态
      await strapi.documents('api::ai-generation.ai-generation' as any).update({
        documentId: id,
        data: { generation_status: 'processing' } as any,
      });

    // 3. ✨ 升级为【通用结构锁定提示词】—— 无论换什么衣服，永远不需要改代码！
      let promptText = '';
      
      // 使用通用代词 (the clothing from the second image)，并对细节（图案、裁剪、面料）下达绝对复制命令
      const strictConstraints = 'E-commerce fashion catalog photography. The model from the first reference image is wearing the EXACT clothing from the second reference image. Completely and strictly preserve 100% of the original clothing design, including its exact original color, fabric texture, patterns, sleeve style, collar type, and tailoring details without any alteration. Do not redesign, do not modify the garment. Clean studio gray background, high-end commercial quality, absolutely NO text, NO letters, NO words.';

      if (modelType === 'european') {
        promptText = `Professional European female fashion model. ${strictConstraints}`;
      } else if (modelType === 'african') {
        promptText = `Professional African female fashion model. ${strictConstraints}`;
      } else if (modelType === 'southeast_asia') {
        promptText = `Professional Southeast Asian female fashion model. ${strictConstraints}`;
      } else {
        promptText = `Professional female fashion model. ${strictConstraints}`;
      }

      // 4. 调用 Agnes AI 官方图像编辑与多图融合接口
      const response = await axios.post(
        'https://apihub.agnes-ai.com/v1/images/generations',
        {
          model: 'agnes-image-2.0-flash',
          prompt: promptText,
          size: '1024x1024',
          extra_body: {
            image: [personImageUrl, sourceImageUrl], 
            response_format: 'url'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const finalImageUrl = response.data?.data?.[0]?.url;
      if (!finalImageUrl) {
        strapi.log.error('❌ Agnes AI 同步响应异常:', response.data);
        throw new Error('未能从 Agnes AI 接口中获取到有效的图片 URL');
      }

      strapi.log.info(`🎉 Agnes AI 同步渲染大功告成！大图托管地址: ${finalImageUrl}`);

      // 5. 📥 同步下载生成的图片数据流
      strapi.log.info(`📥 正在拉取结果图片进入服务器内存...`);
      const imgResponse = await axios.get(finalImageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(imgResponse.data, 'binary');

      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `seak_ai_${id}.jpg`);
      fs.writeFileSync(tempFilePath, buffer);
      strapi.log.info(`💾 临时缓存文件生成完毕，准备推流至 Cloudinary...`);
      
      // 6. 📤 推送多媒体至媒体库
      const uploadedFile = await strapi.plugin('upload').service('upload').upload({
        data: {}, 
        files: {
          name: `seak_ai_model_${id}.jpg`,
          originalFilename: `seak_ai_model_${id}.jpg`, 
          type: 'image/jpeg',
          mimetype: 'image/jpeg',                              
          size: buffer.length,
          path: tempFilePath,                      
          filepath: tempFilePath,                              
        },
      });

      const fileData = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
      const fileId = fileData?.id;

      if (!fileId) {
        throw new Error('Cloudinary 上传通过，但获取多媒体资产组件 ID 失败');
      }

      strapi.log.info(`✅ Cloudinary 托管成功，媒体资产 ID: ${fileId}。正在执行原子数据落地...`);

      // 7. ✨ 完美闭环：更新单据状态与结果图关联（加入 as any 解锁编译限制）
      await strapi.documents('api::ai-generation.ai-generation' as any).update({
        documentId: id,
        data: {
          generation_status: 'success',
          result_image: fileId, 
        } as any
      });

      strapi.log.info(`🚀 [AI Center] 整个生命周期完美闭环！任务单 ${id} 已同步转为 success 且关联图片成功！ ✨`);

      return {
        data: {
          id,
          resultImageUrl: finalImageUrl,
          status: 'success',
          message: 'Agnes AI 试衣流同步处理成功！图片已成功上传 Cloudinary 并无缝挂载回你的 Strapi 后台！'
        },
        error: null
      };

    } catch (error: any) {
      strapi.log.error('❌ Agnes AI 业务流发生致命异常:', error?.response?.data || error.message);
      
      try {
        const { id } = ctx.request.body as { id: string };
        if (id) {
          await strapi.documents('api::ai-generation.ai-generation' as any).update({
            documentId: id,
            data: { generation_status: 'failed' } as any
          });
        }
      } catch (e) {}

      return ctx.internalServerError('对接 Agnes AI 试衣中心时发生内部故障');
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          strapi.log.info(`🧹 临时缓存物理文件已安全销毁。`);
        } catch (e: any) {
          strapi.log.error(`🧹 销毁临时文件失败:`, e.message);
        }
      }
    }
  },
}));