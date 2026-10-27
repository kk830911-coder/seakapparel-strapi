const slugify = require('slugify');

module.exports = {
  beforeCreate(event) {
    const { data } = event.params;
    if (data.name && !data.slug) {
      data.slug = slugify(data.name, { lower: true, strict: true, trim: true });
    }
  },
  beforeUpdate(event) {
    const { data } = event.params;
    if (data.name) {
      const newSlug = slugify(data.name, { lower: true, strict: true, trim: true });
      if (data.slug !== newSlug) {
        data.slug = newSlug;
      }
    }
  },
};
