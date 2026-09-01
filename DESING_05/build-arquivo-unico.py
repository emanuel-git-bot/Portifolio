#!/usr/bin/env python3
"""
Gera uma versão de arquivo único do portfólio.

Embute no HTML: CSS, JS, GSAP, ScrollTrigger, Lenis, as fontes Geist (woff2)
e a foto (jpg) — tudo como data URI ou tag inline. O resultado não depende de
nenhum arquivo externo nem de CDN.

Uso:  python3 build-arquivo-unico.py
Saída: portfolio-emanuel-completo.html
"""
import base64
import pathlib
import re
import sys

BASE = pathlib.Path(__file__).parent
SAIDA = BASE / "portfolio-emanuel-completo.html"


def ler(caminho):
    p = BASE / caminho
    if not p.exists():
        sys.exit(f"Arquivo não encontrado: {caminho}")
    return p.read_text(encoding="utf-8")


def data_uri(caminho, mime):
    p = BASE / caminho
    if not p.exists():
        sys.exit(f"Arquivo não encontrado: {caminho}")
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode("ascii")


def proteger(js):
    """Impede que um '</script>' dentro do código feche a tag antes da hora."""
    return js.replace("</script>", "<\\/script>")


html = ler("index.html")
css = ler("styles.css")
js = ler("script.js")

# --- fontes viram data URI dentro do CSS ---
css = css.replace(
    'url("assets/fonts/Geist-Variable.woff2")',
    f'url("{data_uri("assets/fonts/Geist-Variable.woff2", "font/woff2")}")',
)
css = css.replace(
    'url("assets/fonts/GeistMono-Variable.woff2")',
    f'url("{data_uri("assets/fonts/GeistMono-Variable.woff2", "font/woff2")}")',
)

# --- toda imagem em assets/images/ (foto, ícones de tecnologia) vira data URI ---
MIME_POR_EXTENSAO = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".png": "image/png", ".svg": "image/svg+xml",
}
for caminho_img in sorted(set(re.findall(r'src="(assets/images/[^"]+)"', html))):
    extensao = pathlib.Path(caminho_img).suffix.lower()
    mime = MIME_POR_EXTENSAO.get(extensao)
    if not mime:
        sys.exit(f"Extensão de imagem sem MIME mapeado: {caminho_img}")
    html = html.replace(f'src="{caminho_img}"', f'src="{data_uri(caminho_img, mime)}"')

# --- CSS entra no lugar do <link> ---
html = html.replace(
    '<link rel="stylesheet" href="styles.css">',
    "<style>\n" + css + "\n</style>",
)

# --- bibliotecas + script entram no lugar das tags <script src> ---
libs = "".join(
    "<script>" + proteger(ler(f"assets/vendor/{nome}")) + "</script>\n"
    for nome in ("gsap.min.js", "ScrollTrigger.min.js", "lenis.min.js")
)
html = html.replace(
    '<script src="assets/vendor/gsap.min.js"></script>\n'
    '<script src="assets/vendor/ScrollTrigger.min.js"></script>\n'
    '<script src="assets/vendor/lenis.min.js"></script>\n'
    '<script src="script.js"></script>',
    libs + "<script>\n" + proteger(js) + "\n</script>",
)

# --- confere que não sobrou nenhuma referência externa ---
sobrou = re.findall(r'(?:src|href)="(?!data:|#|mailto:|https?:)([^"]+)"', html)
if sobrou:
    sys.exit(f"Ainda há referências externas: {sobrou}")

SAIDA.write_text(html, encoding="utf-8")
kb = SAIDA.stat().st_size / 1024
print(f"Gerado: {SAIDA.name} ({kb:.0f} KB)")
