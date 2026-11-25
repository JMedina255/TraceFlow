#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract_diagrams.py
Script de automatización para la extracción y sincronización sistemática
de especificaciones PlantUML desde docs/DIAGRAMS.md hacia archivos individuales .puml
con codificación UTF-8 explícita y detección dinámica de identificadores y categorías.

Proyecto: TraceFlow SCM
Organización: ÉXODO S.A.C.
Equipo: C-SharkTeam
"""

import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DIAGRAMS_MD = BASE_DIR / 'DIAGRAMS.md'
PLANTUML_DIR = BASE_DIR / 'assets' / 'diagramas' / 'plantuml'

CATEGORIES = {
    'generales': PLANTUML_DIR / 'generales',
    'analisis': PLANTUML_DIR / 'analisis',
    'diseno': PLANTUML_DIR / 'diseno',
    'uwe': PLANTUML_DIR / 'uwe',
}


def ensure_directories() -> None:
    for path in CATEGORIES.values():
        path.mkdir(parents=True, exist_ok=True)


def infer_id_and_category(heading: str, block: str, idx: int) -> tuple[str, str]:
    """Determina el identificador canónico y categoría sin depender de índices fijos."""
    # 1. Revisar @startuml <ID>
    start_match = re.match(r'@startuml\s+([A-Za-z0-9_.\-]+)', block.strip())
    # 2. Revisar encabezado Markdown inmediato (# DG-... o ### DG-...)
    heading_match = re.search(r'\b(DG-[A-Z0-9.\-]+)', heading)
    # 3. Revisar title <b>ID: ...</b>
    title_match = re.search(r'title\s+(?:<b>)?(DG-[A-Z0-9.\-]+)', block)

    diag_id = None
    if start_match and start_match.group(1).startswith('DG-'):
        diag_id = start_match.group(1)
    elif heading_match:
        diag_id = heading_match.group(1)
    elif title_match:
        diag_id = title_match.group(1)
    elif idx < 11:
        diag_id = f"DG-{idx + 1:02d}"
    elif idx == 11:
        diag_id = "DG-12-HIST"
    elif idx == 12:
        diag_id = "DG-13"
    else:
        diag_id = f"DG-EXTRA-{idx}"

    if diag_id.startswith(('DG-UWE-')):
        category = 'uwe'
    elif diag_id.startswith(('DG-D0', 'DG-DSEQ-', 'DG-ER-')):
        category = 'diseno'
    elif diag_id.startswith(('DG-SEQ-', 'DG-AO-', 'DG-ACT-', 'DG-SAD-')) or diag_id == 'DG-12':
        category = 'analisis'
    else:
        category = 'generales'

    return diag_id, category


def extract_diagrams() -> list[tuple[str, str, str, int]]:
    ensure_directories()
    content = DIAGRAMS_MD.read_text(encoding='utf-8').lstrip('\ufeff')

    pattern = re.compile(r'(@startuml[\s\S]*?@enduml)')
    matches = list(pattern.finditer(content))
    print(f"Total bloques @startuml detectados en DIAGRAMS.md: {len(matches)}")

    extracted_count = 0
    manifest_entries: list[tuple[str, str, str, int]] = []

    for idx, match in enumerate(matches):
        block = match.group(1)
        # Tomar los últimos 400 caracteres previos para ubicar el encabezado Markdown del diagrama
        context_before = content[max(0, match.start() - 400):match.start()]
        headings = re.findall(r'^#{1,4}\s+(.+)$', context_before, re.M)
        nearest_heading = headings[-1] if headings else ''

        diag_id, category = infer_id_and_category(nearest_heading, block, idx)
        target_file = CATEGORIES[category] / f"{diag_id}.puml"
        clean_block = block.strip() + '\n'
        target_file.write_text(clean_block, encoding='utf-8')

        extracted_count += 1
        manifest_entries.append((diag_id, category, str(target_file), len(clean_block)))

    print(f"Extracción UTF-8 completada exitosamente: {extracted_count} archivos .puml sincronizados.")
    return manifest_entries


if __name__ == '__main__':
    extract_diagrams()
