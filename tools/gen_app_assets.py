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


# ---- 1. 应用图标 ----
# Android 各密度 launcher 图标尺寸
ICON_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

logo = square_pad(trim_white(Image.open(LOGO)))
GREEN = brand_color(logo)
logo_t = whites_to_transparent(logo)
print(f"logo 裁切后: {logo.size} | 品牌色: #{GREEN[0]:02x}{GREEN[1]:02x}{GREEN[2]:02x}")

for folder, size in ICON_SIZES.items():
    d = os.path.join(RES, folder)
    os.makedirs(d, exist_ok=True)
    # legacy 图标：保留原有圆角，圆角外透明（白角在深色桌面会很显眼）
    icon = logo_t.resize((size, size), Image.LANCZOS)
    icon.save(os.path.join(d, "ic_launcher.png"))
    icon.save(os.path.join(d, "ic_launcher_round.png"))
    # 自适应图标前景层：绿底铺满整块画布，主体缩到中间 72% 安全区，
    # 否则系统再裁一次形状会出现双圆角或露白角
    fg = Image.new("RGBA", (size, size), (*GREEN, 255))
    inner = logo_t.resize((int(size * 0.72),) * 2, Image.LANCZOS)
    off = (size - inner.size[0]) // 2
    fg.paste(inner, (off, off), inner)
    fg.save(os.path.join(d, "ic_launcher_foreground.png"))
    print(f"  {folder}: {size}x{size}")

# 自适应图标背景色：跟随品牌绿（默认白色会在前景绿块四周露出白边）
hexc = f"#{GREEN[0]:02X}{GREEN[1]:02X}{GREEN[2]:02X}"
bg_xml = os.path.join(RES, "values", "ic_launcher_background.xml")
with open(bg_xml, "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
            f'    <color name="ic_launcher_background">{hexc}</color>\n</resources>\n')
print(f"自适应图标背景色 -> {hexc}")


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
