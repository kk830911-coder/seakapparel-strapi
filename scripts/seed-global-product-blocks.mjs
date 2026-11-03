/**
 * 一次性灌入「Global Product Blocks」示例内容（全站共用详情区块）。
 *
 * 用法：
 *   $env:STRAPI_URL  = "https://tutesportswear-strapi-us.onrender.com"   # 可选，默认就是这个
 *   $env:STRAPI_TOKEN = "在后台 Settings → API Tokens 生成的 token"       # 必填
 *   node scripts/seed-global-product-blocks.mjs            # 写入
 *   node scripts/seed-global-product-blocks.mjs --dry      # 只打印将要提交的内容，不写入
 *
 * 说明：
 *   - 可反复运行：组件数组是「整体覆盖」语义，改完下面的 content 再跑一次即可。
 *   - 图片放在 scripts/seed-data/images/ 下，文件名与 content 里的 *File 字段对应；
 *     找不到就跳过（该条目的图片留空），不会中断脚本。
 *   - 除了 craftTitle / craftBody / tradeTerms，其他文本请按贵司实际情况核对后再上线，
 *     尤其是认证有效期、MOQ、交期、港口这些会写进 Google 富结果的字段。
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = path.join(__dirname, 'seed-data', 'images')
const DRY_RUN = process.argv.includes('--dry')

// 允许把配置写在后端根目录的 .env 里（STRAPI_URL / STRAPI_TOKEN）
for (const line of safeRead(path.join(__dirname, '..', '.env')).split('\n')) {
  const m = line.match(/^(STRAPI_URL|STRAPI_TOKEN)\s*=\s*(.+)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
}

const STRAPI_URL = (process.env.STRAPI_URL || 'https://tutesportswear-strapi-us.onrender.com').replace(/\/$/, '')
const TOKEN = process.env.STRAPI_TOKEN

function safeRead(file) {
  try { return fs.readFileSync(file, 'utf8') } catch { return '' }
}

/* ------------------------------------------------------------------ *
 *  ↓↓↓  下面是要灌入的内容，直接改这里  ↓↓↓
 * ------------------------------------------------------------------ */
