// @ts-ignore
import slugify from 'slugify';

/**
 * 产品生命周期钩子
 *
 * 阶梯价由后台 priceTiers 组件直接维护（可重复组件，一行一档），
 * 前端只读 priceTiers，后端不做额外转换。
 */
export default {
  beforeCreate(event: any) {
    const { data } = event.params;
    if (data.title && !data.slug) {
      data.slug = slugify(data.title, { lower: true, strict: true, trim: true });
    }
  },
  beforeUpdate(event: any) {
    const { data } = event.params;
    // 只在 slug 为空时自动生成，不覆盖已有 slug（避免破坏已被 Google 收录的 URL）
    if (data.title && !data.slug) {
      data.slug = slugify(data.title, { lower: true, strict: true, trim: true });
    }
  },
};
