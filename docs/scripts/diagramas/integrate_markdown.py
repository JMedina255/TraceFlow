#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
integrate_markdown.py
Automatiza la integración de los recursos gráficos renderizados (SVG/PNG)
y capturas del prototipo en los documentos Markdown oficiales:
- docs/FD05-EPIS-Informe_SAD_Diseno.md
- docs/FD04-EPIS-Informe_SAD_Analisis.md
- docs/FD03-EPIS-Informe_SRS.md
- docs/STITCH_WIREFRAME_PROMPTS.md

Proyecto: TraceFlow SCM
Organización: ÉXODO S.A.C.
Equipo: C-SharkTeam
"""

import os
import re

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DOCS_DIR = os.path.join(BASE_DIR, 'docs')

def update_fd05():
    file_path = os.path.join(DOCS_DIR, 'FD05-EPIS-Informe_SAD_Diseno.md')
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern for the 36 editorial notices in FD05
    pattern = re.compile(
        r'> \*\*Aviso Editorial \(Etapa 05 — Estado Gráfico\)\*\*: El identificador \*\*([^\*]+)\*\* y su especificación PlantUML se conservan íntegros como definición formal de diseño\.[^\n]+'
    )

    def replacer(match):
        diag_id = match.group(1).strip()
        pos = match.end()
        title_match = re.search(r'title <b>([^<]+)</b>', content[pos:pos+1500])
        raw_title = title_match.group(1).strip() if title_match else diag_id
        clean_title = re.sub(r'^' + re.escape(diag_id) + r'\s*:\s*', '', raw_title)
        cat = 'uwe' if 'UWE' in diag_id else 'diseno'
        return f"**Figura {diag_id}. {clean_title}**\n\n![Figura {diag_id} — {clean_title}](assets/diagramas/render/{cat}/{diag_id}.svg)\n\n*Fuente: Elaboración propia a partir del modelo PlantUML {diag_id}.*"

    updated, count = pattern.subn(replacer, content)
    print(f"[FD05] Reemplazados {count} avisos de renderizado con figuras SVG.")

    # Cross-reference prototype captures in Section 21
    # Check if prototype evidence section is already added
    if "### 21.11 Evidencias Visuales de Implementación en el Prototipo React" not in updated:
        evidence_section = """

---

## 21.11 Evidencias Visuales de Implementación en el Prototipo React (Etapa 06)

Como parte de la formalización gráfica y verificación técnica de la Etapa 06, se ejecutó el prototipo React SPA (`prototype/`) en modo preview y se recopiló un catálogo de **17 capturas reales de interfaz** en alta resolución (1440 × 900 píxeles), contrastadas directamente contra los wireframes de baja fidelidad:

