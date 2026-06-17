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

// 自动格式化工具函数
function formatToStrapiBlocks(content) {
  // 1. 如果大模型传过来的是 JSON 格式的字符串，尝试直接解析
  if (typeof content === 'string' && (content.trim().startsWith('[') || content.trim().startsWith('{'))) {
    try {
      return JSON.parse(content);
    } catch (e) {
      // 解析失败则降级走下面的文本切割逻辑
    }
  }

  // 2. 如果传过来的是带换行的纯文本字符串
  if (typeof content === 'string') {
    // 按换行符切分成多段
    const lines = content.split(/\n+/).map(line => line.trim()).filter(Boolean);
    
    return lines.map(line => {
      // 匹配是否是大模型常用的小标题格式，例如 "1. Summer Demand..." 或 "### Sourcing Tips"
      const isHeading = /^(?:\d+\.|\#+)\s+/.test(line);
      
      if (isHeading) {
        // 清理掉前缀的 # 号
        const cleanText = line.replace(/^#+\s+/, '');
        return {
          type: "heading",
          level: 2,
          children: [{ type: "text", "text": cleanText }]
        };
      } else {
        return {
          type: "paragraph",
          children: [{ type: "text", "text": line }]
        };
      }
    });
  }

  return content;
}