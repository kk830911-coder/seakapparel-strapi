/**
 * 批量压缩详情区配图（照片压到 <=300KB，logo 保留透明）。
 *
 * 用法：
 *   node scripts/compress-images.mjs            # 按默认 300KB 处理
 *   node scripts/compress-images.mjs --webp     # 照片/证书额外再出一份 .webp（体积更小，seed 优先用）
 *   node scripts/compress-images.mjs --max-kb=250
 *   node scripts/compress-images.mjs --dry      # 只统计，不写文件
 *
 * 目录约定：
 *   scripts/seed-data/images-raw/   放原图（可以任意大，PS 导出的 3MB PNG 直接丢进来）
 *   scripts/seed-data/images/       脚本输出的成品，seed 脚本读的就是这里
 *
 * 规则：
 *   craft/ factory/  照片 → JPEG（去元数据，宽 <=1600）
 *   cert/            证书扫描件 → JPEG q88（文字最清晰的前提下压到目标体积）
 *   clients/         客户 logo → PNG 调色板（保留透明背景，宽 <=600）
 *
 * 文件名保持不变，只换扩展名，所以 seed 脚本里的 *File 字段不用改。
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RAW_DIR = path.join(__dirname, 'seed-data', 'images-raw')
const OUT_DIR = path.join(__dirname, 'seed-data', 'images')
const DRY = process.argv.includes('--dry')
const WEBP = process.argv.includes('--webp')

const argMax = process.argv.find(a => a.startsWith('--max-kb='))
const MAX_KB = argMax ? Number(argMax.split('=')[1]) : 300

const RULES = {
  craft: { format: 'jpeg', width: 1600, maxKb: MAX_KB },
  factory: { format: 'jpeg', width: 1600, maxKb: MAX_KB },
  cert: { format: 'jpeg', width: 1400, maxKb: MAX_KB, qualityStart: 90 },
  clients: { format: 'png', width: 600, maxKb: 150 }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(png|jpe?g|webp|tiff?)$/i.test(entry.name) ? [full] : []
  })
}

function kb(bytes) {
  return (bytes / 1024).toFixed(0) + 'KB'
}

async function toJpeg(input, rule) {
  let quality = rule.qualityStart || 82
  let buf = null
  while (quality >= 40) {
    buf = await sharp(input)
      .rotate()
      .resize({ width: rule.width, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true, progressive: true })
      .toBuffer()
    if (buf.length <= rule.maxKb * 1024) break
    quality -= 6
  }
  return { buf, quality, note: `q${quality}` }
}

async function toWebp(input, rule) {
  let quality = rule.qualityStart ? Math.min(rule.qualityStart, 80) : 80
  let buf = null
  while (quality >= 40) {
    buf = await sharp(input)
      .rotate()
      .resize({ width: rule.width, withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer()
    if (buf.length <= rule.maxKb * 1024) break
    quality -= 6
  }
  return { buf, note: `q${quality}` }
}

async function toPng(input, rule) {
  // logo：保透明，用调色板量化，必要时逐步缩小宽度
  let width = rule.width
  let buf = null
  while (width >= 200) {
    buf = await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true, quality: 92, effort: 9 })
      .toBuffer()
    if (buf.length <= rule.maxKb * 1024) break
    width -= 100
  }
  return { buf, note: `w${width}` }
}

async function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.log(`没有找到原图目录：${RAW_DIR}`)
    console.log('请把原图按 craft/ cert/ clients/ factory/ 放进去后再运行。')
    return
  }

  const files = walk(RAW_DIR)
  if (!files.length) {
    console.log(`${RAW_DIR} 下没有图片。`)
    return
  }

  console.log(`原图目录：${RAW_DIR}`)
  console.log(`输出目录：${OUT_DIR}`)
  console.log(`目标体积：照片/证书 <=${MAX_KB}KB，logo <=150KB\n`)

  let savedTotal = 0
  let srcTotal = 0

  for (const file of files) {
    const rel = path.relative(RAW_DIR, file)
    const seg = rel.split(path.sep)[0]
    const rule = RULES[seg] || RULES.craft
    const base = path.basename(rel, path.extname(rel))
    const outName = `${base}.${rule.format === 'png' ? 'png' : 'jpg'}`
    const outPath = path.join(OUT_DIR, path.dirname(rel), outName)

    const srcSize = fs.statSync(file).size
    srcTotal += srcSize

    const meta = await sharp(file).metadata()
    let result
    let webp = null
    try {
      result = rule.format === 'png' ? await toPng(file, rule) : await toJpeg(file, rule)
      // --webp：照片/证书额外出一份 WebP（同样画质约为 JPEG 的 60% 体积）
      if (WEBP && rule.format !== 'png') webp = await toWebp(file, rule)
      // 个别画面（大面积噪点、细碎纹理）下 WebP 反而更大，这种情况保留 JPEG
      if (webp && webp.buf.length >= result.buf.length) {
        console.log(`   · WebP 未更小（${kb(webp.buf.length)} vs ${kb(result.buf.length)}），${rel} 保留 JPEG`)
        webp = null
      }
    } catch (e) {
      console.log(`  ! 处理失败 ${rel}: ${e.message}`)
      continue
    }

    // 最终采用的文件：有 WebP 就用 WebP
    const finalSize = webp ? webp.buf.length : result.buf.length
    const over = finalSize > rule.maxKb * 1024
    const ratio = (srcSize / finalSize).toFixed(1)

    let line = `${over ? '△' : '✓'} ${rel}  ${meta.width}x${meta.height}  ${kb(srcSize)} → ${kb(result.buf.length)}`
    if (webp) line += ` / webp ${kb(webp.buf.length)}`
    line += `  (${result.note}, 压缩 ${ratio}x)`
    console.log(line)

    if (!DRY) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true })
      fs.writeFileSync(outPath, result.buf)
      if (webp) fs.writeFileSync(path.join(path.dirname(outPath), `${base}.webp`), webp.buf)
    }
    savedTotal += srcSize - finalSize
  }

  console.log(`\n合计：${kb(srcTotal)} → ${kb(srcTotal - savedTotal)}，省下 ${kb(savedTotal)}`)
  if (DRY) console.log('（--dry：未写入任何文件）')
  else console.log(`\n成品已输出到 scripts/seed-data/images/，接着运行：\n  node scripts/seed-global-product-blocks.mjs`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