| Pantalla | Wireframe | Ruta en Prototipo | Rol Evaluado | Archivo de Captura | Estado de Verificación |
|---|---|---|---|---|:---:|
| `SCREEN-01` | `WF-01` | `/login` | Público | [`SCREEN-01_login_institucional.png`](assets/capturas/autenticacion/SCREEN-01_login_institucional.png) | ✅ Implementado |
| `SCREEN-02` | `WF-02` | `/dashboard` | `PU-01` | [`SCREEN-02_dashboard_solicitante.png`](assets/capturas/dashboard/SCREEN-02_dashboard_solicitante.png) | ✅ Implementado |
| `SCREEN-02` | `WF-02` | `/dashboard` | `PU-02` | [`SCREEN-02_dashboard_gestor.png`](assets/capturas/dashboard/SCREEN-02_dashboard_gestor.png) | ✅ Implementado |
| `SCREEN-02` | `WF-02` | `/dashboard` | `PU-04` | [`SCREEN-02_dashboard_ccb.png`](assets/capturas/dashboard/SCREEN-02_dashboard_ccb.png) | ✅ Implementado |
| `SCREEN-03` | `WF-03` | `/projects` | `PU-02` | [`SCREEN-03_directorio_proyectos_placeholder.png`](assets/capturas/placeholders/SCREEN-03_directorio_proyectos_placeholder.png) | ✅ Implementado |
| `SCREEN-05` | `WF-05` | `/rfcs` | `PU-02` | [`SCREEN-05_bandeja_general_rfcs.png`](assets/capturas/rfc/SCREEN-05_bandeja_general_rfcs.png) | ✅ Implementado |
| `SCREEN-06` | `WF-06` | `/rfcs/RFC-2026-0001` | `PU-02` | [`SCREEN-06_expediente_360_rfc.png`](assets/capturas/rfc/SCREEN-06_expediente_360_rfc.png) | ✅ Implementado |
| `SCREEN-07` | `WF-07` | `/rfcs/new` | `PU-01` | [`SCREEN-07_captura_rfc.png`](assets/capturas/rfc/SCREEN-07_captura_rfc.png) | ✅ Implementado |
| `SCREEN-07` | `WF-07` | `/rfcs/RFC-2026-0001/edit` | `PU-01` | [`SCREEN-07_subsanacion_rfc.png`](assets/capturas/rfc/SCREEN-07_subsanacion_rfc.png) | ✅ Implementado |
| `SCREEN-08` | `WF-08` | `/rfcs/RFC-2026-0001/impact-analysis` | `PU-03` | [`SCREEN-08_analisis_impacto_tecnico.png`](assets/capturas/analisis-impacto/SCREEN-08_analisis_impacto_tecnico.png) | ✅ Implementado |
| `SCREEN-09` | `WF-09` | `/rfcs/RFC-2026-0001/ccb-deliberation` | `PU-04` | [`SCREEN-09_sala_deliberacion_ccb.png`](assets/capturas/ccb/SCREEN-09_sala_deliberacion_ccb.png) | ✅ Implementado |
| `SCREEN-10` | `WF-10` | `/rfcs/RFC-2026-0002/minor-approval` | `PU-02 / PU-03` | [`SCREEN-10_autorizacion_cambio_menor.png`](assets/capturas/autorizaciones/SCREEN-10_autorizacion_cambio_menor.png) | ✅ Implementado |
| `SCREEN-12` | `WF-12` | `/ecs` | `PU-05` | [`SCREEN-12_explorador_ecs_placeholder.png`](assets/capturas/placeholders/SCREEN-12_explorador_ecs_placeholder.png) | ✅ Implementado |
| `SCREEN-13` | `WF-13` | `/scm/operations` | `PU-05` | [`SCREEN-13_operaciones_scm_placeholder.png`](assets/capturas/placeholders/SCREEN-13_operaciones_scm_placeholder.png) | ✅ Implementado |
| `SCREEN-17` | `WF-17` | `/baselines` | `PU-05` | [`SCREEN-17_lineas_base_placeholder.png`](assets/capturas/placeholders/SCREEN-17_lineas_base_placeholder.png) | ✅ Implementado |
| `SOPORTE-01` | N/A | `/ruta-inexistente-404` | Multi-rol | [`SOPORTE-01_error_404_not_found.png`](assets/capturas/soporte/SOPORTE-01_error_404_not_found.png) | ✅ Implementado |
| `SOPORTE-02` | N/A | `/projects` (bajo PU-01) | `PU-01` | [`SOPORTE-02_error_403_access_denied.png`](assets/capturas/soporte/SOPORTE-02_error_403_access_denied.png) | ✅ Implementado |

*Nota:* El índice técnico completo y los metadatos de resolución se encuentran en [`docs/assets/capturas/INDEX.md`](assets/capturas/INDEX.md).
"""
        # Insert before Section 22
        if "## 22. Arquitectura de Despliegue" in updated:
            updated = updated.replace("## 22. Arquitectura de Despliegue", evidence_section + "\n\n## 22. Arquitectura de Despliegue")
        else:
            updated += evidence_section
        print("[FD05] Sección 21.11 de evidencias de prototipo incorporada exitosamente.")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(updated)
    print(f"[FD05] Archivo guardado con éxito: {file_path}")

def update_fd04():
    file_path = os.path.join(DOCS_DIR, 'FD04-EPIS-Informe_SAD_Analisis.md')
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. DG-SAD-A01 in Section 3.4
    old_note_a01 = """> El modelo conceptual `DG-SAD-A01` está plenamente especificado mediante la sintaxis PlantUML declarada abajo y en `DIAGRAMS.md`. Su renderizado gráfico en formato `.png` está programado para la Etapa 05 bajo la ruta canónica `docs/assets/diagramas/render/analisis/DG-SAD-A01.png`. Se ratifica su vigencia como modelo de análisis de primer orden."""
    new_fig_a01 = """**Figura DG-SAD-A01. Contexto Arquitectónico de TraceFlow SCM (Fase de Análisis)**

