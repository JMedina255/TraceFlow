#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
render_diagrams.py
Script de automatización para la compilación y renderizado por lotes
de fuentes PlantUML a formatos SVG y PNG utilizando plantuml.jar con UTF-8 estricto.

Proyecto: TraceFlow SCM
Organización: ÉXODO S.A.C.
Equipo: C-SharkTeam
"""

import argparse
import glob
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
PLANTUML_DIR = BASE_DIR / 'assets' / 'diagramas' / 'plantuml'
RENDER_DIR = BASE_DIR / 'assets' / 'diagramas' / 'render'

CATEGORIES = ['generales', 'analisis', 'diseno', 'uwe']
MOJIBAKE_RE = re.compile(r'(?:Ã[\x80-\xbf¡-¿]?|Â[¿¡°ºª\x80-\xbf]?|â\x80|\ufffd)')


def resolve_plantuml_jar() -> Path | None:
    """Resuelve la ruta de plantuml.jar desde variable de entorno, ~/.plantuml o extensión VS Code."""
    candidates: list[Path] = []
    env_jar = os.environ.get('PLANTUML_JAR')
    if env_jar:
        candidates.append(Path(env_jar).expanduser())
    candidates.append(Path.home() / '.plantuml' / 'plantuml.jar')
    for match in sorted(glob.glob(str(Path.home() / '.vscode' / 'extensions' / 'jebbs.plantuml-*' / 'plantuml.jar'))):
        candidates.append(Path(match))
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def build_java_env() -> dict[str, str]:
    """Configura entorno UTF-8 explícito para JVM y Python en Windows/PowerShell y POSIX."""
    env = os.environ.copy()
    env['JAVA_TOOL_OPTIONS'] = '-Dfile.encoding=UTF-8'
    env['PYTHONIOENCODING'] = 'utf-8'
    env['PYTHONUTF8'] = '1'
    return env


def verify_svg_encoding(svg_bytes: bytes, diag_id: str) -> tuple[bool, str]:
    """Verifica mediante analizador XML que el SVG sea UTF-8 válido y libre de mojibake."""
    try:
        svg_text = svg_bytes.decode('utf-8')
        root = ET.fromstring(svg_text)
        texts = ' '.join(el.text.strip() for el in root.iter() if el.text and el.text.strip())
    except Exception as exc:
        return False, f"XML/UTF-8 inválido en {diag_id}.svg: {exc}"

    hits = MOJIBAKE_RE.findall(texts)
    if hits or '\ufffd' in texts:
        return False, f"Secuencias de codificación corrupta en {diag_id}.svg: {hits[:5]}"
    return True, ''


def render_file(puml_path: Path, out_dir: Path, base_name: str, jar_path: Path, env: dict[str, str]) -> bool:
    """Compila un archivo .puml en SVG y PNG usando -Dfile.encoding=UTF-8 y -charset UTF-8."""
    svg_out = out_dir / f"{base_name}.svg"
    png_out = out_dir / f"{base_name}.png"

    puml_text = puml_path.read_text(encoding='utf-8')
    if puml_text.startswith('\ufeff'):
        puml_text = puml_text.lstrip('\ufeff')
    puml_bytes = puml_text.encode('utf-8')

    ok = True

    # Render SVG en UTF-8 estricto
    cmd_svg = ['java', '-Dfile.encoding=UTF-8', '-jar', str(jar_path), '-charset', 'UTF-8', '-tsvg', '-pipe']
    res_svg = subprocess.run(cmd_svg, input=puml_bytes, capture_output=True, env=env)
    if res_svg.returncode == 0 and len(res_svg.stdout) > 0:
        valid_svg, msg = verify_svg_encoding(res_svg.stdout, base_name)
        if not valid_svg:
            print(f"\n  ERROR UTF-8/XML en {base_name}: {msg}")
            ok = False
        else:
            svg_out.write_bytes(res_svg.stdout)
    else:
        print(f"\n  ERROR en SVG para {base_name}: {res_svg.stderr.decode('utf-8', errors='replace')[:200]}")
        ok = False

    # Render PNG en UTF-8 estricto
    cmd_png = ['java', '-Dfile.encoding=UTF-8', '-jar', str(jar_path), '-charset', 'UTF-8', '-tpng', '-pipe']
    res_png = subprocess.run(cmd_png, input=puml_bytes, capture_output=True, env=env)
    if res_png.returncode == 0 and res_png.stdout.startswith(b'\x89PNG\r\n\x1a\n'):
        png_out.write_bytes(res_png.stdout)
    else:
        print(f"\n  ERROR en PNG para {base_name}: {res_png.stderr.decode('utf-8', errors='replace')[:200]}")
        ok = False

    return ok


def render_all(only_ids: set[str] | None = None, only_category: str | None = None) -> dict:
    jar_path = resolve_plantuml_jar()
    if not jar_path:
        print("ERROR: No se encontró plantuml.jar en PLANTUML_JAR, ~/.plantuml/plantuml.jar ni en extensiones VS Code.")
        sys.exit(1)

    env = build_java_env()
    start_time = time.time()
    cats = [only_category] if only_category else CATEGORIES

    print(f"=== INICIANDO RENDERIZADO UTF-8 DETERMINISTA ({jar_path}) ===")
    results = {}
    errors = 0

    for cat in cats:
        cat_puml_dir = PLANTUML_DIR / cat
        cat_render_dir = RENDER_DIR / cat
        cat_render_dir.mkdir(parents=True, exist_ok=True)

        puml_files = sorted(cat_puml_dir.glob('*.puml'))
        if only_ids is not None:
            puml_files = [p for p in puml_files if p.stem in only_ids]

        print(f"\n--- Categoría: {cat.upper()} ({len(puml_files)} diagramas seleccionados) ---")
        rendered_here = 0
        for puml_path in puml_files:
            if render_file(puml_path, cat_render_dir, puml_path.stem, jar_path, env):
                rendered_here += 1
            else:
                errors += 1
            sys.stdout.write('.')
            sys.stdout.flush()

        print(" [OK]" if errors == 0 else " [CON ERRORES]")

        total_cat_puml = len(list(cat_puml_dir.glob('*.puml')))
        svg_count = len(list(cat_render_dir.glob('*.svg')))
        png_count = len(list(cat_render_dir.glob('*.png')))

        results[cat] = {
            'puml': total_cat_puml,
            'svg': svg_count,
            'png': png_count,
            'rendered': rendered_here,
            'ok': (total_cat_puml == svg_count == png_count) and errors == 0,
        }
        print(f"  Estado {cat}: {total_cat_puml} PUML -> {svg_count} SVG, {png_count} PNG (procesados ahora: {rendered_here})")

    total_time = time.time() - start_time
    total_puml = sum(r['puml'] for r in results.values())
    total_svg = sum(r['svg'] for r in results.values())
    total_png = sum(r['png'] for r in results.values())

    print(f"\n=== RESUMEN DE RENDERIZADO UTF-8 (Tiempo total: {total_time:.2f} s) ===")
    print(f"Total Fuentes PUML: {total_puml} | SVG: {total_svg} | PNG: {total_png} | Errores: {errors}")

    if errors > 0 or not all(r['ok'] for r in results.values()):
        sys.exit(1)

    print("CERTIFICACIÓN: 100% de los diagramas compilados en SVG y PNG con UTF-8 verificado.")
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Renderiza diagramas PlantUML a SVG y PNG en UTF-8 estricto.')
    parser.add_argument('--id', action='append', dest='ids', help='ID(s) específicos de diagrama a renderizar (sin .puml)')
    parser.add_argument('--category', choices=CATEGORIES, help='Filtrar por categoría')
    args = parser.parse_args()
    render_all(only_ids=set(args.ids) if args.ids else None, only_category=args.category)
