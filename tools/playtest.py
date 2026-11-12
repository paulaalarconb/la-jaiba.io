"""Recorre el Capítulo 1 completo con toques reales en una tablet y un teléfono Android emulados."""
import sys, time, subprocess, os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1]
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "-d", os.path.join(ROOT, "www")], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
errors = []

def run(p, name, vw, vh, shots):
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--autoplay-policy=no-user-gesture-required"])
    ctx = b.new_context(viewport={"width": vw, "height": vh}, device_scale_factor=2, has_touch=True, is_mobile=True,
                        user_agent="Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/124 Safari/537.36")
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errors.append(f"{name}: {e}"))
    pg.on("console", lambda m: m.type == "error" and errors.append(f"{name} console: {m.text}"))
    pg.goto("http://localhost:8765/index.html#test"); pg.wait_for_timeout(800)
    if shots: pg.screenshot(path=f"{OUT}/{name}_0_titulo.png")
    pg.tap("#btnPlay"); pg.wait_for_timeout(500)
    J = lambda expr: pg.evaluate(f"window.__jaiba.{expr}")

    def drain(shot=None):
        for _ in range(80):
            m = J("mode")
            if m != "dialog": return m
            if shot: pg.wait_for_timeout(900); pg.screenshot(path=f"{OUT}/{name}_{shot}.png"); shot = None
            pg.dispatch_event("#dialog", "pointerup"); pg.wait_for_timeout(140)
        return J("mode")

    def tap_world(wx, wy):
        r = pg.evaluate("(()=>{const r=document.getElementById('game').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()")
        cam, VW = J("camX"), J("VW")
        sx = r[0] + (wx - cam) / VW * r[2]; sy = r[1] + wy / 270 * r[3]
        pg.touchscreen.tap(sx, sy)

    def go(spot_id, wy=None):
        sp = pg.evaluate(f"window.__jaiba.SPOTS.find(s=>s.id==='{spot_id}')")
        cx = (sp["x0"] + sp["x1"]) / 2; y = wy or (sp["y0"] + sp["y1"]) / 2
        # primero caminar cerca para que el objeto quede en pantalla
        for _ in range(12):
            cam, VW = J("camX"), J("VW")
            if cam + 10 < cx < cam + VW - 10: break
            tap_world(max(cam + 30, min(cam + VW - 30, cx)), 256); pg.wait_for_timeout(1200)
        pg.wait_for_timeout(600); tap_world(cx, y)
        for _ in range(60):
            if J("mode") != "play": break
            pg.wait_for_timeout(100)

    m = drain(shot="1_intro" if shots else None)
    assert m == "modal", m
    if shots: pg.wait_for_timeout(300); pg.screenshot(path=f"{OUT}/{name}_2_nota.png")
    pg.tap("#noteClose"); pg.wait_for_timeout(300)
    # pista de Pancho (nivel 1)
    pg.tap("#btnHint"); pg.wait_for_timeout(300); drain()
    # un señuelo
    go("fuente"); drain(shot="3_senuelo" if shots else None)
    for i, spot in enumerate(["naranjo", "cantaro", "estrado", "brasero"]):
        go(spot); pg.wait_for_timeout(2200)
        if shots and i == 2: pg.screenshot(path=f"{OUT}/{name}_4_hallazgo.png")
        m = drain()
        if J("S.step") != i + 1:
            pg.screenshot(path=f"{OUT}/{name}_fallo.png")
            raise AssertionError((spot, J("S.step"), J("jav.x"), J("dog.x"), J("camX"), J("mode"), pg.inner_text("#dlgText")))
        if i < 3:
            assert m == "modal", (spot, m); pg.tap("#noteClose"); pg.wait_for_timeout(300)
    pg.tap("#btnDiary"); pg.wait_for_timeout(300)
    if shots: pg.screenshot(path=f"{OUT}/{name}_5_diario.png")
    pg.tap("#diaryClose"); pg.wait_for_timeout(200)
    go("puerta"); drain()
    pg.wait_for_selector("#puzzle:not([hidden])")
    # un error a propósito con «Presidente»
    pg.tap("text=Presidente"); pg.tap(".blank >> nth=0"); pg.wait_for_timeout(300)
    if shots: pg.screenshot(path=f"{OUT}/{name}_6_tertulia.png")
    for word, n in (("Cabildo", 0), ("Capitanía", 1), ("Rey", 2)):
        pg.tap(f".tile:text-is('{word}')"); pg.tap(f".blank >> nth={n}"); pg.wait_for_timeout(250)
    pg.wait_for_timeout(1200); drain()
    pg.wait_for_selector("#end:not([hidden])"); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/{name}_7_final.png")
    print(name, "OK · pistas", J("S.hints"), "· errores", J("S.wrong"))
    b.close()

with sync_playwright() as p:
    try:
        run(p, "tablet", 1138, 712, True)
        run(p, "telefono", 915, 412, True)
    finally:
        srv.terminate()
print("errores:", errors or "ninguno")
