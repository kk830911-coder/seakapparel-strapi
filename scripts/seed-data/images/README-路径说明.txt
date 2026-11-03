图片目录说明
================

一共两步：先把原图丢进 images-raw/，压缩脚本会把成品写到 images/。

【1】原图放这里（多大都行，PS 导出的 3MB PNG 直接丢）
  scripts/seed-data/images-raw/
    craft/      工艺与面料配图
    cert/       证书扫描件
    clients/    客户 logo（透明背景 PNG）
    factory/    工厂实拍

【2】运行压缩（自动压到 <=300KB，logo <=150KB，保留文件名）
  node scripts/compress-images.mjs
  可选：node scripts/compress-images.mjs --webp       # 额外出一份 .webp，seed 会自动优先用
        node scripts/compress-images.mjs --max-kb=250
        node scripts/compress-images.mjs --dry        # 只看统计不写文件
  说明：只有在 WebP 确实更小时才会采用，否则保留 JPEG（脚本会打印提示）

【3】成品会出现在这里，seed 脚本读的就是它
  scripts/seed-data/images/

文件名对照（扩展名会自动变成 .jpg 或 .png，不用管原图格式）：

craft/      工艺与面料配图
  sublimation-printing-line   数码印花线
  heat-press                  热压/转印
  laser-cutting               激光裁剪
  sewing-floor                缝制车间

cert/       证书扫描件（文字要能看清）
  iso-9001
  bsci
  wrap
  oeko-tex

clients/    客户 logo（注意使用授权）
  cliff-keen
  dickies
  rudis

factory/    工厂实拍
  sublimation-line
  heat-press
  laser-cutting
  sewing-floor
  quality-check
  packing

缺失的文件会被自动跳过，对应条目只是没有配图，不会中断写入。
