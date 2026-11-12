#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
update_maestro.py
Actualiza docs/MAESTRO_CAMBIOS_SRS_SAD.md a la versión 0.6.0 (Etapa 06).

Proyecto: TraceFlow SCM
Organización: ÉXODO S.A.C.
Equipo: C-SharkTeam
"""

import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
MAESTRO_PATH = os.path.join(BASE_DIR, 'docs', 'MAESTRO_CAMBIOS_SRS_SAD.md')

def main():
    with open(MAESTRO_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc_status_updates = {
        'DOC-004': 'Implementado (Etapa 06 — 31 diagramas DG-AO renderizados en SVG y PNG)',
        'DOC-005': 'Implementado (Etapa 06 — DG-SEQ-04.1, 29 y 30 renderizados en SVG y PNG)',
        'DOC-007': 'Implementado (Etapa 06 — DG-SAD-A01 y DG-SAD-A02 renderizados e integrados)',
        'DOC-009': 'Implementado (Etapa 06 — 36 diagramas de diseño renderizados e integrados en FD05)',
        'DOC-013': 'Implementado (Etapa 06 — 114 archivos .puml extraídos y modularizados)',
        'DOC-016': 'Implementado (Etapa 06 — 17 capturas reales del prototipo integradas)',
        'DOC-018': 'Implementado (Etapa 06 — Inventario gráfico cerrado y validado en 114 diagramas)',
    }

    new_lines = []
    in_section_6 = False
    in_section_13 = False

    for line in lines:
        # Header updates
        if 'Última Actualización:' in line and 'Etapa 05' in line:
            line = line.replace(
                '12 de Noviembre de 2026 (Etapa 05 — Actualización Integral del SAD de Diseño)',
                '12 de Noviembre de 2026 (Etapa 06 — Formalización Gráfica, Extracción PlantUML y Capturas de Prototipo)'
            )
        elif 'Versión del Archivo Maestro:** `0.5.0`' in line:
            line = line.replace('`0.5.0`', '`0.6.0`')
        elif 'Estado Documental:** **BORRADOR DE TRABAJO (Alineamiento SAD Diseño Etapa 05' in line:
            line = line.replace(
                'BORRADOR DE TRABAJO (Alineamiento SAD Diseño Etapa 05 — Pendiente de Aprobación Formal)',
                'BORRADOR DE TRABAJO (Formalización Gráfica Etapa 06 — Pendiente de Aprobación Formal)'
            )

        # Section 1 updates
        elif 'Fecha de Revisión Vigente**|' in line and 'Etapa 05' in line:
            line = line.replace(
                '12 de Noviembre de 2026 (Etapa 05: Actualización Integral del SAD de Diseño)',
                '12 de Noviembre de 2026 (Etapa 06: Formalización Gráfica, Extracción PlantUML y Capturas)'
            )
        elif '**Versión del Maestro** | `0.5.0` |' in line:
            line = line.replace('`0.5.0`', '`0.6.0`')
        elif '*(Alineamiento SAD Diseño Etapa 05 — Pendiente de Aprobación Formal por CCB)*' in line:
            line = line.replace(
                '*(Alineamiento SAD Diseño Etapa 05 — Pendiente de Aprobación Formal por CCB)*',
                '*(Formalización Gráfica Etapa 06 — Pendiente de Aprobación Formal por CCB)*'
            )

        # Section 6 table update
        if '## 6. Registro Maestro de Cambios Documentales' in line:
            in_section_6 = True
        elif '## 7.' in line:
            in_section_6 = False

        if in_section_6 and line.strip().startswith('| **`DOC-'):
            parts = [p.strip() for p in line.split('|')]
            # Table line: | ID | Documento | Sección | Hallazgo | Evidencia | Cambio Propuesto | Prioridad | Estado |
            # parts has 10 elements: ['', ID, Doc, Sec, Hal, Evi, Cam, Prio, Est, '']
            if len(parts) >= 9:
                for doc_id, new_status in doc_status_updates.items():
                    if doc_id in parts[1]:
                        parts[8] = new_status
                        line = ' | '.join(parts) + '\n'
                        break

        # Section 13 table update
        if '## 13. Historial de Cambios del Archivo Maestro' in line:
            in_section_13 = True

        if in_section_13 and '| **12/11/2026** | **0.5.0** |' in line:
            v06_row = '| **12/11/2026** | **0.6.0** | C-SharkTeam (Medina, Antayhua, Loyola, Rivera) | Formalización gráfica, modularización PlantUML y evidencias del prototipo (Etapa 06): extracción de 114 archivos `.puml` organizados por subsistema (`generales`, `analisis`, `diseno`, `uwe`), renderizado determinístico del 100% de diagramas en formato dual (114 SVG + 114 PNG), generación de 17 capturas reales del prototipo React en alta resolución (1440x900) cubriendo todos los roles y módulos, integración de figuras SVG en `FD03`, `FD04` y `FD05`, creación de `MANIFEST.md`, `INDEX.md`, `README.md`, y cierre de ítems DOC-004, DOC-005, DOC-007, DOC-009, DOC-013, DOC-016 y DOC-018. | Instrucción de Agente — Etapa 06 (Rama `docs/alineacion-srs-sad-2026-11-12`) |\n'
            new_lines.append(v06_row)
            in_section_13 = False

        new_lines.append(line)

    with open(MAESTRO_PATH, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print(f"[OK] MAESTRO_CAMBIOS_SRS_SAD.md actualizado exitosamente a v0.6.0 en: {MAESTRO_PATH}")

if __name__ == '__main__':
    main()
