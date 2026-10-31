// import type { Core } from '@strapi/strapi';

/**
 * 把旧的阶梯数据（priceTiers 组件）回填成「一行一档」的文本，
 * 避免老产品后台文本框为空、一保存就把价格清空。
 * 幂等：只处理 priceTable 为空但已有 priceTiers 的产品。
 */
async function backfillPriceTable(strapi: any) {
  const products = await strapi.documents('api::product.product').findMany({
    populate: ['priceTiers'],
    limit: 2000,
  });

  let updated = 0;

  for (const product of products) {
    const hasText = typeof product.priceTable === 'string' && product.priceTable.trim();
    const tiers = Array.isArray(product.priceTiers) ? product.priceTiers : [];
    if (hasText || tiers.length === 0) continue;

    const sorted = [...tiers].sort((a: any, b: any) => Number(a.minQty) - Number(b.minQty));
    const text = sorted
      .map((tier: any) => {
        const min = Number(tier.minQty);
        const max = tier.maxQty === null || tier.maxQty === undefined ? null : Number(tier.maxQty);
        const price = Number(tier.unitPrice);
        const range = max !== null && max >= min ? `${min}-${max}` : `${min}+`;
        return `${range} ${price}`;
      })
      .join('\n');

    try {
      await strapi.documents('api::product.product').update({
        documentId: product.documentId,
        data: { priceTable: text },
      });
      updated += 1;
    } catch (error: any) {
      strapi.log.warn(`[price-table backfill] ${product.slug || product.documentId}: ${error.message}`);
    }
  }

  if (updated) strapi.log.info(`[price-table backfill] filled priceTable for ${updated} product(s)`);
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or run some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    try {
      await backfillPriceTable(strapi);
    } catch (error: any) {
      strapi.log.warn(`[price-table backfill] skipped: ${error.message}`);
    }
  },
};