const content = {
  craftTitle: 'Craft & Fabric',

  craftBody: `Every garment is made at our own manufacturing base in Xiantao, Hubei, and shipped worldwide through our Shenzhen business hub — one group, one team from sampling to export.

Fabric — we stock 150–190 gsm polyester interlock, bird-eye mesh and 4-way stretch jersey, colour-fast and tested for shrinkage under 3% after 5 washes. Intertek test reports are available on request.

Printing — full-sublimation for photo-real graphics that never crack or peel, plus screen print, heat transfer and 3D embroidery for team logos and sponsor marks.

Construction — flatlock stitching on all stress seams, reinforced armholes and double-needle hems, so the uniform survives a full season of contact play.

Customization — weight, color (Pantone matched), panel layout, collar style, size grading and private-label neck tags are all adjustable. Send a reference photo and our design team returns a free mockup in 24 hours.`,

  // 工艺配图（放到 scripts/seed-data/images/craft/ 下）
  craftImages: ['craft/sublimation-printing-line.jpg', 'craft/heat-press.jpg', 'craft/laser-cutting.jpg', 'craft/sewing-floor.jpg'],

  // 参数表兜底行：只有当产品自身和所属分类都没填同名 label 时才生效
  specDefaults: [
    { label: 'Fabric', value: '100% polyester interlock, 160-180 gsm (weight customizable on request)' },
    { label: 'Printing & Decoration', value: 'Full sublimation / screen print / embroidery / tackle twill' },
    { label: 'Size Range', value: 'Youth XS - Adult 4XL; custom size chart supported' },
    { label: 'Labels & Packaging', value: 'Custom woven label, hangtag, polybag; carton spec on request' },
    { label: 'Sample Lead Time', value: '7-10 days after artwork confirmed' },
    { label: 'Bulk Lead Time', value: '15-25 days after sample approval' },
    { label: 'Port of Loading', value: 'Shenzhen / Guangzhou, China' },
    { label: 'Payment Terms', value: '30% deposit, 70% balance before shipment (T/T, Alibaba Trade Assurance)' }
  ],

  // 认证：只写可核验的事实。ISO/BSCI/WRAP/Disney 的旧文件已过期或没有有效编号，一律不对外公示。
  // validUntil 为空则不显示日期；有 imageFile 时会上传证书扫描件供点击放大。
  certifications: [
    {
      name: 'SEDEX SMETA 4-Pillar',
      desc: 'Ethical trade audit covering Labour Standards, Health & Safety, Environment (4-pillar) and Business Ethics. Conducted at our Hubei manufacturing base (TONTON SPORTSWEAR (HUBEI) CO., LTD.). Sedex Ref ZC5000027844 / ZS1000032248.',
      issuer: 'Benchmarks Company Limited',
      validUntil: 'Last audited: April 2025',
      imageFile: 'cert/smeta.jpg'
    },
    {
      name: 'Third-Party Product Testing',
      desc: 'SVHC (Substances of Very High Concern) screening test on finished garments by Intertek — result: Meet Requirement. Test reports for specific styles available on request.',
      issuer: 'Intertek Testing Services Shenzhen Ltd.',
      validUntil: 'Report GZHT90772050 · Feb 2018',
      imageFile: 'cert/intertek.jpg'
    },
    {
      name: 'Business Licence — Tonton Sports (Shenzhen)',
      desc: 'Contracting entity for every export order: sales, design and merchandising hub. Unified Social Credit Code 91440300678591414G.',
      issuer: 'Shenzhen Administration for Market Regulation',
      validUntil: 'Registered 2008',
      imageFile: 'cert/license-shenzhen.jpg'
    },
    {
      name: 'Business Licence — Tonton Sportswear (Hubei)',
      desc: 'Group manufacturing base in Xiantao: sublimation, cutting, sewing, embroidery and packing. Unified Social Credit Code 91429004MACGJFAE68.',
      issuer: 'Xiantao Administration for Market Regulation',
      validUntil: 'Registered 2023',
      imageFile: 'cert/license-hubei.jpg'
    },
    {
      name: 'Business Licence — Tute Outdoor (Hubei)',
      desc: 'Brand operations entity behind our outdoor line. Unified Social Credit Code 91429004MAKQ6L9638.',
      issuer: 'Xiantao Administration for Market Regulation',
      validUntil: 'Registered 2026',
      imageFile: 'cert/license-tute.jpg'
    }
  ],

  // 客户 logo：只放已获得授权的品牌！没有 logoFile 会退化成文字块
  clients: [
    { name: 'Cliff Keen Athletic', logoFile: 'clients/cliff-keen.png' },
    { name: 'Dickies', logoFile: 'clients/dickies.png' },
    { name: 'Rudis', logoFile: 'clients/rudis.png' }
  ],

  // 工厂实拍：caption 同时作为图片 alt，写英文短句
  factoryShots: [
    { file: 'factory/factory-gate.jpg', caption: 'Our factory gate in Xiantao, Hubei' },
    { file: 'factory/factory-team.jpg', caption: 'Our team at the Hubei manufacturing base' },
    { file: 'factory/factory-printing.jpg', caption: 'Digital sublimation printing line' },
    { file: 'factory/factory-sewing.jpg', caption: 'Sewing floor with UPS hanging transport' },
    { file: 'factory/factory-cutting.jpg', caption: 'Laser cutting room' },
    { file: 'factory/factory-sample-room.jpg', caption: 'Sample room: fabric and design library' }
  ],

  // 付款 / 物流 / 包装 / 贸易：前端渲染为折叠面板，title 就是面板标题
  infoBlocks: [
    {
      title: 'Payment Terms',
      body: `30% deposit by T/T or Alibaba Trade Assurance to start production, 70% balance against B/L copy.
PayPal and Western Union accepted for sample orders under USD 500.
Price validity: 30 days. Quotation excludes bank charges and any local duties.`
    },
    {
      title: 'Shipping & Delivery',
      body: `Express (DHL / FedEx / UPS): 3-6 working days door to door, best for samples and small orders.
Air freight: 7-12 days, airport to airport.
Sea freight (FOB Shenzhen / CIF): 25-35 days; consolidation available for mixed styles.
We ship to Amazon FBA warehouses and can print FNSKU labels and polybag barcodes on request.`
    },
    {
      title: 'Packaging & Carton Spec',
      body: `1 pc per polybag with size sticker; 30-50 pcs per export carton.
Standard carton: 60 x 40 x 40 cm, 5-layer corrugated, 12-18 kg gross.
Custom hangtag, size sticker, gift box and branded polybag available at extra cost.`
    },
    {
      title: 'Trade Terms',
      body: `FOB Shenzhen / Guangzhou as standard; CIF and DDP quoted on request.
MOQ 10 pcs per style, mixed sizes accepted. Below MOQ, a small-quantity surcharge applies.
Sample fee is refundable against a bulk order over 100 pcs.
Bulk tolerance: +/-5% on quantity, +/-1 cm on measurement.`
    }
  ],

  tradeTerms: `All prices are quoted in USD, FOB Shenzhen, valid for 30 days.
Production starts after deposit and approved digital mockup; artwork approval is the buyer's responsibility.
We keep 2% extra pieces for quality replacement. Claims for defects must be raised within 15 days of delivery with photos.
Force majeure, customs delay and carrier delay are outside our control.
Full terms: https://www.tutesports.com/terms-conditions`,

  // 详情区 FAQ：会输出 FAQPage 结构化数据
  detailFaqs: [
    { question: 'What is your MOQ for custom uniforms?', answer: '10 pcs per style, mixed sizes accepted. Below 10 pcs we still produce, with a small-quantity surcharge.' },
    { question: 'Can I get a free mockup before ordering?', answer: 'Yes. Send your logo, colors and reference photos; our design team returns a digital mockup within 24 hours, free of charge.' },
    { question: 'How long does sampling and bulk production take?', answer: '7-10 days for samples after artwork approval, 15-25 days for bulk after sample sign-off. Rush orders can be arranged.' },
    { question: 'Do you support private label and custom packaging?', answer: 'Yes - woven neck labels, hangtags, size stickers, polybags and gift boxes are all customizable.' },
    { question: 'How do you guarantee quality?', answer: 'Inline QC every 20 pieces, AQL 2.5 final inspection, and pre-shipment photos or third-party inspection on request.' },
    { question: 'Can you ship to Amazon FBA?', answer: 'Yes, we handle FNSKU labels, polybag barcodes and carton labeling for FBA shipments.' },
    { question: 'What payment methods do you accept?', answer: 'T/T, Alibaba Trade Assurance, PayPal and Western Union for small amounts. 30% deposit / 70% before shipment.' },
    { question: 'Do you have certifications?', answer: 'Our Hubei production base is SEDEX SMETA 4-Pillar audited (latest audit April 2025) and we hold third-party test reports from Intertek. The audit report, test report and business licences are shown in the Certifications section of this page, and scans can be shared on request.' }
  ]
}
/* ------------------------------------------------------------------ *
 *  ↑↑↑  内容结束  ↑↑↑
 * ------------------------------------------------------------------ */

