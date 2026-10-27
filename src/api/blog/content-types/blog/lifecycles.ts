export default {
  beforeCreate(event) {
    const { data } = event.params;
    if (data && !data.slug) {
      data.slug = undefined;
    }
  },
};
