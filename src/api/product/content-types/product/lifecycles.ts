// @ts-ignore
import slugify from 'slugify';
// @ts-ignore
import { errors } from '@strapi/utils';

/**
 * 解析后台「一行一档」的阶梯价文本框
 *
 * 支持写法（大小写、货币符号、分隔符都宽松处理）：
 *   10-49 12.50
 *   50-299 10.90
 *   300+ 9.80
 *   500 - 999 : $8.75
 *   1000 7.20        （只写一个数量 = 该数量及以上）
 *
 * 返回 [{ minQty, maxQty, unitPrice }]，minQty 升序
 */
function parsePriceTable(raw: string) {
  const lines = String(raw).split(/\r?\n/);
  const tiers: any[] = [];

  lines.forEach((line, index) => {
    const text = line.trim();
    if (!text || text.startsWith('#') || text.startsWith('//')) return;

    const lineNo = index + 1;
    // 数量区间（10-49 / 10~49 / 10+ / 10）+ 单价（可带 $ / usd）
    const match = text.match(
      /^(\d+)\s*(?:[-–—~至]\s*(\d+)|(\+))?\s*[,:;|\s]*\s*(?:usd|\$)?\s*(\d+(?:\.\d+)?)\s*$/i
    );

    if (!match) {
      throw new errors.ValidationError(
        `Price table line ${lineNo} "${text}" could not be read. Use one tier per line, e.g. "10-49 12.50" or "500+ 8.75".`
      );
    }

    const minQty = Number(match[1]);
    const maxQty = match[2] ? Number(match[2]) : null;
    const unitPrice = Number(match[4]);

    if (!Number.isFinite(minQty) || minQty < 1) {
      throw new errors.ValidationError(`Price table line ${lineNo}: quantity must be 1 or more.`);
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new errors.ValidationError(`Price table line ${lineNo}: price must be greater than 0.`);
    }
    if (maxQty !== null && maxQty < minQty) {
      throw new errors.ValidationError(
        `Price table line ${lineNo}: the range end (${maxQty}) is smaller than the start (${minQty}).`
      );
    }

    tiers.push({ minQty, maxQty, unitPrice });
  });

  return tiers.sort((a, b) => a.minQty - b.minQty);
}

/** 把文本框内容同步成 priceTiers 组件数据（前端只读 priceTiers） */
function syncPriceTiers(data: any) {
  if (!data || typeof data.priceTable !== 'string') return;
  data.priceTiers = parsePriceTable(data.priceTable);
}

export default {
  beforeCreate(event: any) {
    const { data } = event.params;
    if (data.title && !data.slug) {
      data.slug = slugify(data.title, { lower: true, strict: true, trim: true });
    }
    syncPriceTiers(data);
  },
  beforeUpdate(event: any) {
    const { data } = event.params;
    // 只在 slug 为空时自动生成，不覆盖已有 slug（避免破坏已被 Google 收录的 URL）
    if (data.title && !data.slug) {
      data.slug = slugify(data.title, { lower: true, strict: true, trim: true });
    }
    syncPriceTiers(data);
  },
};