![Figura DG-SAD-A01 — Contexto Arquitectónico](assets/diagramas/render/analisis/DG-SAD-A01.svg)

*Fuente: Elaboración propia a partir del modelo PlantUML DG-SAD-A01.*"""

    if old_note_a01 in content:
        content = content.replace(old_note_a01, new_fig_a01)
        print("[FD04] DG-SAD-A01 integrado con figura SVG.")

    # 2. DG-SAD-A02 in Section 4.3
    old_note_a02 = """> El modelo conceptual `DG-SAD-A02` está plenamente especificado mediante la sintaxis PlantUML declarada abajo y en `DIAGRAMS.md`. Su renderizado gráfico en formato `.png` está programado para la Etapa 05 bajo la ruta canónica `docs/assets/diagramas/render/analisis/DG-SAD-A02.png`. Se ratifica su vigencia como representación lógica canónica para la descomposición modular del sistema."""
    new_fig_a02 = """**Figura DG-SAD-A02. Arquitectura Lógica Conceptual de TraceFlow SCM**

![Figura DG-SAD-A02 — Arquitectura Lógica Conceptual](assets/diagramas/render/analisis/DG-SAD-A02.svg)

*Fuente: Elaboración propia a partir del modelo PlantUML DG-SAD-A02.*"""

    if old_note_a02 in content:
        content = content.replace(old_note_a02, new_fig_a02)
        print("[FD04] DG-SAD-A02 integrado con figura SVG.")

    # 3. DG-12 in Section 6.1
    # Check if figure block exists for DG-12
    if "**Figura DG-12." not in content:
        target_str = "A continuación se reproduce el diagrama conceptual maestro **`DG-12`**, formalizado y aprobado en el cierre de la baseline del SRS:\n\n```plantuml\n@startuml DG-12"
        replacement_str = """A continuación se reproduce el diagrama conceptual maestro **`DG-12`**, formalizado y aprobado en el cierre de la baseline del SRS:

**Figura DG-12. Modelo Conceptual del Dominio TraceFlow SCM (Fase de Análisis)**

![Figura DG-12 — Modelo Conceptual del Dominio](assets/diagramas/render/analisis/DG-12.svg)

*Fuente: Elaboración propia a partir del modelo PlantUML DG-12.*