/**
 * 按文件名（不含扩展名）找图：优先 WebP，其次 jpg / png。
 * 所以压缩脚本加 --webp 后，seed 这里会自动用上更小的 WebP，不用改 content 里的路径。
 */
function findImage(relPath) {
  const abs = path.join(IMAGES_DIR, relPath)
  if (fs.existsSync(abs)) return abs
  const dir = path.dirname(abs)
  const base = path.basename(relPath, path.extname(relPath))
  for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
    const candidate = path.join(dir, `${base}.${ext}`)
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

async function uploadImage(relPath) {
  const abs = findImage(relPath)
  if (!abs) {
    console.warn(`   ! 图片缺失，跳过：${relPath}`)
    return null
  }
  const file = fs.readFileSync(abs)
  const form = new FormData()
  form.append('files', new Blob([file]), path.basename(abs))
  const res = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form
  })
  if (!res.ok) {
    console.warn(`   ! 上传失败(${res.status})：${relPath}`)
    return null
  }
  const json = await res.json()
  return json?.[0]?.id ?? null
}

async function buildPayload() {
  const data = {
    craftTitle: content.craftTitle,
    craftBody: content.craftBody,
    tradeTerms: content.tradeTerms
  }

  data.craftImages = []
  for (const f of content.craftImages || []) {
    const id = await uploadImage(f)
    if (id) data.craftImages.push(id)
  }

  data.specDefaults = (content.specDefaults || []).map(r => ({ label: r.label, value: r.value }))

  data.certifications = []
  for (const c of content.certifications || []) {
    const imageId = c.imageFile ? await uploadImage(c.imageFile) : null
    data.certifications.push({
      name: c.name,
      desc: c.desc || '',
      issuer: c.issuer || '',
      validUntil: c.validUntil || '',
      ...(imageId ? { image: imageId } : {})
    })
  }

  data.clients = []
  for (const c of content.clients || []) {
    const imageId = c.logoFile ? await uploadImage(c.logoFile) : null
    data.clients.push({ name: c.name, ...(imageId ? { image: imageId } : {}) })
  }

  data.factoryShots = []
  for (const s of content.factoryShots || []) {
    const imageId = s.file ? await uploadImage(s.file) : null
    if (imageId) data.factoryShots.push({ image: imageId, caption: s.caption || '' })
  }

  data.infoBlocks = (content.infoBlocks || []).map(b => ({ title: b.title, body: b.body || '' }))

  data.detailFaqs = (content.detailFaqs || []).map(q => ({ question: q.question, answer: q.answer }))

  return data
}

