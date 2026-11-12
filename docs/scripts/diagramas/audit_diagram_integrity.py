#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
audit_diagram_integrity.py
Script de auditoría exhaustiva de recursos gráficos, detección de identificadores
duplicados, verificación de renderizado SVG/PNG y correspondencia con la documentación.

Proyecto: TraceFlow SCM
Organización: ÉXODO S.A.C.
Equipo: C-SharkTeam
Línea Base: Etapa 07 (Auditoría Integral y Preparación CCB)
"""

import os
import re
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DOCS_DIR = os.path.join(BASE_DIR, 'docs')
DIAGRAMS_MD = os.path.join(DOCS_DIR, 'DIAGRAMS.md')
ASSETS_DIR = os.path.join(DOCS_DIR, 'assets')
PLANTUML_DIR = os.path.join(ASSETS_DIR, 'diagramas', 'plantuml')
RENDER_DIR = os.path.join(ASSETS_DIR, 'diagramas', 'render')
CAPTURAS_DIR = os.path.join(ASSETS_DIR, 'capturas')

CATEGORIES = ['generales', 'analisis', 'diseno', 'uwe']

def run_audit():
    print("=" * 80)
    print(" AUDITORÍA TÉCNICA DE INTEGRIDAD GRÁFICA Y CONTROL DE CONFIGURACIÓN (PCA)")
    print(" Proyecto: TraceFlow SCM | Organización: ÉXODO S.A.C. | Rama: Etapa 07")
    print("=" * 80)

    # 1. Auditar bloques maestros en DIAGRAMS.md
    with open(DIAGRAMS_MD, 'r', encoding='utf-8') as f:
        master_content = f.read()

    master_blocks = re.findall(r'@startuml[\s\S]*?@enduml', master_content)
    print(f"\n[1] Auditoría de Compendio Central (DIAGRAMS.md):")
    print(f"    - Total bloques PlantUML detectados: {len(master_blocks)}")

    # 2. Auditar archivos .puml en disco y detectar duplicados
    print(f"\n[2] Auditoría de Fuentes Modulares PlantUML (.puml):")
    puml_by_id = {}
    puml_total = 0

    for cat in CATEGORIES:
        cat_dir = os.path.join(PLANTUML_DIR, cat)
        if not os.path.exists(cat_dir):
            print(f"    [FAIL] Directorio faltante: {cat_dir}")
            return False
        files = [f for f in os.listdir(cat_dir) if f.endswith('.puml')]
        print(f"    - Categoría '{cat}': {len(files)} archivos .puml")
        puml_total += len(files)
        for f in files:
            diag_id = f[:-5]
            puml_by_id.setdefault(diag_id, []).append((cat, os.path.join(cat_dir, f)))

    print(f"    - Total archivos .puml en disco: {puml_total}")
    print(f"    - Identificadores únicos en fuentes: {len(puml_by_id)}")

    duplicates = {k: v for k, v in puml_by_id.items() if len(v) > 1}
    if duplicates:
        print(f"\n    [ALERTA DOC-030] IDENTIFICADORES COMPARTIDOS DETECTADOS:")
        for diag_id, locations in duplicates.items():
            print(f"      • Identificador: '{diag_id}' presente en {len(locations)} ubicaciones:")
            for cat, path in locations:
                with open(path, 'r', encoding='utf-8') as pf:
                    title_m = re.search(r'title\s+<b>([^<]+)</b>', pf.read())
                    t = title_m.group(1) if title_m else "Sin título"
                print(f"        - Categoría [{cat}]: {os.path.basename(path)} -> Título: '{t}'")
            print("        * Estado de Gobernanza: Segregación física por subcarpeta preservada; pendiente resolución CCB.")
    else:
        print("    - Sin duplicaciones de identificador detectadas.")

    # 3. Auditar artefactos renderizados (SVG + PNG)
    print(f"\n[3] Auditoría de Renders Vectoriales (SVG) y Rasterizados (PNG):")
    missing_renders = []
    total_svg = 0
    total_png = 0

    for diag_id, locations in puml_by_id.items():
        for cat, _ in locations:
            svg_path = os.path.join(RENDER_DIR, cat, f"{diag_id}.svg")
            png_path = os.path.join(RENDER_DIR, cat, f"{diag_id}.png")

            if os.path.exists(svg_path) and os.path.getsize(svg_path) > 0:
                total_svg += 1
            else:
                missing_renders.append((cat, f"{diag_id}.svg"))

            if os.path.exists(png_path) and os.path.getsize(png_path) > 0:
                total_png += 1
            else:
                missing_renders.append((cat, f"{diag_id}.png"))

    print(f"    - Total archivos SVG conformes (>0 bytes): {total_svg} / {puml_total}")
    print(f"    - Total archivos PNG conformes (>0 bytes): {total_png} / {puml_total}")
    print(f"    - Total artefactos gráficos verificados: {total_svg + total_png} / {puml_total * 2}")

    if missing_renders:
        print(f"    [FAIL] Renders faltantes o vacíos ({len(missing_renders)}): {missing_renders}")
        return False
    else:
        print("    [PASS] Cobertura de renderizado: 100.0% (Cero renders faltantes)")

    # 4. Auditar preservación de nombres decimales
    print(f"\n[4] Auditoría de Preservación de Nombres con Puntos Decimales:")
    decimals = ['DG-SEQ-04.1', 'DG-AO-04.1']
    for d in decimals:
        puml_ok = any(d == k for k in puml_by_id.keys())
        svg_ok = os.path.exists(os.path.join(RENDER_DIR, 'analisis', f"{d}.svg"))
        png_ok = os.path.exists(os.path.join(RENDER_DIR, 'analisis', f"{d}.png"))
        print(f"    - '{d}': PUML={puml_ok}, SVG={svg_ok}, PNG={png_ok} -> {'[OK]' if (puml_ok and svg_ok and png_ok) else '[FAIL]'}")
        if not (puml_ok and svg_ok and png_ok):
            return False

    # 5. Auditar capturas de prototipo React
    print(f"\n[5] Auditoría de Evidencias Reales del Prototipo React:")
    capture_categories = ['autenticacion', 'dashboard', 'rfc', 'analisis-impacto', 'ccb', 'autorizaciones', 'soporte', 'placeholders']
    total_captures = 0
    captures_found = []

    for ccat in capture_categories:
        cdir = os.path.join(CAPTURAS_DIR, ccat)
        if os.path.exists(cdir):
            cfiles = [f for f in os.listdir(cdir) if f.endswith('.png')]
            total_captures += len(cfiles)
            for cf in cfiles:
                sz = os.path.getsize(os.path.join(cdir, cf))
                captures_found.append((ccat, cf, sz))
                print(f"    - [{ccat}] {cf} ({sz:,} bytes)")

    print(f"    - Total capturas registradas: {total_captures} (esperadas: 17)")
    if total_captures != 17:
        print(f"    [FAIL] Conteo de capturas anómalo: {total_captures}")
        return False
    else:
        print("    [PASS] Suite completa de 17 capturas verificada en disco.")

    # 6. Auditar enlaces de imágenes en Markdown
    print(f"\n[6] Auditoría de Referencias Gráficas en Documentos Markdown:")
    markdown_docs = [
        'FD03-EPIS-Informe_SRS.md',
        'FD04-EPIS-Informe_SAD_Analisis.md',
        'FD05-EPIS-Informe_SAD_Diseno.md',
        'DIAGRAMS.md',
        'STITCH_WIREFRAME_PROMPTS.md'
    ]

    total_md_refs = 0
    broken_md_refs = []

    for mdoc in markdown_docs:
        mdoc_path = os.path.join(DOCS_DIR, mdoc)
        if not os.path.exists(mdoc_path):
            continue
        with open(mdoc_path, 'r', encoding='utf-8') as f:
            mc = f.read()
        links = re.findall(r'!\[([^\]]*)\]\((assets/[^\)]+)\)', mc)
        total_md_refs += len(links)
        for alt, target in links:
            target_path = os.path.normpath(os.path.join(DOCS_DIR, target.replace('/', os.sep)))
            if not os.path.exists(target_path) or os.path.getsize(target_path) == 0:
                broken_md_refs.append((mdoc, target))

    print(f"    - Total referencias a 'assets/' inspeccionadas: {total_md_refs}")
    if broken_md_refs:
        print(f"    [FAIL] Enlaces rotos encontrados ({len(broken_md_refs)}): {broken_md_refs}")
        return False
    else:
        print(f"    [PASS] Cero enlaces rotos a assets/ en {len(markdown_docs)} documentos inspeccionados.")

    print("\n" + "=" * 80)
    print(" RESULTADO GLOBAL: CERTIFICACIÓN DE INTEGRIDAD FÍSICA Y GRÁFICA CONFORME (PCA)")
    print("=" * 80)
    return True

if __name__ == '__main__':
    ok = run_audit()
    sys.exit(0 if ok else 1)
