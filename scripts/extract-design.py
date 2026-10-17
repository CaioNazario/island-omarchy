#!/usr/bin/env python3
"""Extrai o protótipo empacotado (Claude Design) para arquivos legíveis em design/
e os ícones Phosphor usados para SVGs simbólicos em icons/ (specs/01-design-tokens.md)."""

import base64
import gzip
import html
import json
import re
import shutil
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# O v5 chegou sem bundle (design-source/); um bundle do Claude Design
# (`Desktop Island.html`, até o v3) ainda pode ser passado como argumento.
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "design-source" / "Desktop Island.dc.html"
OUT = ROOT / "design"
ICONS = ROOT / "icons"
PHOSPHOR_URL = "https://unpkg.com/@phosphor-icons/web@2.1.1/src"
PHOSPHOR_DIR = ROOT / "node_modules" / ".cache" / "phosphor-2.1.1"

# Usados pelo código mas ausentes do design (specs/08-controles-rapidos.md:
# ícone pelo tipo do dispositivo Bluetooth; specs/04-notificacoes.md: tabela
# de sites; specs/05-musica.md: ícone da fonte; specs/07-clima.md: condição;
# specs/08-controles-rapidos.md: OSD do Omarchy).
EXTRA_ICONS = {
    ("fill", "laptop"),
    ("fill", "game-controller"),
    ("fill", "bluetooth"),
    ("fill", "whatsapp-logo"),
    ("fill", "google-chrome-logo"),
    ("fill", "music-note"),
    ("fill", "cloud-sun"),
    ("fill", "cloud-moon"),
    ("fill", "cloud"),
    ("fill", "cloud-fog"),
    ("fill", "cloud-rain"),
    ("fill", "cloud-lightning"),
    ("fill", "snowflake"),
    # specs/08-controles-rapidos.md "OSD do Omarchy": ícones dos pedidos que
    # não são volume nem brilho.
    ("regular", "microphone"),
    ("regular", "microphone-slash"),
    ("regular", "download-simple"),
    ("regular", "monitor"),
    ("regular", "info"),
    # Cabeçalho da lista de redes do v3 (plugin/ui/WifiView.qml), até o
    # cabeçalho do v5 entrar.
    ("regular", "wifi-high"),
}

ICON_CLASS = re.compile(r"\bph(?:-(bold|fill))? ph-([a-z0-9-]+)")


def script_block(doc: str, kind: str) -> str:
    m = re.search(rf'<script type="__bundler/{kind}"[^>]*>(.*?)</script>', doc, re.S)
    if not m:
        sys.exit(f"bloco __bundler/{kind} não encontrado em {SRC}")
    return m.group(1)


def asset_bytes(manifest: dict, uuid: str) -> bytes:
    raw = base64.b64decode(manifest[uuid]["data"])
    return gzip.decompress(raw) if manifest[uuid].get("compressed") else raw


def glyph_paths(manifest: dict) -> dict[str, str]:
    """Nome do glifo (`gear-six`, `power-bold`, `moon-fill`) → path, das fontes SVG do bundle."""
    paths: dict[str, str] = {}
    for uuid, asset in manifest.items():
        if asset["mime"] != "image/svg+xml":
            continue
        font = asset_bytes(manifest, uuid).decode("utf-8")
        for tag in re.findall(r"<glyph\b[^>]*>", font):
            names = re.search(r'glyph-name="([^"]*)"', tag)
            path = re.search(r'\bd="([^"]*)"', tag)
            if not (names and path):
                continue
            for name in names.group(1).split(","):
                paths.setdefault(name.strip(), path.group(1))
    return paths


def write_icons(manifest: dict, sources: list[str]) -> int:
    return write_icon_files(glyph_paths(manifest), sources)


def write_icon_files(paths: dict[str, str], sources: list[str]) -> int:
    used = {(weight or "regular", name) for text in sources for weight, name in ICON_CLASS.findall(text)}
    shutil.rmtree(ICONS, ignore_errors=True)
    ICONS.mkdir()
    for weight, name in sorted(used | EXTRA_ICONS):
        glyph = name if weight == "regular" else f"{name}-{weight}"
        if glyph not in paths:
            sys.exit(f"ícone ph-{glyph} não encontrado nas fontes Phosphor do bundle")
        # Fonte SVG: y para cima, ascent 960, descent -64, 1024 por em.
        (ICONS / f"{glyph}-symbolic.svg").write_text(
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 1024 1024">'
            f'<path transform="matrix(1 0 0 -1 0 960)" d="{paths[glyph]}"/></svg>\n',
            encoding="utf-8",
        )
    return len(used | EXTRA_ICONS)


