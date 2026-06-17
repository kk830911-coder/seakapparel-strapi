module.exports = {
  beforeCreate(event) {
    const { data } = event.params;
    if (data && data.content) {
      data.content = formatToStrapiBlocks(data.content);
    }
  },
  beforeUpdate(event) {
    const { data } = event.params;
    if (data && data.content) {
      data.content = formatToStrapiBlocks(data.content);
    }
  }
};

// 强力格式化工具函数
function formatToStrapiBlocks(content) {
  let parsedContent = content;

  // 1. 深度解析：多层循环解析字符串，直到它变成真正的数组或对象（解决Dify多重包装String的严重Bug）
  while (typeof parsedContent === 'string') {
    const trimmed = parsedContent.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        parsedContent = JSON.parse(trimmed);
      } catch (e) {
        // 如果长得像JSON但解析报错，说明里面带了脏字符，跳出循环走文本清洗
        break;
      }
    } else {
      // 纯文本字符串，跳出循环
      break;
    }
  }

  // 2. 如果成功解析成了标准数组，且里面已经是标准的 Blocks 节点，直接返回
  if (Array.isArray(parsedContent) && parsedContent.length > 0 && parsedContent[0].type) {
    return parsedContent;
  }

  // 3. 如果解析失败，或者解析出来依然是纯文本，启动强力文本切块清洗
  if (typeof content === 'string') {
    // 兼容处理：将字面量的 \\n 替换为真正的换行符
    const cleanRawText = content.replace(/\\n/g, '\n');
    
    // 按换行切分，并过滤掉空行
    const lines = cleanRawText.split(/\n+/).map(line => line.trim()).filter(Boolean);
    
    return lines.map(line => {
      // 规则 A：匹配是否是标题行。支持: "1. 标题", "### 标题", "**1. 标题**"
      const isHeading = /^(?:\d+\.|\#+|\*\*\d+\.)\s+/.test(line);
      
      // 规则 B：匹配是否是无序列表行。支持: "- 列表", "* 列表", "• 列表"
      const isListItem = /^(?:-|\*|•)\s+/.test(line);

      if (isHeading) {
        // 清理掉所有的 #、*、以及前缀数字，只留下干净的标题文字
        const cleanText = line.replace(/^[\s#*\d.]+\s+/, '').replace(/\*\*$/g, '');
        return {
          type: "heading",
          level: 2,
          children: [{ type: "text", text: cleanText }]
        };
      } 
      
      if (isListItem) {
        // 清理掉前面的 - 或 *
        const cleanText = line.replace(/^[-\*•]\s+/, '');
        
        // 尝试解析列表内的加粗词，如 "MOQ: 50pcs" 变成 "MOQ:"加粗 + " 50pcs"正常
        const boldMatch = cleanText.match(/^([^\*\*：:]+[:：])(.*)/);
        let children = [];
        
        if (boldMatch) {
          children = [
            { type: "text", text: boldMatch[1], bold: true },
            { type: "text", text: boldMatch[2] }
          ];
        } else {
          children = [{ type: "text", text: cleanText }];
        }

        // 返回标准 Strapi v5 嵌套列表节点
        return {
          type: "list",
          format: "unordered",
          children: [
            {
              type: "list-item",
              children: children
            }
          ]
        };
      }

      // 规则 C：普通段落
      // 同样尝试兼容大模型喜欢用 **加粗** 的习惯
      const cleanLine = line.replace(/\*\*/g, '');
      return {
        type: "paragraph",
        children: [{ type: "text", text: cleanLine }]
      };
    });
  }

  return content;
}