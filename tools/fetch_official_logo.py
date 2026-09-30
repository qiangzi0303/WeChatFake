# -*- coding: utf-8 -*-
"""下载微信官方 App 图标母图（腾讯上传至 App Store 的原始图稿）。"""
import os
import ssl
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = (
    "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/61/70/2e/"
    "61702e05-0531-165f-5cd3-012c8b5b3b20/"
    "AppIcon-0-0-1x_U007epad-0-1-0-sRGB-0-85-220.png"
)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for size in (1024, 512):
    url = f"{BASE}/{size}x{size}bb.png"
    out = os.path.join(ROOT, f"logo_official_{size}.png")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=90, context=ctx) as r:
        data = r.read()
    with open(out, "wb") as f:
        f.write(data)
    print("HTTP", r.status, size, len(data), "bytes ->", out)
