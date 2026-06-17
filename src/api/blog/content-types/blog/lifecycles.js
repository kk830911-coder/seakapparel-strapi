module.exports = {
  beforeCreate(event) {
    const { data } = event.params;

    // 如果用户没有手动选择发布时间，则自动填充为当前时间
    if (!data.publish_date) {
      data.publish_date = new Date();
    }
  },
};