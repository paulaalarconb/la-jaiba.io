"""Genera los recursos del Capítulo 1: fondo de la casona, íconos de objetos e íconos de la app."""
import os, shutil, random
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "www", "assets"); os.makedirs(A, exist_ok=True)
SPR = "/home/claude/sprites/out"
random.seed(7)

W, H, FLOOR = 1440, 270, 230
OL = "#2a1a24"
img = Image.new("RGBA", (W, H), (0, 0, 0, 255)); d = ImageDraw.Draw(img)
R = lambda x0, y0, x1, y1, c: d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=c)

def tex_noise(x0, y0, x1, y1, cols, n):
    for _ in range(n):
        x, y = random.randrange(x0, x1), random.randrange(y0, y1)
        d.point((x, y), fill=random.choice(cols))

def beams(x0, x1):
    R(x0, 0, x1, 26, "#5a3a22")
    for x in range(x0 + 10, x1, 36):
        R(x, 0, x + 10, 30, "#6b4528"); R(x, 28, x + 10, 30, "#4a2f1a"); R(x + 8, 0, x + 10, 28, "#4a2f1a")
    R(x0, 24, x1, 26, "#3a2414")

def window(x, y, w=40, h=48):
    R(x - 3, y - 3, x + w + 3, y + h + 3, "#6b4528"); R(x, y, x + w, y + h, "#9ec9ea")
    R(x, y + h * 2 // 3, x + w, y + h, "#b9dbef")
    for i in range(1, 4): R(x + i * w // 4 - 1, y, x + i * w // 4 + 1, y + h, "#2a2430")  # reja
    for j in (1, 2): R(x, y + j * h // 3 - 1, x + w, y + j * h // 3 + 1, "#2a2430")
    R(x - 5, y + h + 3, x + w + 5, y + h + 7, "#8a6a4a")

def arch(x, wall_c, inner_c):
    R(x, 30, x + 24, FLOOR, wall_c)
    R(x - 6, 60, x + 30, 70, "#6b4528")

# ---------------- COCINA 0..400
R(0, 0, 400, FLOOR, "#cdbb9f")
for y in range(30, 90): R(0, y, 400, y + 1, "#8f7f6a" if y < 50 else ("#a8977d" if y < 70 else "#bba98d"))
tex_noise(0, 30, 400, FLOOR, ["#c2b093", "#d8c8ad"], 1400)
beams(0, 400)
R(0, FLOOR, 400, H, "#9a7656"); tex_noise(0, FLOOR, 400, H, ["#86644a", "#a8845f"], 900)
R(0, FLOOR, 400, FLOOR + 2, "#6e523a")
# fogón (decoy 80..170)
R(70, 150, 180, FLOOR, "#8c8478"); R(70, 150, 180, 156, "#6e675d")
for yy in range(160, FLOOR, 10):
    for xx in range(70 + (yy // 10 % 2) * 8, 180, 16): R(xx, yy, xx + 15, yy + 9, "#9a9286"); R(xx, yy + 9, xx + 16, yy + 10, "#6e675d")
R(95, 180, 155, FLOOR, "#2a1a1a"); R(98, 183, 152, FLOOR, "#3a2420")  # boca del fogón
R(84, 90, 166, 150, "#7a7064"); R(76, 86, 174, 92, "#5e564c")  # campana
R(110, 140, 140, 152, "#2a2430"); R(106, 136, 144, 141, "#3a3440")  # olla
# repisa con ollas
R(200, 110, 300, 114, "#6b4528")
for i, c in enumerate(["#b5583a", "#9a5a3a", "#c4734a"]):
    x = 210 + i * 30; R(x, 96, x + 18, 110, c); R(x + 2, 94, x + 16, 97, "#5a2a1a")
# cántaro (hotspot 215..255)
d.ellipse([214, 182, 256, 226], fill="#a6502e"); d.ellipse([220, 186, 250, 206], fill="#b8603a")
R(226, 172, 244, 186, "#a6502e"); R(223, 170, 247, 174, "#8a3f24"); R(232, 226, 238, FLOOR, "#7a3a20")
d.arc([214, 182, 256, 226], 200, 330, fill="#d0845a")
# despensa con ristras (decoy 300..380)
R(300, 70, 385, FLOOR, "#7a5232"); R(304, 74, 381, FLOOR, "#5e3e24")
for sx in (312, 330, 348, 366):
    R(sx + 3, 78, sx + 5, 140, "#c8b07a")
    for k in range(6):
        c = "#d93a2a" if sx % 36 == 24 else "#f0ead8"
        d.ellipse([sx, 86 + k * 9, sx + 8, 94 + k * 9], fill=c)
R(304, 150, 381, 154, "#4a2f1a"); R(310, 160, 330, 182, "#c8a46a"); R(340, 166, 372, 182, "#b08a50")
window(20, 70, 36, 42)
# arco cocina -> patio
R(396, 0, 420, FLOOR, "#efe6d6"); R(396, 0, 420, 30, "#5a3a22")

# ---------------- PATIO 420..880
for y in range(0, FLOOR):
    t = y / FLOOR; c = (int(158 + 50 * t), int(201 + 30 * t), int(234 + 8 * t), 255)
    R(420, y, 880, y + 1, c)
for cx, cy in ((520, 40), (700, 28), (820, 55)):
    for dx, dy, r in ((0, 0, 10), (12, 2, 8), (-11, 3, 7)):
        d.ellipse([cx + dx - r, cy + dy - r // 2, cx + dx + r, cy + dy + r // 2], fill="#f4f8fb")
# cordillera
pts = [(420, 120)] + [(420 + i * 20, 120 - (abs((i * 37) % 23 - 11)) * 2 - 6) for i in range(24)] + [(880, 120)]
d.polygon(pts + [(880, 130), (420, 130)], fill="#8aa6c8")
for x, y in pts[1:-1]:
    if y < 106: d.polygon([(x - 6, y + 6), (x, y), (x + 6, y + 6)], fill="#f4f8fb")
# muro del corredor con arcos
R(420, 118, 880, FLOOR - 40, "#efe6d6"); R(420, 112, 880, 120, "#b85a3a")
for x in range(420, 880, 8): R(x, 108, x + 6, 114, "#8e3f28" if (x // 8) % 2 else "#b85a3a")
for ax in range(440, 880, 70):
    d.rectangle([ax, 140, ax + 46, FLOOR - 40], fill="#c9bea9"); d.ellipse([ax, 128, ax + 46, 156], fill="#c9bea9")
    d.rectangle([ax + 4, 146, ax + 42, FLOOR - 40], fill="#a59a86"); d.ellipse([ax + 4, 132, ax + 42, 160], fill="#a59a86")
R(420, FLOOR - 40, 880, FLOOR, "#e6dcc9")
# suelo de huevillo
R(420, FLOOR, 880, H, "#a39a8c")
for y in range(FLOOR + 2, H, 5):
    for x in range(420 + (y % 10), 880, 9):
        d.ellipse([x, y, x + 6, y + 3], fill=random.choice(["#8a8174", "#b5ad9e", "#968d7f"]))
# naranjo en macetero (hotspot 490..560)
R(519, 120, 529, 200, "#6b4528"); R(521, 120, 523, 200, "#86592f")
for cx, cy, r in ((524, 110, 34), (500, 125, 20), (550, 122, 22), (524, 90, 22)):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill="#3a6e2c")
for cx, cy, r in ((516, 102, 22), (540, 114, 16), (504, 120, 12)):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill="#4f8a3a")
for ox, oy in ((506, 104), (538, 98), (548, 128), (512, 132), (528, 118), (494, 120), (524, 84)):
    d.ellipse([ox, oy, ox + 6, oy + 6], fill="#f0902a"); d.point((ox + 1, oy + 1), fill="#ffd08a")
for ox, oy in ((520, 96), (534, 130)):
    d.point((ox, oy), fill="#ffffff"); d.point((ox + 1, oy), fill="#ffffff")
d.polygon([(496, 198), (552, 198), (546, FLOOR), (502, FLOOR)], fill="#b5583a")
R(494, 194, 554, 200, "#8e3f28"); R(500, 200, 548, 203, "#9a4a2e")
# pila / fuente (decoy 620..720)
d.ellipse([616, 196, 724, 222], fill="#8c8478"); R(616, 208, 724, FLOOR, "#8c8478")
d.ellipse([616, 220, 724, 238], fill="#7a7266"); d.ellipse([622, 199, 718, 217], fill="#5f8fb8")
R(664, 150, 676, 208, "#9a9286"); d.ellipse([652, 146, 688, 160], fill="#8c8478"); d.ellipse([656, 148, 684, 156], fill="#5f8fb8")
# maceteros con cardenales (decoy 770..850)
for i, x in enumerate((772, 812)):
    d.polygon([(x, 206), (x + 30, 206), (x + 26, FLOOR), (x + 4, FLOOR)], fill="#b5583a")
    for k in range(7):
        fx, fy = x + 4 + (k * 7) % 24, 186 + (k * 5) % 18
        d.ellipse([fx - 5, fy - 4, fx + 5, fy + 4], fill="#3a6e2c")
    for k in range(5):
        fx, fy = x + 6 + (k * 9) % 20, 184 + (k * 7) % 16
        d.ellipse([fx, fy, fx + 4, fy + 4], fill="#d93a4a")
# arco patio -> sala
R(876, 0, 900, FLOOR, "#efe6d6"); R(876, 0, 900, 30, "#5a3a22")
for x in range(860, 880, 8): pass

# ---------------- SALA 900..1440
R(900, 0, 1440, FLOOR, "#efe6d6"); tex_noise(900, 30, 1440, FLOOR, ["#e4d9c6", "#f6efe2"], 1600)
beams(900, 1440)
R(900, 186, 1440, FLOOR, "#a8432f"); R(900, 184, 1440, 187, "#7a2e20")  # guardapolvo
for x in range(900, 1440, 24): R(x, 196, x + 12, 198, "#c0583e")
R(900, FLOOR, 1440, H, "#b5583a")
for y in range(FLOOR, H, 10):
    for x in range(900 - (y // 10 % 2) * 10, 1440, 20):
        R(x, y, x + 19, y + 9, random.choice(["#b5583a", "#ad5236", "#bd5e3f"])); R(x, y + 9, x + 20, y + 10, "#8e3f28")
    R(900, y + 9, 1440, y + 10, "#8e3f28")
window(1180, 70, 44, 56)
# estrado (hotspot cojín 1000..1060)
R(926, 200, 1120, FLOOR, "#6b4528"); R(926, 198, 1120, 202, "#86592f")
R(930, 190, 1116, 200, "#8a2a3a")  # alfombra
for x in range(934, 1114, 12): R(x, 192, x + 6, 196, "#c4953a")
light = {"#2f5fae": "#5a86cc", "#c23a48": "#e0606c", "#c4953a": "#e2b860"}
for cx, col in ((960, "#2f5fae"), (1030, "#c23a48"), (1090, "#c4953a")):
    d.ellipse([cx - 20, 170, cx + 20, 196], fill=col); d.ellipse([cx - 13, 173, cx + 6, 181], fill=light[col])
    R(cx - 2, 178, cx + 2, 182, "#f4efe2")
# retrato del abuelo (decoy 1130..1170)
R(1124, 62, 1170, 118, "#c4953a"); R(1128, 66, 1166, 114, "#3a3440")
d.ellipse([1138, 74, 1156, 94], fill="#e6c09a"); R(1140, 74, 1154, 80, "#e8e4dc")
d.polygon([(1132, 114), (1162, 114), (1156, 96), (1138, 96)], fill="#1d2f5e")
R(1145, 100, 1149, 114, "#f4efe2")
# brasero (hotspot 1240..1290)
d.ellipse([1236, 184, 1294, 206], fill="#a85a2a"); R(1236, 194, 1294, 204, "#a85a2a")
d.ellipse([1240, 186, 1290, 198], fill="#c8743a"); d.ellipse([1246, 188, 1284, 196], fill="#5a4a44")
for lx in (1242, 1286): R(lx, 204, lx + 4, FLOOR, "#7a4220")
R(1236, 214, 1294, 218, "#7a4220")
# baúl (decoy 1310..1370)
R(1310, 196, 1370, FLOOR, "#6b4528"); d.ellipse([1310, 186, 1370, 206], fill="#7a5232")
R(1310, 206, 1370, 210, "#c4953a"); R(1336, 204, 1344, 216, "#c4953a"); R(1338, 210, 1342, 214, "#2a1a24")
# puerta del despacho (1380..1430)
R(1376, 92, 1436, FLOOR, "#4a2f1a"); R(1380, 96, 1432, FLOOR, "#7a4a28")
for py in (102, 150): R(1386, py, 1426, py + 40, "#6b4026"); R(1388, py + 2, 1424, py + 38, "#86592f")
d.ellipse([1418, 160, 1424, 166], fill="#c4953a")
R(1376, 86, 1436, 94, "#5a3a22")

# piso bajo los arcos
R(396, FLOOR, 420, H, "#9a7656"); R(396, FLOOR, 420, FLOOR + 2, "#6e523a")
for y in range(FLOOR, H, 10): R(876, y, 900, y + 9, "#b5583a"); R(876, y + 9, 900, y + 10, "#8e3f28")
img.save(os.path.join(A, "casa.png"))

# --------------- íconos de objetos 16x16
def icon(name, fn):
    im = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); dd = ImageDraw.Draw(im); fn(dd)
    a = np.array(im); al = a[:, :, 3] > 0; n = np.zeros_like(al)
    n[1:] |= al[:-1]; n[:-1] |= al[1:]; n[:, 1:] |= al[:, :-1]; n[:, :-1] |= al[:, 1:]
    a[n & ~al] = (42, 26, 36, 255); Image.fromarray(a).save(os.path.join(A, f"item_{name}.png"))

def trompo(dd):
    dd.polygon([(3, 5), (12, 5), (8, 13)], fill="#c23a48"); dd.rectangle([3, 5, 12, 7], fill="#e5b53a")
    dd.rectangle([7, 2, 8, 5], fill="#6b4528"); dd.point((8, 14), fill="#9a9286"); dd.line([(5, 9), (10, 9)], fill="#2f5fae")
def soldadito(dd):
    dd.rectangle([6, 1, 9, 3], fill="#1c1a22"); dd.rectangle([6, 4, 9, 5], fill="#e6c09a")
    dd.rectangle([5, 6, 10, 10], fill="#2f5fae"); dd.line([(7, 6), (7, 10)], fill="#e5b53a")
    dd.rectangle([6, 11, 9, 13], fill="#f1ece2"); dd.rectangle([5, 14, 10, 14], fill="#8a8a96"); dd.line([(11, 3), (11, 10)], fill="#c8c8d0")
def honda(dd):
    dd.line([(8, 14), (8, 8)], fill="#6b4528", width=2); dd.line([(8, 8), (4, 3)], fill="#6b4528", width=2)
    dd.line([(8, 8), (12, 3)], fill="#6b4528", width=2); dd.line([(4, 3), (8, 6), (12, 3)], fill="#c8a46a")
def llave(dd):
    dd.ellipse([2, 2, 8, 8], fill="#c4953a"); dd.ellipse([4, 4, 6, 6], fill=(0, 0, 0, 0))
    dd.line([(7, 7), (13, 13)], fill="#c4953a", width=2); dd.line([(11, 13), (13, 11)], fill="#c4953a"); dd.point((12, 14), fill="#c4953a")
def nota(dd):
    dd.rectangle([2, 3, 13, 13], fill="#f6efdc"); [dd.line([(4, y), (11, y)], fill="#9a8a70") for y in (6, 8, 10)]
    dd.point((7, 12), fill="#b02a30"); dd.point((8, 12), fill="#b02a30")
for n, f in (("trompo", trompo), ("soldadito", soldadito), ("honda", honda), ("llave", llave), ("nota", nota)):
    icon(n, f)

# --------------- sprites
for f in ("javiera_adolescente.png", "npc_perro.png"):
    shutil.copy(os.path.join(SPR, f), os.path.join(A, f))

# --------------- íconos de la app (cara de Javiera adulta sobre azul)
src = Image.open(os.path.join(SPR, "javiera_adulta.png")).crop((14, 0, 46, 32))
for size in (192, 512):
    ic = Image.new("RGBA", (size, size), "#2f5fae")
    band = size // 6
    ImageDraw.Draw(ic).rectangle([0, size - band, size, size], fill="#e5b53a")
    face = src.resize((size * 3 // 4, size * 3 // 4), Image.NEAREST)
    ic.alpha_composite(face, ((size - face.width) // 2, size // 16))
    ic.save(os.path.join(ROOT, "www", f"icon-{size}.png"))
print("ok")
