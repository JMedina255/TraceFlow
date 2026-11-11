#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
render_diagrams.py
Script de automatización para la compilación y renderizado por lotes
de fuentes PlantUML a formatos SVG y PNG utilizando plantuml.jar.

Proyecto: TraceFlow SCM
Organización: ÉXODO S.A.C.
Equipo: C-SharkTeam
"""

import os
import subprocess
import sys
import time

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PLANTUML_DIR = os.path.join(BASE_DIR, 'assets', 'diagramas', 'plantuml')
RENDER_DIR = os.path.join(BASE_DIR, 'assets', 'diagramas', 'render')

JAR_PATH = os.path.expanduser('~/.plantuml/plantuml.jar')

CATEGORIES = ['generales', 'analisis', 'diseno', 'uwe']

def render_file(puml_path, out_dir, base_name):
    """Render a single .puml file to both SVG and PNG with exact output naming."""
    svg_out = os.path.join(out_dir, f"{base_name}.svg")
    png_out = os.path.join(out_dir, f"{base_name}.png")

    with open(puml_path, 'r', encoding='utf-8') as f:
        puml_bytes = f.read().encode('utf-8')

    # Render SVG
    cmd_svg = ['java', '-jar', JAR_PATH, '-tsvg', '-pipe']
    res_svg = subprocess.run(cmd_svg, input=puml_bytes, capture_output=True)
    if res_svg.returncode == 0 and len(res_svg.stdout) > 0:
        with open(svg_out, 'wb') as f:
            f.write(res_svg.stdout)
    else:
        print(f"  ERROR en SVG para {base_name}: {res_svg.stderr.decode('utf-8', errors='ignore')[:150]}")

    # Render PNG
    cmd_png = ['java', '-jar', JAR_PATH, '-tpng', '-pipe']
    res_png = subprocess.run(cmd_png, input=puml_bytes, capture_output=True)
    if res_png.returncode == 0 and len(res_png.stdout) > 0:
        with open(png_out, 'wb') as f:
            f.write(res_png.stdout)
    else:
        print(f"  ERROR en PNG para {base_name}: {res_png.stderr.decode('utf-8', errors='ignore')[:150]}")

def render_all():
    print("=== INICIANDO RENDERIZADO DETERMINISTA DE 114 DIAGRAMAS ===")
    start_time = time.time()

    if not os.path.exists(JAR_PATH):
        print(f"ERROR: No se encontró plantuml.jar en {JAR_PATH}")
        sys.exit(1)

    results = {}

    for cat in CATEGORIES:
        cat_puml_dir = os.path.join(PLANTUML_DIR, cat)
        cat_render_dir = os.path.join(RENDER_DIR, cat)
        os.makedirs(cat_render_dir, exist_ok=True)

        puml_files = sorted([f for f in os.listdir(cat_puml_dir) if f.endswith('.puml')])
        print(f"\n--- Procesando categoría: {cat.upper()} ({len(puml_files)} diagramas) ---")

        for f in puml_files:
            base_name = f[:-5]  # remove .puml
            puml_path = os.path.join(cat_puml_dir, f)
            render_file(puml_path, cat_render_dir, base_name)
            sys.stdout.write('.')
            sys.stdout.flush()

        print(" [OK]")

        svg_count = len([f for f in os.listdir(cat_render_dir) if f.endswith('.svg')])
        png_count = len([f for f in os.listdir(cat_render_dir) if f.endswith('.png')])
        puml_count = len(puml_files)

        results[cat] = {
            'puml': puml_count,
            'svg': svg_count,
            'png': png_count,
            'ok': (puml_count == svg_count == png_count)
        }
        print(f"  Resultado {cat}: {puml_count} PUML -> {svg_count} SVG, {png_count} PNG")

    total_time = time.time() - start_time
    print(f"\n=== RESUMEN DE RENDERIZADO (Tiempo total: {total_time:.2f} s) ===")
    total_puml = sum(r['puml'] for r in results.values())
    total_svg = sum(r['svg'] for r in results.values())
    total_png = sum(r['png'] for r in results.values())

    print(f"Total Fuentes PUML procesadas: {total_puml}")
    print(f"Total Archivos SVG generados:  {total_svg}")
    print(f"Total Archivos PNG generados:  {total_png}")

    all_ok = all(r['ok'] for r in results.values())
    if all_ok:
        print("CERTIFICACIÓN: 100% de los diagramas fueron compilados y renderizados en SVG y PNG exitosamente!")
    else:
        print("ADVERTENCIA: Algunas categorías tienen discrepancias en el conteo de imágenes generadas.")

    return results

if __name__ == '__main__':
    render_all()