async function main() {
  if (DRY_RUN) {
    console.log('— DRY RUN：只打印文本部分（不上传图片、不写入）—\n')
    console.log(JSON.stringify({
      craftTitle: content.craftTitle,
      specDefaults: content.specDefaults,
      certifications: content.certifications,
      clients: content.clients,
      factoryShots: content.factoryShots,
      infoBlocks: content.infoBlocks,
      detailFaqs: content.detailFaqs
    }, null, 2))
    return
  }

  if (!TOKEN) {
    console.error('缺少 STRAPI_TOKEN。\n后台 Settings → API Tokens → Create new API Token（Full access），然后：\n  $env:STRAPI_TOKEN="你的token"; node scripts/seed-global-product-blocks.mjs')
    process.exit(1)
  }

  console.log(`目标：${STRAPI_URL}`)
  console.log('上传图片并组装数据…')
  const data = await buildPayload()

  const res = await fetch(`${STRAPI_URL}/api/global-product-block`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ data })
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    console.error('写入失败：', res.status, JSON.stringify(json, null, 2))
    process.exit(1)
  }

  console.log('\n✔ 已写入 Global Product Blocks：')
  console.log(`   工艺配图      ${data.craftImages.length} 张`)
  console.log(`   参数兜底行    ${data.specDefaults.length} 行`)
  console.log(`   认证          ${data.certifications.length} 条（有证书图 ${data.certifications.filter(c => c.image).length} 条）`)
  console.log(`   客户 logo     ${data.clients.length} 个（有图 ${data.clients.filter(c => c.image).length} 个）`)
  console.log(`   工厂实拍      ${data.factoryShots.length} 张`)
  console.log(`   信息块        ${data.infoBlocks.length} 个`)
  console.log(`   FAQ           ${data.detailFaqs.length} 条`)
  console.log('\n前端 ISR 最多 5 分钟刷新，刷新后可在任意产品详情页看到这些区块。')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