def write_components(manifest: dict, doc: str) -> list[str]:
    """Subcomponentes `./<Nome>.dc.html` (ex.: `<dc-import name="TopbarWidget">`) → design/components/."""
    comps = OUT / "components"
    shutil.rmtree(comps, ignore_errors=True)
    sources: list[str] = []
    for res in json.loads(script_block(doc, "ext_resources")):
        name = re.fullmatch(r"\./(.+)\.dc\.html", res["id"])
        if not name:
            continue
        page = asset_bytes(manifest, res["uuid"]).decode("utf-8")
        body = re.search(r"</helmet>(.*?)</x-dc>", page, re.S)
        if not body:
            sys.exit(f"estrutura de {res['id']} mudou; ajuste scripts/extract-design.py")
        comps.mkdir(parents=True, exist_ok=True)
        (comps / f"{name.group(1)}.html").write_text(body.group(1).strip() + "\n", encoding="utf-8")
        sources.append(body.group(1))
    return sources


def dc_body(page: str, name: str) -> str:
    body = re.search(r"</helmet>(.*?)</x-dc>", page, re.S)
    if not body:
        sys.exit(f"estrutura de {name} mudou; ajuste scripts/extract-design.py")
    return body.group(1)


def phosphor_glyphs() -> dict[str, str]:
    """Glifos das fontes SVG do Phosphor web 2.1.1, a mesma versão que o .dc.html carrega do unpkg."""
    paths: dict[str, str] = {}
    for weight in ("regular", "fill", "bold"):
        font_file = PHOSPHOR_DIR / f"{weight}.svg"
        if not font_file.exists():
            suffix = "" if weight == "regular" else f"-{weight.capitalize()}"
            url = f"{PHOSPHOR_URL}/{weight}/Phosphor{suffix}.svg"
            PHOSPHOR_DIR.mkdir(parents=True, exist_ok=True)
            print(f"baixando {url}")
            urllib.request.urlretrieve(url, font_file)
        font = font_file.read_text(encoding="utf-8")
        for tag in re.findall(r"<glyph\b[^>]*>", font):
            names = re.search(r'glyph-name="([^"]*)"', tag)
            path = re.search(r'\bd="([^"]*)"', tag)
            if names and path:
                for name in names.group(1).split(","):
                    paths.setdefault(name.strip(), path.group(1))
    return paths


def main_dc() -> None:
    """Fonte sem bundle (design-source/): o .dc.html, os subcomponentes ao lado e o CSS do Nocturne."""
    doc = SRC.read_text(encoding="utf-8")
    page = dc_body(doc, SRC.name)
    logic = re.search(r'<script type="text/x-dc"[^>]*data-props="([^"]*)"[^>]*>(.*?)</script>', doc, re.S)
    if not logic:
        sys.exit(f"script text/x-dc não encontrado em {SRC}")
    OUT.mkdir(exist_ok=True)
    shutil.copyfile(SRC.parent / "nocturne.css", OUT / "tokens.css")
    (OUT / "markup.html").write_text(page.strip() + "\n", encoding="utf-8")
    (OUT / "logic.js").write_text(logic.group(2).strip() + "\n", encoding="utf-8")
    props = json.loads(html.unescape(logic.group(1)))
    (OUT / "props.json").write_text(json.dumps(props, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    comps = OUT / "components"
    shutil.rmtree(comps, ignore_errors=True)
    comps.mkdir()
    sources = [page, logic.group(2)]
    for name in sorted(set(re.findall(r'<dc-import name="([^"]+)"', page))):
        body = dc_body((SRC.parent / f"{name}.dc.html").read_text(encoding="utf-8"), name)
        (comps / f"{name}.html").write_text(body.strip() + "\n", encoding="utf-8")
        sources.append(body)
    count = write_icon_files(phosphor_glyphs(), sources)
    print(f"design/ ({len(sources) - 2} componentes) e icons/ ({count} ícones) atualizados a partir de {SRC.name}")


def main() -> None:
    if SRC.name.endswith(".dc.html"):
        main_dc()
        return
    doc = SRC.read_text(encoding="utf-8")
    template = json.loads(script_block(doc, "template"))

    tokens = re.search(r"<style>(/\* Nocturne.*?)</style>", template, re.S)
    page = re.search(r"</helmet>(.*?)<script type=\"text/x-dc\"", template, re.S)
    logic = re.search(r'<script type="text/x-dc"[^>]*data-props="([^"]*)"[^>]*>(.*?)</script>', template, re.S)
    if not (tokens and page and logic):
        sys.exit("estrutura do template mudou; ajuste scripts/extract-design.py")

    OUT.mkdir(exist_ok=True)
    (OUT / "tokens.css").write_text(tokens.group(1).strip() + "\n", encoding="utf-8")
    (OUT / "markup.html").write_text(page.group(1).strip() + "\n", encoding="utf-8")
    (OUT / "logic.js").write_text(logic.group(2).strip() + "\n", encoding="utf-8")
    props = json.loads(html.unescape(logic.group(1)))
    (OUT / "props.json").write_text(json.dumps(props, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    manifest = json.loads(script_block(doc, "manifest"))
    components = write_components(manifest, doc)
    count = write_icons(manifest, [page.group(1), logic.group(2), *components])
    print(f"design/ ({len(components)} componentes) e icons/ ({count} ícones) atualizados a partir de {SRC.name}")


if __name__ == "__main__":
    main()
