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
  
  // 试衣间独立端点：处理前端传递的压缩图片
  async runFromFittingRoom(ctx) {
    try {
      const body = ctx.request.body as any;
      const files = ctx.request.files as any;
      
      const modelType = body?.modelType || 'southeast_asia';
      const fileObj = files?.file; 

      if (!fileObj) {
        return ctx.badRequest('请选择并上传衣服原图 (Missing file)');
      }

      const actualFile = Array.isArray(fileObj) ? fileObj[0] : fileObj;

      strapi.log.info('📥 [Fitting Room] 线上收到试衣文件，正在执行跨平台属性重构并推送 Cloudinary...');

      const uploadedSourceFile = await strapi.plugin('upload').service('upload').upload({
        data: {},
        files: {
          name: actualFile.originalFilename || actualFile.name || `source_${Date.now()}.jpg`,
          originalFilename: actualFile.originalFilename || actualFile.name || `source_${Date.now()}.jpg`,
          type: actualFile.mimetype || actualFile.type || 'image/jpeg',
          mimetype: actualFile.mimetype || actualFile.type || 'image/jpeg',
          size: actualFile.size,
          path: actualFile.filepath || actualFile.path, 
          filepath: actualFile.filepath || actualFile.path,
        }
      });

      const sourceFileId = Array.isArray(uploadedSourceFile) ? uploadedSourceFile[0].id : uploadedSourceFile.id;
      strapi.log.info(`✅ 衣服原图落库成功，媒体 ID: ${sourceFileId}。正在自动签发对应的试衣单据...`);

      const newRecord = await strapi.documents('api::ai-generation.ai-generation' as any).create({
        data: {
          model_type: modelType,
          generation_status: 'pending',
          source_image: sourceFileId
        } as any
      });

      const newRecordId = newRecord.documentId || newRecord.id;
      strapi.log.info(`📊 单据已物理下摆，ID: ${newRecordId}。正在安全对调调用核心 AI 渲染引擎...`);

      ctx.request.body = { id: newRecordId };
      const mainController = strapi.controller('api::ai-generation.ai-generation');
      return await mainController.generateModel(ctx);

    } catch (error: any) {
      strapi.log.error('❌ 线上试衣间前置流致命崩溃:', error.message);
      return ctx.internalServerError('后端多模态引擎故障: ' + error.message);
    }
  },

  // 核心生成逻辑（Agnes AI 同步超速出图）
  async generateModel(ctx) {
    try {
      const { id } = ctx.request.body as { id: string }; 

      if (!id) { return ctx.badRequest('缺少必要的 id 参数'); }
      const apiKey = process.env.AGNES_API_KEY;
      if (!apiKey) { return ctx.internalServerError('服务器未配置 Agnes AI 大模型凭证'); }

      const record = await strapi.documents('api::ai-generation.ai-generation' as any).findOne({
        documentId: id,
        populate: ['source_image'],
      });

      if (!record) { return ctx.notFound(`未找到 ID 为 ${id} 的 AI 生成任务`); }
      
      const modelType = record.model_type || 'southeast_asia';
      const sourceImageUrl = record.source_image?.url;

      if (!sourceImageUrl) { return ctx.badRequest('该任务记录中没有上传 source_image（衣服平铺图）'); }

      const personImageUrl = MODEL_TEMPLATES[modelType] || MODEL_TEMPLATES.southeast_asia;
      strapi.log.info(`✈️ [Agnes AI Center] 正在为任务 ${id} 发起极速同步试衣请求...`);

      await strapi.documents('api::ai-generation.ai-generation' as any).update({
        documentId: id,
        data: { generation_status: 'processing' } as any,
      });

      let promptText = '';
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

      const response = await axios.post(
        'https://apihub.agnes-ai.com/v1/images/generations',
        {
          model: 'agnes-image-2.0-flash',
          prompt: promptText,
          size: '1024x1024',
          extra_body: { image: [personImageUrl, sourceImageUrl], response_format: 'url' }
        },
        { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
      );

      const finalImageUrl = response.data?.data?.[0]?.url;
      if (!finalImageUrl) {
        throw new Error('未能从 Agnes AI 接口中获取到有效的图片 URL');
      }

      strapi.log.info(`🎉 [提速核心] Agnes AI 出图成功！直接开启离线后台备份，不让前台傻等...`);

      // 【异步挂起】不阻塞主进程，让服务器自己在后台慢慢下载和上传 Cloudinary
      (async () => {
        let tempFilePath = '';
        try {
          const imgResponse = await axios.get(finalImageUrl, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(imgResponse.data, 'binary');
          const tempDir = os.tmpdir();
          tempFilePath = path.join(tempDir, `seak_ai_${id}.jpg`);
          fs.writeFileSync(tempFilePath, buffer);
          
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

          if (fileId) {
            await strapi.documents('api::ai-generation.ai-generation' as any).update({
              documentId: id,
              data: { generation_status: 'success', result_image: fileId } as any
            });
            strapi.log.info(`🚀 [后台异步] 任务单 ${id} 离线落库挂载完美闭环！`);
          }
        } catch (bgError: any) {
          strapi.log.error('❌ [后台异步] 离线备份落库失败:', bgError.message);
        } finally {
          if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch (e) {}
          }
        }
      })();

      // 立刻把生成的图片大图 URL 返回给前端展示，PC、移动端同时享受极致秒传体验
      return {
        data: {
          id,
          resultImageUrl: finalImageUrl,
          status: 'success',
          message: 'Agnes AI 试衣流极速响应成功！'
        },
        error: null
      };

    // ✨ 这里的修剪改好了！去掉了多余的单词
    } catch (error: any) {
      strapi.log.error('❌ Agnes AI 业务流致命异常:', error?.response?.data || error.message);
      return ctx.internalServerError('对接 Agnes AI 发生故障');
    }
  },
}));