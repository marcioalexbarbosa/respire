#!/usr/bin/env python3
"""
Gera os ícones do PWA "Respiração 4-7-8".

Desenha o mesmo orb do app (gradiente aurora + brilho + anel) em PNG,
com supersampling para ficar suave. Rodar a partir da raiz do repo:

    python3 tools/make-icons.py

Saída: icons/*.png e favicon.ico
"""

import os
import numpy as np
from PIL import Image

SS = 4  # supersampling

ACCENT = np.array([0x6f, 0xd6, 0xff], dtype=float)   # --accent
ACCENT2 = np.array([0xb0, 0x8b, 0xff], dtype=float)  # --accent-2
BG0 = np.array([0x07, 0x0b, 0x1a], dtype=float)      # --bg-0
BG_GLOW = np.array([0x16, 0x20, 0x4a], dtype=float)  # brilho do topo


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def render(size, maskable):
    """Desenha o ícone. maskable=True usa fundo sangrado e conteúdo menor
    (zona segura das máscaras adaptativas do Android)."""
    n = size * SS
    # coordenadas normalizadas: [-1, 1] em cada eixo
    lin = (np.arange(n) + 0.5) / n * 2.0 - 1.0
    x, y = np.meshgrid(lin, lin)
    r = np.hypot(x, y)

    # escala do conteúdo: maskable precisa caber no círculo seguro (~80%)
    k = 0.62 if maskable else 0.80
    orb_r = 0.55 * k
    ring_r = 0.95 * k

    # ---- fundo ----
    glow_bg = 1.0 - smoothstep(0.0, 1.5, np.hypot(x, y + 0.55))
    rgb = BG0 + (BG_GLOW - BG0) * glow_bg[..., None]

    # ---- anel de progresso (decorativo) ----
    ring_w = 0.018 * k * 4
    ring_mix = np.clip((x + y + 2.0) / 4.0, 0.0, 1.0)[..., None]
    ring_col = ACCENT + (ACCENT2 - ACCENT) * ring_mix
    ring_a = (1.0 - smoothstep(0.0, ring_w, np.abs(r - ring_r))) * 0.85
    rgb = rgb + (ring_col - rgb) * ring_a[..., None]

    # ---- halo do orb ----
    halo = np.exp(-np.clip(r - orb_r, 0, None) * (5.5 / k)) * 0.55
    halo = np.where(r > orb_r, halo, 0.0)
    halo_col = ACCENT + (ACCENT2 - ACCENT) * ring_mix
    rgb = rgb + halo_col * halo[..., None] * 0.55

    # ---- orb ----
    orb_mix = np.clip((x + y + 2.0) / 4.0, 0.0, 1.0)[..., None]
    orb_col = ACCENT + (ACCENT2 - ACCENT) * orb_mix
    # brilho especular no canto superior esquerdo
    spec = 1.0 - smoothstep(0.0, orb_r * 0.95, np.hypot(x + orb_r * 0.32, y + orb_r * 0.36))
    orb_col = orb_col + (255.0 - orb_col) * (spec ** 2.4)[..., None] * 0.85
    orb_a = 1.0 - smoothstep(orb_r - 0.004, orb_r + 0.004, r)
    rgb = rgb + (orb_col - rgb) * orb_a[..., None]

    # ---- alpha / forma externa ----
    if maskable:
        alpha = np.ones_like(r)
    else:
        # quadrado com cantos arredondados (raio 22%)
        rad = 0.44
        dx = np.clip(np.abs(x) - (1.0 - rad), 0, None)
        dy = np.clip(np.abs(y) - (1.0 - rad), 0, None)
        d = np.hypot(dx, dy)
        alpha = 1.0 - smoothstep(rad - 0.006, rad + 0.006, d)

    rgba = np.dstack([np.clip(rgb, 0, 255), alpha * 255.0]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")
    return img.resize((size, size), Image.LANCZOS)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    icons = os.path.join(root, "icons")
    os.makedirs(icons, exist_ok=True)

    outputs = [
        ("icons/icon-192.png", 192, False),
        ("icons/icon-512.png", 512, False),
        ("icons/icon-maskable-192.png", 192, True),
        ("icons/icon-maskable-512.png", 512, True),
        # iOS não aceita transparência nem aplica máscara: usa o sangrado
        ("icons/apple-touch-icon.png", 180, True),
    ]

    for rel, size, maskable in outputs:
        path = os.path.join(root, rel)
        img = render(size, maskable)
        if "apple-touch" in rel:
            flat = Image.new("RGB", img.size, tuple(int(c) for c in BG0))
            flat.paste(img, mask=img.split()[3])
            img = flat
        img.save(path, optimize=True)
        print("✓", rel, f"{size}x{size}")

    fav = render(64, False)
    fav.save(os.path.join(root, "favicon.ico"),
             sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("✓ favicon.ico")


if __name__ == "__main__":
    main()
