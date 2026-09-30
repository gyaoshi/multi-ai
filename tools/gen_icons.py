"""生成 Multi AI 扩展图标（16/32/48/128）—— 简单几何款。
设计：青绿→深蓝对角渐变圆角底 + 2×2 白色圆角方块（多窗口），右下角方块用深青强调色，
无多余图形元素，几何简洁。超采样 512 后 LANCZOS 缩小。
"""
from PIL import Image, ImageDraw
import os

S = 512
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")


def make_master():
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # 对角渐变：青绿(#2dd4bf) -> 深蓝(#0e7490)
    top = (45, 212, 191)
    bot = (14, 116, 144)
    px = img.load()
    for y in range(S):
        t = y / (S - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        for x in range(S):
            px[x, y] = (r, g, b, 255)

    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
    img.putalpha(mask)

    d = ImageDraw.Draw(img)

    # 2×2 方块格
    m = int(S * 0.16)       # 外边距
    gap = int(S * 0.055)    # 方块间距
    w = (S - 2 * m - gap) // 2
    rad = int(S * 0.10)     # 大方块圆角
    white = (255, 255, 255, 255)
    accent = (11, 74, 74, 255)   # 深青强调（右下角）

    boxes = [
        (m, m),
        (m + w + gap, m),
        (m, m + w + gap),
        (m + w + gap, m + w + gap),
    ]
    for i, (x0, y0) in enumerate(boxes):
        fill = accent if i == 3 else white
        d.rounded_rectangle([x0, y0, x0 + w, y0 + w], radius=rad, fill=fill)

    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    master = make_master()
    for size in (128, 48, 32, 16):
        icon = master.resize((size, size), Image.LANCZOS)
        icon.save(os.path.join(OUT, f"icon{size}.png"))
        print("icon%d.png" % size, "->", os.path.join(OUT, f"icon{size}.png"))


if __name__ == "__main__":
    main()