```plantuml
@startuml DG-12"""
        if target_str in content:
            content = content.replace(target_str, replacement_str)
            print("[FD04] DG-12 integrado con figura SVG.")

    # 4. Update closing checklist in Section 13
    old_check = "- Ratificación de los modelos DG-SAD-A01 y DG-SAD-A02 (renderizado programado para Etapa 05)."
    new_check = "- Integración de recursos gráficos renderizados SVG/PNG de DG-SAD-A01, DG-SAD-A02 y DG-12 (Etapa 06)."
    if old_check in content:
        content = content.replace(old_check, new_check)
        print("[FD04] Checklist de cierre actualizado para Etapa 06.")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"[FD04] Archivo guardado con éxito: {file_path}")

def update_fd03():
    file_path = os.path.join(DOCS_DIR, 'FD03-EPIS-Informe_SRS.md')
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # In FD03, replace planned figure notices for DG-SEQ and DG-AO with real figure links
    # Pattern: > \*Ubicación planificada:\* `docs/assets/diagramas/render/analisis/([^`]+)\.png` \(Plan de formalización gráfica Etapa 05 / Trazabilidad DOC-004 y DOC-005\)\.
    pattern = re.compile(
        r'> \*Ubicación planificada:\* `docs/assets/diagramas/render/analisis/([^`]+)\.png` \(Plan de formalización gráfica Etapa 05 / Trazabilidad DOC-004 y DOC-005\)\.'
    )

    def replacer_fd03(match):
        diag_id = match.group(1).strip()
        pos = match.start()
        # Find header or title before this match
        snippet_before = content[max(0, pos-400):pos]
        title_search = re.findall(r'###\s+[^:]+:\s*([^\n]+)', snippet_before)
        clean_title = title_search[-1].strip() if title_search else f"Especificación {diag_id}"
        # Strip markdown bold if present
        clean_title = clean_title.replace('**', '').replace('__', '')
        return f"**Figura {diag_id}. {clean_title}**\n\n![Figura {diag_id} — {clean_title}](assets/diagramas/render/analisis/{diag_id}.svg)\n\n*Fuente: Elaboración propia a partir del modelo PlantUML {diag_id}.*"

    updated, count = pattern.subn(replacer_fd03, content)
    print(f"[FD03] Reemplazados {count} avisos de renderizado planificado con figuras SVG.")

    # Update general diagrams DG-01 to DG-13 and DG-SEQ-01 to DG-SEQ-28 to point to new SVG render paths
    def replacer_hist(match):
        alt_text = match.group(1)
        filename = match.group(2) # e.g. DG-01.png
        diag_id = filename.replace('.png', '')
        
        if diag_id in ['DG-01', 'DG-02', 'DG-03', 'DG-04', 'DG-05', 'DG-06', 'DG-07', 'DG-08', 'DG-09', 'DG-10', 'DG-11', 'DG-13']:
            cat = 'generales'
        elif diag_id == 'DG-12' or diag_id.startswith('DG-SEQ'):
            cat = 'analisis'
        else:
            cat = 'generales'
            
        return f"![{alt_text}](assets/diagramas/render/{cat}/{diag_id}.svg)\n\n*Fuente: Elaboración propia a partir del modelo PlantUML {diag_id}.*"

    updated, count_hist = re.subn(r'!\[([^\]]+)\]\(\.\./assets/([^\)]+)\)', replacer_hist, updated)
    print(f"[FD03] Actualizadas {count_hist} referencias históricas hacia assets/diagramas/render/ con SVG.")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(updated)
    print(f"[FD03] Archivo guardado con éxito: {file_path}")

def update_stitch():
    file_path = os.path.join(DOCS_DIR, 'STITCH_WIREFRAME_PROMPTS.md')
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    target_heading = "# 10. Nota de gobernanza"
    evidence_text = """## 9.1 Evidencia de Implementación en Prototipo React (Etapa 06)

Como parte de la consolidación de la Etapa 06, el prototipo navegable React implementó la suite completa de pantallas aquí especificadas, recopilando **17 capturas reales** en `docs/assets/capturas/`:

- **Autenticación:** `SCREEN-01` (`assets/capturas/autenticacion/SCREEN-01_login_institucional.png`)
- **Dashboards:** `SCREEN-02` en 3 variantes de rol (`assets/capturas/dashboard/`)
- **Flujo de RFC:** `SCREEN-05` (Bandeja), `SCREEN-06` (Expediente 360°), `SCREEN-07` (Alta y Subsanación) en `assets/capturas/rfc/`
- **Análisis de Impacto:** `SCREEN-08` (`assets/capturas/analisis-impacto/SCREEN-08_analisis_impacto_tecnico.png`)
- **Deliberación CCB:** `SCREEN-09` (`assets/capturas/ccb/SCREEN-09_sala_deliberacion_ccb.png`)
- **Autorización Cambio Menor:** `SCREEN-10` (`assets/capturas/autorizaciones/SCREEN-10_autorizacion_cambio_menor.png`)
- **Soporte y Seguridad:** `SOPORTE-01` (404 Not Found) y `SOPORTE-02` (403 Forbidden SoD) en `assets/capturas/soporte/`
- **Componentes Demostrativos:** `SCREEN-03`, `SCREEN-12`, `SCREEN-13`, `SCREEN-17` en `assets/capturas/placeholders/`

El inventario exhaustivo con resoluciones y trazabilidad se encuentra en [`docs/assets/capturas/INDEX.md`](assets/capturas/INDEX.md).

---

"""

    if "## 9.1 Evidencia de Implementación en Prototipo React" not in content:
        if target_heading in content:
            content = content.replace(target_heading, evidence_text + target_heading)
            print("[STITCH] Evidencia de prototipo incorporada en Sección 9.1.")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"[STITCH] Archivo guardado con éxito: {file_path}")

if __name__ == '__main__':
    update_fd05()
    update_fd04()
    update_fd03()
    update_stitch()
