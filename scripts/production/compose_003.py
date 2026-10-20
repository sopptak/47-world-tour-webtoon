#!/usr/bin/env python3
"""EP.003 컷 합성 도구.

그림(인물·배경)과 글자(말풍선·내레이션·화면 숫자)를 따로 만들어 합치기 위한 스크립트.
AI 이미지 생성은 하지 않는다. 그림 파일은 사람이 만들어 production/003/art/NN.png 로 넣는다.

만드는 것
  production/003/lettering/NN.png  컷 번호·테두리·말풍선·예고 띠만 있는 투명 레이어 (1080px 폭)
  production/003/ui/*.png          휴대전화 화면 (그림 속 화면에 얹을 것)
  production/003/notes/*.png       노트 손글씨 (그림 속 노트에 얹을 것)
  production/003/art/03.png, 10.png  인물 없이 화면만 나오는 컷의 그림 (코드로 그림)
  episodes/003/NN.jpg              art/NN.* 가 있는 컷만 최종 합성
  production/003/qa-report.md      자동 검수 결과

사용법
  python3 scripts/production/compose_003.py            # 위 전부
  python3 scripts/production/compose_003.py --preview DIR  # 그림 없이 글자 배치 미리보기
글꼴(OFL)이 production/fonts/ 에 없으면 내려받는다.
"""
import argparse
import random
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
PROD = ROOT / "production" / "003"
FONTS = ROOT / "production" / "fonts"
OUT = ROOT / "episodes" / "003"
W = 1080
MIN_GLYPH = -(-W * 375 // 10000)  # 시각 가이드 6-2: 글자 높이 ≥ 컷 가로의 3.75%

FONT_URLS = {
    "NotoSansKR.ttf": "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf",
    "Jua-Regular.ttf": "https://github.com/google/fonts/raw/main/ofl/jua/Jua-Regular.ttf",
}

BLACK, WHITE = (17, 17, 17), (255, 255, 255)
NAVY_INK, RED = (35, 36, 63), (244, 63, 56)  # 시각 가이드 2-1
APP_BLUE, NIGHT = (54, 94, 154), (39, 52, 70)

# ── 컷별 글자 배치 (docs/episode-003-production.md 3절) ─────────────────────
# speech/thought: 중심(cx, cy)과 꼬리 끝(tail). narration: 왼쪽 위(x, y) 또는 가운데(cx, y).
CUTS = {
    1: {"h": 1620, "items": [{"k": "narr", "x": 170, "y": 36, "t": "로딩은 3초였다."}]},
    2: {"h": 1080, "items": [{"k": "narr", "cx": 540, "y": 900, "t": "인생에서 가장 긴 3초였다."}]},
    3: {"h": 1350, "items": []},
    4: {"h": 1350, "items": [
        {"k": "speech", "cx": 770, "cy": 120, "t": "일, 십, 백, 천, 만…"},
        {"k": "speech", "cx": 800, "cy": 290, "t": "…십만… 백만.", "tail": (600, 480)}]},
    5: {"h": 1080, "items": [{"k": "narr", "cx": 540, "y": 930, "t": "자릿수부터 달랐다."}]},
    6: {"h": 1350, "items": [
        {"k": "speech", "cx": 580, "cy": 175, "t": "아, 맞다.\n이번 주에 카드값 나가지.", "tail": (1000, 420)}]},
    7: {"h": 1080, "items": [
        {"k": "speech", "cx": 360, "cy": 230, "t": "남는 게…\n거의 없네.", "tail": (560, 470)},
        {"k": "sfx", "x": 110, "y": 760, "t": "털썩", "rot": 8}]},
    8: {"h": 1350, "items": [
        {"k": "speech", "cx": 780, "cy": 170, "t": "이건…\n오늘은 보지 말자.", "tail": (560, 400)}]},
    9: {"h": 810, "items": [
        {"k": "narr", "cx": 540, "y": 34, "t": "세계를 한 바퀴 돌기 전에,\n통장부터 한 바퀴\n돌아봐야 할 판이었다."}]},
    10: {"h": 2160, "items": [
        {"k": "narr", "cx": 540, "y": 40, "t": "들어오는 길은 하나."},
        {"k": "narr", "cx": 540, "y": 2010, "t": "나가는 길은 여러 개."}]},
    11: {"h": 1350, "items": []},
    12: {"h": 1080, "items": [
        {"k": "narr", "cx": 560, "y": 34, "t": "숫자는 초라했다.\n그래도 처음으로,\n내가 어디 서 있는지 알게 됐다."}]},
    13: {"h": 1350, "items": [
        {"k": "speech", "cx": 560, "cy": 120, "t": "아직 안 자?", "tail": (900, 60)},
        {"k": "speech", "cx": 790, "cy": 1180, "t": "어, 어!\n이제 자려고.", "tail": (600, 980)},
        {"k": "sfx", "x": 150, "y": 1150, "t": "탁", "rot": -6}]},
    14: {"h": 1620, "band": "EP.04 아내에게 말해야 할까", "items": [
        {"k": "thought", "cx": 600, "cy": 300, "t": "이거…\n말해야 하나?", "tail": (480, 640)}]},
}

# 그림 속 화면·노트에 얹을 이미지. quad 는 그림이 생기면 [(x,y)×4: 왼쪽위, 오른쪽위, 오른쪽아래, 왼쪽아래]로 채운다.
OVERLAYS = {
    1: [{"src": "ui/01-loading.png", "quad": None}],
    2: [{"src": "ui/02-loading-almost.png", "quad": None}],
    5: [{"src": "notes/05-total.png", "quad": None}, {"src": "ui/05-balance.png", "quad": None}],
    6: [{"src": "ui/06-autopay.png", "quad": None}],
    8: [{"src": "ui/08-loan.png", "quad": None}],
    11: [{"src": "notes/11-my-place.png", "quad": None}],
    12: [{"src": "notes/12-start.png", "quad": None}],
}


# ── 글꼴 ─────────────────────────────────────────────────────────────────
def ensure_fonts():
    FONTS.mkdir(parents=True, exist_ok=True)
    for name, url in FONT_URLS.items():
        p = FONTS / name
        if not p.exists():
            print(f"글꼴 내려받는 중: {name}")
            urllib.request.urlretrieve(url, p)


_cache = {}


def font(size, weight="Bold", family="NotoSansKR.ttf"):
    key = (size, weight, family)
    if key not in _cache:
        f = ImageFont.truetype(str(FONTS / family), size)
        if family == "NotoSansKR.ttf":
            f.set_variation_by_name(weight)
        _cache[key] = f
    return _cache[key]


def text_box(text, f, spacing):
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    return d.multiline_textbbox((0, 0), text, font=f, spacing=spacing, align="center")


def glyph_height(f):
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    b = d.textbbox((0, 0), "한", font=f)
    return b[3] - b[1]


# ── 글자 요소 ──────────────────────────────────────────────────────────────
SPEECH = dict(size=52, spacing=16)


def outlined(layer, mask, stroke=5):
    """mask 모양을 흰 바탕 + 검은 테두리로 칠한다."""
    grown = mask.filter(ImageFilter.MaxFilter(stroke * 2 + 1))
    layer.paste(BLACK + (255,), (0, 0), grown)
    layer.paste(WHITE + (255,), (0, 0), mask)


def edge_point(box, tip):
    """box 가운데에서 tip 쪽으로 그은 선이 box 가장자리와 만나는 점."""
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    dx, dy = tip[0] - cx, tip[1] - cy
    sx = (x1 - x0) / 2 / abs(dx) if dx else 1e9
    sy = (y1 - y0) / 2 / abs(dy) if dy else 1e9
    s = min(sx, sy)
    return cx + dx * s, cy + dy * s, (dx, dy)


def speech(layer, it, rects):
    f = font(SPEECH["size"])
    b = text_box(it["t"], f, SPEECH["spacing"])
    tw, th = b[2] - b[0], b[3] - b[1]
    w, h = tw + 110, th + 84
    x0, y0 = int(it["cx"] - w / 2), int(it["cy"] - h / 2)
    box = (x0, y0, x0 + w, y0 + h)
    mask = Image.new("L", layer.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle(box, radius=min(h // 2, 70), fill=255)
    if it.get("tail"):
        ex, ey, (dx, dy) = edge_point(box, it["tail"])
        n = (dx * dx + dy * dy) ** 0.5 or 1
        px, py = -dy / n * 26, dx / n * 26
        ix, iy = ex - dx / n * 40, ey - dy / n * 40
        d.polygon([(ix + px, iy + py), (ix - px, iy - py), it["tail"]], fill=255)
    outlined(layer, mask)
    ImageDraw.Draw(layer).multiline_text(
        (it["cx"] - tw / 2 - b[0], it["cy"] - th / 2 - b[1]), it["t"], font=f,
        fill=BLACK, spacing=SPEECH["spacing"], align="center")
    rects.append(("말풍선", box, glyph_height(f)))


def thought(layer, it, rects):
    f = font(SPEECH["size"])
    b = text_box(it["t"], f, SPEECH["spacing"])
    tw, th = b[2] - b[0], b[3] - b[1]
    rx, ry = tw / 2 * 1.42 + 34, th / 2 * 1.42 + 34
    cx, cy = it["cx"], it["cy"]
    box = (int(cx - rx), int(cy - ry), int(cx + rx), int(cy + ry))
    d = ImageDraw.Draw(layer)
    d.ellipse(box, fill=WHITE + (255,))
    for a in range(0, 360, 14):  # 점선 테두리
        d.arc(box, a, a + 8, fill=BLACK + (255,), width=5)
    tx, ty = it["tail"]
    for i, r in enumerate((20, 13)):  # 생각 꼬리: 작은 동그라미 둘
        t = 0.45 + 0.3 * i
        ex, ey = cx + (tx - cx) * t, cy + ry + (ty - cy - ry) * t
        d.ellipse((ex - r, ey - r, ex + r, ey + r), fill=WHITE + (255,), outline=BLACK + (255,), width=4)
    d.multiline_text((cx - tw / 2 - b[0], cy - th / 2 - b[1]), it["t"], font=f,
                     fill=BLACK, spacing=SPEECH["spacing"], align="center")
    rects.append(("속마음", box, glyph_height(f)))


def narration(layer, it, rects):
    f = font(50)
    b = text_box(it["t"], f, 16)
    tw, th = b[2] - b[0], b[3] - b[1]
    w, h = tw + 72, th + 58
    x0 = int(it["cx"] - w / 2) if "cx" in it else it["x"]
    y0 = it["y"]
    box = (x0, y0, x0 + w, y0 + h)
    d = ImageDraw.Draw(layer)
    d.rectangle(box, fill=WHITE + (255,), outline=BLACK + (255,), width=5)
    d.multiline_text((x0 + 36 - b[0], y0 + 29 - b[1]), it["t"], font=f, fill=BLACK, spacing=16, align="left")
    rects.append(("내레이션", box, glyph_height(f)))


def sfx(layer, it, rects):
    f = font(84, "Black")
    tmp = Image.new("RGBA", (420, 220), (0, 0, 0, 0))
    ImageDraw.Draw(tmp).text((30, 30), it["t"], font=f, fill=BLACK + (255,),
                              stroke_width=7, stroke_fill=WHITE + (255,))
    tmp = tmp.rotate(it.get("rot", 0), expand=True, resample=Image.BICUBIC).crop(None)
    bbox = tmp.getbbox()
    tmp = tmp.crop(bbox)
    layer.alpha_composite(tmp, (it["x"], it["y"]))
    rects.append(("효과음", (it["x"], it["y"], it["x"] + tmp.width, it["y"] + tmp.height), glyph_height(f)))


def frame(layer, no, band=None):
    d = ImageDraw.Draw(layer)
    hgt = layer.height
    if band:
        d.rectangle((0, hgt - 150, W, hgt), fill=BLACK + (255,))
        f = font(62)
        b = d.textbbox((0, 0), band, font=f)
        d.text((44 - b[0], hgt - 75 - (b[1] + b[3]) / 2), band, font=f, fill=WHITE)
    d.rectangle((0, 0, 140 if no >= 10 else 118, 112), fill=BLACK + (255,))
    f = font(74)
    s = str(no)
    b = d.textbbox((0, 0), s, font=f)
    bw = 140 if no >= 10 else 118
    d.text(((bw - (b[2] - b[0])) / 2 - b[0], (112 - (b[3] - b[1])) / 2 - b[1]), s, font=f, fill=WHITE)
    d.rectangle((0, 0, W - 1, hgt - 1), outline=BLACK + (255,), width=6)
    return (0, 0, bw, 112)


def lettering(no):
    spec = CUTS[no]
    layer = Image.new("RGBA", (W, spec["h"]), (0, 0, 0, 0))
    rects = []
    for it in spec["items"]:
        {"speech": speech, "thought": thought, "narr": narration, "sfx": sfx}[it["k"]](layer, it, rects)
    numbox = frame(layer, no, spec.get("band"))
    return layer, rects, numbox


# ── 휴대전화 화면 (그림 위에 얹는 UI) ────────────────────────────────────────
def bank_icon(d, cx, cy, s, color=WHITE):
    d.polygon([(cx - s, cy - s * 0.35), (cx, cy - s), (cx + s, cy - s * 0.35)], fill=color)
    for i in range(4):
        x = cx - s * 0.72 + i * s * 0.48
        d.rectangle((x - s * 0.1, cy - s * 0.25, x + s * 0.1, cy + s * 0.55), fill=color)
    d.rectangle((cx - s, cy + s * 0.62, cx + s, cy + s * 0.8), fill=color)


def loading_screen(lit, total=12, size=(720, 1280)):
    img = Image.new("RGB", size, APP_BLUE)
    d = ImageDraw.Draw(img)
    cx = size[0] / 2
    bank_icon(d, cx, size[1] * 0.40, 70)
    r = 95
    import math
    for i in range(total):
        a = -math.pi / 2 + i * 2 * math.pi / total
        x, y = cx + r * math.cos(a), size[1] * 0.62 + r * math.sin(a)
        rr = 15 if i < lit else 11
        col = WHITE if i < lit else (150, 172, 205)
        d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=col)
    return img


def blurred_amount(w=300, h=60, seed=0):
    rnd = random.Random(seed)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    txt = f"{rnd.randint(10, 999)},{rnd.randint(100, 999)}원"
    ImageDraw.Draw(img).text((w - 10, h / 2), txt, font=font(44, "Medium"), fill=(60, 60, 70, 255), anchor="rm")
    return img.filter(ImageFilter.GaussianBlur(9))  # 금액은 읽히지 않게(대본 컷 6)


def app_frame(size, title):
    img = Image.new("RGB", size, WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, size[0], 200), fill=APP_BLUE)
    bank_icon(d, 80, 110, 34)
    d.text((140, 110), title, font=font(46), fill=WHITE, anchor="lm")
    return img, d


def ui_balance_small():
    img, d = app_frame((720, 1280), "입출금 통장")
    d.text((60, 300), "입출금 잔액", font=font(44, "Medium"), fill=(110, 110, 120))
    d.text((60, 380), "1,284,560원", font=font(92), fill=BLACK)
    for i in range(5):
        d.rounded_rectangle((60, 600 + i * 120, 660, 660 + i * 120), 14, fill=(236, 239, 244))
    return img


def ui_autopay():
    img, d = app_frame((720, 1280), "자동이체 예정")
    for i, name in enumerate(["카드 대금", "관리비", "대출 이자", "통신비"]):
        y = 280 + i * 200
        d.text((60, y + 50), name, font=font(54), fill=BLACK, anchor="lm")
        img.paste(blurred_amount(seed=i), (360, y + 20), blurred_amount(seed=i))
        d.line((40, y + 150, 680, y + 150), fill=(225, 228, 234), width=3)
    return img


def ui_loan():
    img, d = app_frame((720, 1280), "대출")
    d.rounded_rectangle((40, 260, 680, 700), 30, fill=(240, 243, 248))
    d.text((90, 320), "대출 잔액", font=font(54), fill=(60, 60, 70))
    # 금액 자리는 비워 둔다(엄지로 가리는 컷, 24화 전까지 금액을 정하지 않음)
    d.rectangle((0, 1150, 720, 1280), fill=(246, 247, 250))
    for i, t in enumerate(["홈", "이체", "내역", "대출"]):
        x = 90 + i * 180
        col = APP_BLUE if t == "대출" else (140, 140, 150)
        d.text((x, 1215), t, font=font(40), fill=col, anchor="mm")
    return img


# ── 노트 손글씨 ───────────────────────────────────────────────────────────
def note(lines, underline=None, strike=None, arrow=None, size=(1600, 600)):
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font(88, family="Jua-Regular.ttf")
    y = 30
    pos = []
    for ln in lines:
        b = d.textbbox((40, y), ln, font=f)
        d.text((40, y), ln, font=f, fill=NAVY_INK)
        pos.append(b)
        y = b[3] + 34
    if strike is not None:
        b = pos[strike[0]]
        x0 = 40 + d.textlength(lines[strike[0]][:strike[1]], font=f)
        x1 = 40 + d.textlength(lines[strike[0]][:strike[2]], font=f)
        my = (b[1] + b[3]) / 2
        d.line((x0 - 8, my, x1 + 8, my), fill=NAVY_INK, width=9)
    if arrow is not None:  # Jua 글꼴에 "→"가 없어서 선으로 그린다
        b = pos[arrow[0]]
        x0 = 40 + d.textlength(lines[arrow[0]][:arrow[1]], font=f) + 18
        x1 = 40 + d.textlength(lines[arrow[0]][:arrow[2]], font=f) - 22
        my = (b[1] + b[3]) / 2
        d.line((x0, my, x1, my), fill=NAVY_INK, width=10)
        d.polygon([(x1 + 6, my), (x1 - 26, my - 22), (x1 - 26, my + 22)], fill=NAVY_INK)
    if underline is not None:
        b = pos[underline[0]]
        x0 = 40 + d.textlength(lines[underline[0]][:underline[1]], font=f)
        d.line((x0, b[3] + 14, b[2] + 10, b[3] + 8), fill=RED, width=11)
    return img.crop(img.getbbox())


# ── 인물이 없는 화면 컷 (컷 3, 10) ──────────────────────────────────────────
def dark_bg(h):
    img = Image.new("RGB", (W, h), NIGHT)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        d.line((0, y, W, y), fill=(int(28 + 14 * t), int(34 + 16 * t), int(48 + 20 * t)))
    return img


def phone_body(img, box, screen):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = box
    glow = Image.new("L", img.size, 0)
    ImageDraw.Draw(glow).rounded_rectangle((x0 - 40, y0 - 40, x1 + 40, y1 + 40), 120, fill=90)
    img.paste(Image.new("RGB", img.size, (70, 100, 150)), (0, 0), glow.filter(ImageFilter.GaussianBlur(50)))
    d.rounded_rectangle(box, 90, fill=(20, 20, 24))
    d.rounded_rectangle((x0 + 6, y0 + 6, x1 - 6, y1 - 6), 86, outline=(70, 70, 80), width=3)
    sx0, sy0, sx1, sy1 = x0 + 26, y0 + 26, x1 - 26, y1 - 26
    scr = screen.resize((sx1 - sx0, sy1 - sy0), Image.LANCZOS)
    m = Image.new("L", scr.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, scr.width - 1, scr.height - 1), 66, fill=255)
    img.paste(scr, (sx0, sy0), m)


def art_03():
    img = dark_bg(1350)
    scr = Image.new("RGB", (1000, 1500), WHITE)
    d = ImageDraw.Draw(scr)
    d.rectangle((0, 0, 1000, 330), fill=APP_BLUE)
    bank_icon(d, 500, 200, 70)
    d.text((500, 470), "입출금 잔액", font=font(60, "Medium"), fill=(110, 110, 120), anchor="mm")
    d.text((500, 640), "1,284,560원", font=font(132), fill=BLACK, anchor="mm")
    for i in range(4):
        d.rounded_rectangle((80, 860 + i * 150, 920, 950 + i * 150), 20, fill=(236, 239, 244))
    phone_body(img, (60, 70, 1020, 1500), scr)
    return img


def art_10():
    h = 2160
    img = dark_bg(h)
    rows = 15
    scr = Image.new("RGB", (1000, 2400), WHITE)
    d = ImageDraw.Draw(scr)
    d.rectangle((0, 0, 1000, 230), fill=APP_BLUE)
    bank_icon(d, 90, 120, 40)
    d.text((160, 120), "거래 내역", font=font(58), fill=WHITE, anchor="lm")
    d.rectangle((0, 250, 1000, 420), fill=(225, 236, 252))
    d.text((60, 335), "입금 · 급여", font=font(62), fill=APP_BLUE, anchor="lm")
    scr.paste(blurred_amount(380, 70, 99), (560, 300), blurred_amount(380, 70, 99))
    for i in range(rows):
        y = 450 + i * 128
        d.text((60, y + 60), "출금", font=font(58), fill=(60, 60, 70), anchor="lm")
        a = blurred_amount(380, 70, i)
        scr.paste(a, (560, y + 25), a)
        d.line((40, y + 124, 960, y + 124), fill=(228, 230, 236), width=3)
    # 아래로 갈수록 흐려짐
    fade = Image.new("L", scr.size, 0)
    fd = ImageDraw.Draw(fade)
    for y in range(1200, scr.height):
        fd.line((0, y, scr.width, y), fill=min(255, int((y - 1200) / (scr.height - 1300) * 255)))
    scr.paste(Image.new("RGB", scr.size, (36, 44, 60)), (0, 0), fade)
    phone_body(img, (60, 220, 1020, h + 300), scr)
    bottom = Image.new("L", img.size, 0)
    bd = ImageDraw.Draw(bottom)
    for y in range(h - 700, h):
        bd.line((0, y, W, y), fill=int((y - h + 700) / 700 * 235))
    img.paste(dark_bg(h), (0, 0), bottom)
    return img


# ── 합성 ──────────────────────────────────────────────────────────────────
def perspective(src, quad, size):
    import numpy as np
    w, h = src.size
    dst = [(0, 0), (w, 0), (w, h), (0, h)]
    A, B = [], []
    for (x, y), (u, v) in zip(quad, dst):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
        B += [u, v]
    coeffs = np.linalg.solve(np.array(A, float), np.array(B, float))
    return src.convert("RGBA").transform(size, Image.PERSPECTIVE, tuple(coeffs), Image.BICUBIC)


def find_art(no):
    for ext in ("png", "jpg", "jpeg", "webp"):
        p = PROD / "art" / f"{no:02d}.{ext}"
        if p.exists():
            return p
    return None


def cover(img, size):
    s = max(size[0] / img.width, size[1] / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    x, y = (img.width - size[0]) // 2, (img.height - size[1]) // 2
    return img.crop((x, y, x + size[0], y + size[1]))


def check(no, rects, numbox, h):
    """자동 검수. 얼굴·손 잘림은 사람이 봐야 하므로 여기서는 글자와 규격만 본다."""
    issues = []
    if W < 640 or h / W > 2.0:
        issues.append(f"규격 {W}x{h}")
    boxes = [r for r in rects if r[0] != "효과음"]
    if len(boxes) > 2:
        issues.append(f"글 상자 {len(boxes)}개 (2개 이하 권장)")
    for kind, b, gh in rects:
        if gh < MIN_GLYPH:
            issues.append(f"{kind} 글자 높이 {gh}px < {MIN_GLYPH}px")
        if b[0] < 12 or b[1] < 12 or b[2] > W - 12 or b[3] > h - 12:
            issues.append(f"{kind}이 테두리에 닿거나 밖으로 나감 {b}")
        if b[0] < numbox[2] and b[1] < numbox[3]:
            issues.append(f"{kind}이 컷 번호 상자와 겹침")
    for i, (_, a, _) in enumerate(rects):
        for _, c, _ in rects[i + 1:]:
            if a[0] < c[2] and c[0] < a[2] and a[1] < c[3] and c[1] < a[3]:
                issues.append("글 상자끼리 겹침")
    return issues


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", help="그림 없이 글자 배치만 회색 바탕에 얹어 이 폴더에 저장")
    args = ap.parse_args()
    ensure_fonts()
    for sub in ("lettering", "ui", "notes", "art"):
        (PROD / sub).mkdir(parents=True, exist_ok=True)

    loading_screen(9).save(PROD / "ui/01-loading.png")
    loading_screen(11).save(PROD / "ui/02-loading-almost.png")
    ui_balance_small().save(PROD / "ui/05-balance.png")
    ui_autopay().save(PROD / "ui/06-autopay.png")
    ui_loan().save(PROD / "ui/08-loan.png")
    note(["예상 총비용", "3,400~5,200만 원"], underline=(1, 0)).save(PROD / "notes/05-total.png")
    note(["여행비 / 집 생활비 / 예비비", "지금 내 자리: 0"]).save(PROD / "notes/11-my-place.png")
    note(["0      출발점"], underline=(0, 7), strike=(0, 0, 1), arrow=(0, 1, 7)).save(PROD / "notes/12-start.png")
    art_03().save(PROD / "art/03.png")
    art_10().save(PROD / "art/10.png")

    rows = []
    for no, spec in CUTS.items():
        layer, rects, numbox = lettering(no)
        layer.save(PROD / f"lettering/{no:02d}.png")
        issues = check(no, rects, numbox, spec["h"])
        art = find_art(no)
        pending_overlays = [o["src"] for o in OVERLAYS.get(no, []) if not o["quad"]]
        status = "그림 없음"
        if art:
            base = cover(Image.open(art).convert("RGB"), (W, spec["h"])).convert("RGBA")
            for o in OVERLAYS.get(no, []):
                if o["quad"]:
                    base.alpha_composite(perspective(Image.open(PROD / o["src"]), o["quad"], base.size))
            base.alpha_composite(layer)
            OUT.mkdir(parents=True, exist_ok=True)
            base.convert("RGB").save(OUT / f"{no:02d}.jpg", quality=90, optimize=True)
            status = "합성됨" if not pending_overlays else "합성됨(화면·노트 위치 미지정)"
        if args.preview:
            pv = Image.new("RGBA", (W, spec["h"]), (150, 150, 150, 255))
            if art:
                pv = cover(Image.open(art).convert("RGB"), (W, spec["h"])).convert("RGBA")
            pv.alpha_composite(layer)
            Path(args.preview).mkdir(parents=True, exist_ok=True)
            pv.convert("RGB").save(Path(args.preview) / f"{no:02d}.jpg", quality=85)
        rows.append((no, spec["h"], art.name if art else "-", status, len([r for r in rects if r[0] != "효과음"]),
                     min([r[2] for r in rects], default=0), ", ".join(pending_overlays) or "-",
                     "; ".join(issues) or "통과"))

    lines = ["# EP.003 자동 검수 결과", "",
             "> `scripts/production/compose_003.py`가 만든 표입니다. 얼굴·손·소품 잘림과 인물 일관성은 **사람이 눈으로** 확인해야 합니다.",
             f"> 글자 높이 기준: {MIN_GLYPH}px 이상 (1080px 폭의 3.75%)", "",
             "| 컷 | 크기 | 그림 | 상태 | 글 상자 | 최소 글자 높이(px) | 위치 지정이 필요한 화면·노트 | 글자·규격 검수 |",
             "|---|---|---|---|---|---|---|---|"]
    for no, h, art, st, n, gh, ov, iss in rows:
        lines.append(f"| {no} | {W}×{h} | {art} | {st} | {n} | {gh or '-'} | {ov} | {iss} |")
    (PROD / "qa-report.md").write_text("\n".join(lines) + "\n", encoding="utf8")
    print("\n".join(lines))
    bad = [r for r in rows if r[7] != "통과"]
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
