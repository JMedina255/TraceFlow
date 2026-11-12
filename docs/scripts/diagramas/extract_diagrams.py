#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract_diagrams.py
Script de automatización para la extracción y sincronización sistemática
de especificaciones PlantUML desde docs/DIAGRAMS.md hacia archivos individuales .puml.

Proyecto: TraceFlow SCM
Organización: ÉXODO S.A.C.
Equipo: C-SharkTeam
"""

import os
import re

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DIAGRAMS_MD = os.path.join(BASE_DIR, 'DIAGRAMS.md')
PLANTUML_DIR = os.path.join(BASE_DIR, 'assets', 'diagramas', 'plantuml')

CATEGORIES = {
    'generales': os.path.join(PLANTUML_DIR, 'generales'),
    'analisis': os.path.join(PLANTUML_DIR, 'analisis'),
    'diseno': os.path.join(PLANTUML_DIR, 'diseno'),
    'uwe': os.path.join(PLANTUML_DIR, 'uwe'),
}

def ensure_directories():
    for path in CATEGORIES.values():
        os.makedirs(path, exist_ok=True)

def extract_diagrams():
    ensure_directories()
    
    with open(DIAGRAMS_MD, 'r', encoding='utf-8') as f:
        content = f.read()

    blocks = re.findall(r'@startuml[\s\S]*?@enduml', content)
    print(f"Total bloques @startuml detectados en DIAGRAMS.md: {len(blocks)}")

    extracted_count = 0
    manifest_entries = []

    for idx, block in enumerate(blocks):
        # Determine canonical ID and target directory
        if idx < 11:
            diag_id = f"DG-{idx+1:02d}"
            category = 'generales'
        elif idx == 11:
            diag_id = "DG-12"
            category = 'generales'
        elif idx == 12:
            diag_id = "DG-13"
            category = 'generales'
        elif 13 <= idx <= 43:
            # Sequences: DG-SEQ-01 to DG-SEQ-30 (includes DG-SEQ-04.1)
            m = re.search(r'title\s+(?:<b>)?(DG-SEQ-[0-9\.]+)', block)
            diag_id = m.group(1) if m else f"DG-SEQ-UNKNOWN-{idx}"
            category = 'analisis'
        elif 44 <= idx <= 74:
            # BCE Robustness: DG-AO-01 to DG-AO-30 (includes DG-AO-04.1)
            m = re.search(r'title\s+(?:<b>)?(DG-AO-[0-9\.]+)', block)
            diag_id = m.group(1) if m else f"DG-AO-UNKNOWN-{idx}"
            category = 'analisis'
        elif idx == 75:
            diag_id = "DG-12"
            category = 'analisis'
        elif idx == 76:
            diag_id = "DG-SAD-A01"
            category = 'analisis'
        elif idx == 77:
            diag_id = "DG-SAD-A02"
            category = 'analisis'
        elif 78 <= idx <= 83:
            # Design Physical: DG-D01 to DG-D06
            m = re.search(r'title\s+(?:<b>)?(DG-D0[1-6])', block)
            diag_id = m.group(1) if m else f"DG-D-UNKNOWN-{idx}"
            category = 'diseno'
        elif 84 <= idx <= 92:
            # Design Technical Sequences: DG-DSEQ-04 to DG-DSEQ-30
            m = re.search(r'title\s+(?:<b>)?(DG-DSEQ-[0-9]+)', block)
            diag_id = m.group(1) if m else f"DG-DSEQ-UNKNOWN-{idx}"
            category = 'diseno'
        elif 93 <= idx <= 100:
            # Navigation UWE: DG-UWE-NAV-01 to DG-UWE-NAV-08
            m = re.search(r'title\s+(?:<b>)?(DG-UWE-NAV-0[1-8])', block)
            diag_id = m.group(1) if m else f"DG-UWE-NAV-UNKNOWN-{idx}"
            category = 'uwe'
        elif 101 <= idx <= 113:
            # Presentation UWE: DG-UWE-PRES-01 to DG-UWE-PRES-13
            m = re.search(r'title\s+(?:<b>)?(DG-UWE-PRES-[0-9]+)', block)
            diag_id = m.group(1) if m else f"DG-UWE-PRES-UNKNOWN-{idx}"
            category = 'uwe'
        else:
            diag_id = f"DG-EXTRA-{idx}"
            category = 'generales'

        target_file = os.path.join(CATEGORIES[category], f"{diag_id}.puml")
        
        # Clean block content ensuring standard UTF-8 and trailing newline
        clean_block = block.strip() + '\n'

        with open(target_file, 'w', encoding='utf-8') as out:
            out.write(clean_block)

        extracted_count += 1
        manifest_entries.append((diag_id, category, target_file, len(clean_block)))

    print(f"Extracción completada exitosamente: {extracted_count} archivos .puml generados.")
    return manifest_entries

if __name__ == '__main__':
    extract_diagrams()
