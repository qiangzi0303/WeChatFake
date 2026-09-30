# -*- coding: utf-8 -*-
"""生成 Android 应用图标与启动页素材。

输入：仓库根的 logo.png（四周有白边，需裁切）、loading.webp
输出：
  1. packages/web/src/assets/splash.webp      —— 页面内 React 启动页用
  2. packages/web/android/.../mipmap-*/        —— 各密度应用图标
  3. packages/web/android/.../drawable*/splash.png —— 原生启动屏兜底
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, "packages", "web")
RES = os.path.join(WEB, "android", "app", "src", "main", "res")

LOGO = os.path.join(ROOT, "logo.png")
# 微信官方 App 图标母图（tools/fetch_official_logo.py 下载），优先使用
LOGO_OFFICIAL = os.path.join(ROOT, "logo_official_1024.png")
LOADING = os.path.join(ROOT, "loading.webp")


def trim_white(img, tol=246):
    """裁掉四周接近白色的留白，只留图标主体。"""
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()

    def is_bg(x, y):
        r, g, b = px[x, y]
        return r >= tol and g >= tol and b >= tol

    left, right, top, bottom = 0, w - 1, 0, h - 1
    while left < right and all(is_bg(left, y) for y in range(h)):
        left += 1
    while right > left and all(is_bg(right, y) for y in range(h)):
        right -= 1
    while top < bottom and all(is_bg(x, top) for x in range(w)):
        top += 1
    while bottom > top and all(is_bg(x, bottom) for x in range(w)):
        bottom -= 1
    return img.crop((left, top, right + 1, bottom + 1))


def square_pad(img):
    """补成正方形（用图标自身边缘色填充，避免出现白边）。"""
    w, h = img.size
    side = max(w, h)
    bg = img.convert("RGB").getpixel((w // 2, h // 2))
    canvas = Image.new("RGB", (side, side), bg)
    canvas.paste(img.convert("RGB"), ((side - w) // 2, (side - h) // 2))
    return canvas


def brand_color(img):
    """取图标主体绿色（避开圆角处的白色，从中心偏下取样）。"""
    rgb = img.convert("RGB")
    w, h = rgb.size
    # 中心区域采样，取出现最多的非白像素
    from collections import Counter
    c = Counter()
    for x in range(w // 4, w * 3 // 4, 3):
        for y in range(h // 4, h * 3 // 4, 3):
            p = rgb.getpixel((x, y))
            if not (p[0] > 235 and p[1] > 235 and p[2] > 235):
                c[p] += 1
    return c.most_common(1)[0][0] if c else (7, 193, 96)


def whites_to_transparent(img, tol=246):
    """把圆角外的白色区域转为透明（仅处理与四角连通的白色，保留气泡内部的白）。"""
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()

    def is_white(p):
        return p[0] >= tol and p[1] >= tol and p[2] >= tol

    # 从四角做洪水填充，只清掉外侧背景白
    stack = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    seen = set()
    while stack:
        x, y = stack.pop()
        if not (0 <= x < w and 0 <= y < h) or (x, y) in seen:
            continue
        seen.add((x, y))
        if not is_white(px[x, y]):
            continue
        px[x, y] = (0, 0, 0, 0)
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return img


def strip_bright_border(img, ratio=3.0, min_gap=40):
    """裁掉素材自带的亮色描边（1~2px）。

    逐边比较最外一列/行与内侧的平均亮度，明显更亮就剥掉，
    最多各剥 3px，避免误伤正常画面内容。
    """
    def row_lum(im, y):
        w = im.size[0]
        px = im.load()
        return sum(sum(px[x, y][:3]) / 3 for x in range(0, w, 2)) / len(range(0, w, 2))

    def col_lum(im, x):
        h = im.size[1]
        px = im.load()
        return sum(sum(px[x, y][:3]) / 3 for y in range(0, h, 2)) / len(range(0, h, 2))

    img = img.convert("RGB")
    for _ in range(3):
        w, h = img.size
        l, t, r, b = 0, 0, w, h
        if col_lum(img, 0) > col_lum(img, 2) * ratio + min_gap:
            l += 1
        if col_lum(img, w - 1) > col_lum(img, w - 3) * ratio + min_gap:
            r -= 1
        if row_lum(img, 0) > row_lum(img, 2) * ratio + min_gap:
            t += 1
        if row_lum(img, h - 1) > row_lum(img, h - 3) * ratio + min_gap:
            b -= 1
        if (l, t, r, b) == (0, 0, w, h):
            break
        img = img.crop((l, t, r, b))
        print(f"  剥离亮边 -> {img.size}")
    return img


def rounded_mask(size, radius_ratio=0.2245):
    """生成 iOS/Android 风格圆角遮罩。

    radius_ratio 取 0.2245 —— iOS 图标圆角半径约为边长的 22.45%。
    官方母图是方角满幅的（这是 App 图标母图的标准形态，圆角本该由
    系统遮罩负责），但 legacy mipmap 槽位（Android 7 及更早）不套
    遮罩，直接用会是硬角方块，所以那一路要自己切圆角。
    Android 8+ 走 adaptive-icon，圆角由系统按厂商形状套，不在这里处理。
    """
    from PIL import ImageDraw

    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size * 4 - 1, size * 4 - 1),
        radius=int(size * 4 * radius_ratio),
        fill=255,
    )
    return mask.resize((size, size), Image.LANCZOS)


def gradient_background(src, size):
    """从母图提取垂直渐变，生成不含气泡的纯渐变背景。

    逐行取该行出现最多的非白像素作为该行底色，这样官方那道
    顶部亮、底部深的渐变能完整保留，而白色气泡被剔除。
    """
    from collections import Counter

    rgb = src.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    strip = Image.new("RGB", (1, h))
    sp = strip.load()
    for y in range(h):
        c = Counter()
        for x in range(0, w, 4):
            p = px[x, y]
            if not (p[0] > 200 and p[1] > 200 and p[2] > 200):
                c[p] += 1
        sp[0, y] = c.most_common(1)[0][0] if c else (7, 193, 96)
    return strip.resize((size, size), Image.LANCZOS)


def extract_glyph(src):
    """把母图的白色气泡抠成透明背景的图层。

    alpha 按「白度」计算，绿色区域全透明。气泡内的绿色圆点
    因此自然镂空，会露出背景层的绿，和官方观感一致。
    """
    rgb = src.convert("RGB")
    w, h = rgb.size
    out = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    sp = rgb.load()
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = sp[x, y]
            # 绿底 G 远大于 R；白色三通道都高。用 R 通道区分最干净
            a = max(0, min(255, int((r - 60) * 255 / (235 - 60))))
            if a:
                op[x, y] = (255, 255, 255, a)
    return out


# ---- 1. 应用图标 ----
# Android 各密度 launcher 图标尺寸（legacy 槽位，48dp 基准）
ICON_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

# adaptive-icon 的 fg/bg 画布是 108dp（系统只显示中间 72dp，
# 其余 18dp 留给视差和形状裁切）。用 legacy 的 48dp 尺寸会偏小模糊。
ADAPTIVE_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}
# 母图在 108dp 画布里占 72/108，使系统可见区内的构图与母图 1:1 一致
SAFE_RATIO = 72 / 108

# 官方母图（腾讯上传至 App Store 的原始图稿，1024x1024 方角满幅、
# 带垂直渐变、无 alpha）。缺失时回退到旧的横版 logo.png 流程。
USE_OFFICIAL = os.path.exists(LOGO_OFFICIAL)
if USE_OFFICIAL:
    logo = Image.open(LOGO_OFFICIAL).convert("RGBA")
    logo_t = logo  # 已是正方形满幅，无需裁白边 / 补方 / 抠白角
    print(f"使用官方母图: {logo.size}")
else:
    logo = square_pad(trim_white(Image.open(LOGO)))
    logo_t = whites_to_transparent(logo)
    print(f"回退旧素材，裁切后: {logo.size}")

GREEN = brand_color(logo)
print(f"品牌色: #{GREEN[0]:02x}{GREEN[1]:02x}{GREEN[2]:02x}")

glyph = extract_glyph(logo) if USE_OFFICIAL else None

for folder, size in ICON_SIZES.items():
    d = os.path.join(RES, folder)
    os.makedirs(d, exist_ok=True)

    # --- legacy 槽位（Android 7-）：自己切圆角，圆角外透明 ---
    base = logo_t.resize((size, size), Image.LANCZOS)
    icon = base.copy()
    icon.putalpha(rounded_mask(size))
    icon.save(os.path.join(d, "ic_launcher.png"))
    circle = Image.new("L", (size * 4, size * 4), 0)
    from PIL import ImageDraw as _ID

    _ID.Draw(circle).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    icon_r = base.copy()
    icon_r.putalpha(circle.resize((size, size), Image.LANCZOS))
    icon_r.save(os.path.join(d, "ic_launcher_round.png"))

    # --- adaptive 槽位（Android 8+）：圆角交给系统，这里只管两层内容 ---
    asize = ADAPTIVE_SIZES[folder]
    if USE_OFFICIAL:
        # 背景层：满幅渐变，保住官方顶亮底深的过渡
        gradient_background(logo, asize).save(
            os.path.join(d, "ic_launcher_background.png"))
        # 前景层：只有白气泡，缩到 72/108 安全区，透明底
        fg = Image.new("RGBA", (asize, asize), (0, 0, 0, 0))
        inner_side = int(asize * SAFE_RATIO)
        inner = glyph.resize((inner_side, inner_side), Image.LANCZOS)
        off = (asize - inner_side) // 2
        fg.paste(inner, (off, off), inner)
    else:
        # 旧素材没有干净的气泡图层，退回「绿底 + 整块 logo」的老做法
        fg = Image.new("RGBA", (asize, asize), (*GREEN, 255))
        inner = logo_t.resize((int(asize * 0.72),) * 2, Image.LANCZOS)
        off = (asize - inner.size[0]) // 2
        fg.paste(inner, (off, off), inner)
    fg.save(os.path.join(d, "ic_launcher_foreground.png"))
    print(f"  {folder}: legacy {size}x{size} | adaptive {asize}x{asize}")

# 自适应图标背景色：跟随品牌绿（legacy 兜底与纯色回退路径都要用）
hexc = f"#{GREEN[0]:02X}{GREEN[1]:02X}{GREEN[2]:02X}"
bg_xml = os.path.join(RES, "values", "ic_launcher_background.xml")
with open(bg_xml, "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
            f'    <color name="ic_launcher_background">{hexc}</color>\n</resources>\n')
print(f"自适应图标背景色 -> {hexc}")

# adaptive-icon 描述文件。用官方母图时 background 指向渐变图片，
# 否则退回纯色（Android 8+ 只读这两个 xml，不读 mipmap 里的 png）
anydpi = os.path.join(RES, "mipmap-anydpi-v26")
os.makedirs(anydpi, exist_ok=True)
bg_ref = "@mipmap/ic_launcher_background" if USE_OFFICIAL else "@color/ic_launcher_background"
for xml_name in ("ic_launcher.xml", "ic_launcher_round.xml"):
    with open(os.path.join(anydpi, xml_name), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n'
                '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
                f'    <background android:drawable="{bg_ref}"/>\n'
                '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
                '</adaptive-icon>\n')
print(f"adaptive-icon background -> {bg_ref}")


# ---- 2. 页面内 React 启动页素材 ----
assets_dir = os.path.join(WEB, "src", "assets")
os.makedirs(assets_dir, exist_ok=True)
loading = Image.open(LOADING).convert("RGB")
# 素材右侧自带 1px 灰白描边，缩放后会在黑底上显出一条竖白线，需先剥掉
loading = strip_bright_border(loading)
loading.save(os.path.join(assets_dir, "splash.webp"), "WEBP", quality=92)
print(f"splash.webp -> src/assets ({loading.size})")

# ---- 3. 原生启动屏兜底 ----
# 原生只做极短过渡，铺一张深色底图即可；按最长边缩放到目标尺寸再居中裁切
SPLASH_SIZES = {
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
    "drawable": (480, 800),
}


def cover(img, tw, th):
    """等比缩放铺满目标尺寸后居中裁切，保证不变形。"""
    w, h = img.size
    scale = max(tw / w, th / h)
    r = img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    x = (r.size[0] - tw) // 2
    y = (r.size[1] - th) // 2
    return r.crop((x, y, x + tw, y + th))


for folder, (tw, th) in SPLASH_SIZES.items():
    d = os.path.join(RES, folder)
    os.makedirs(d, exist_ok=True)
    cover(loading, tw, th).save(os.path.join(d, "splash.png"))
print(f"原生 splash.png -> {len(SPLASH_SIZES)} 个 drawable 目录")
print("DONE")
