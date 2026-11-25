#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate_diagrams.py
Script de validación para verificar la integridad semántica, paridad frente a docs/DIAGRAMS.md,
codificación UTF-8 estricta sin BOM ni secuencias de mojibake en fuentes .puml y renders SVG.

Proyecto: TraceFlow SCM
Organización: ÉXODO S.A.C.
Equipo: C-SharkTeam
"""

import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DIAGRAMS_MD = BASE_DIR / 'DIAGRAMS.md'
PLANTUML_DIR = BASE_DIR / 'assets' / 'diagramas' / 'plantuml'
RENDER_DIR = BASE_DIR / 'assets' / 'diagramas' / 'render'

CATEGORIES = ['generales', 'analisis', 'diseno', 'uwe']
MOJIBAKE_RE = re.compile(r'(?:Ã[\x80-\xbf¡-¿]?|Â[¿¡°ºª\x80-\xbf]?|â\x80|\ufffd)')


def check_text_encoding(path: Path, raw_bytes: bytes) -> list[str]:
    """Valida UTF-8 estricto sin BOM, sin reemplazo Unicode y sin secuencias mojibake."""
    issues: list[str] = []
    if raw_bytes.startswith(b'\xef\xbb\xbf'):
        issues.append(f"BOM UTF-8 no permitido en {path}")
    try:
        text = raw_bytes.decode('utf-8')
    except UnicodeDecodeError as exc:
        issues.append(f"Error de decodificación UTF-8 en {path}: {exc}")
        return issues

    hits = MOJIBAKE_RE.findall(text)
    if hits or '\ufffd' in text:
        issues.append(f"Secuencias de mojibake/reemplazo en {path}: {hits[:5]}")
    return issues


def validate() -> None:
    print("=== INICIANDO VALIDACIÓN DE FUENTES PLANTUML Y CODIFICACIÓN UTF-8 ===")

    master_raw = DIAGRAMS_MD.read_bytes()
    master_issues = check_text_encoding(DIAGRAMS_MD, master_raw)
    if master_issues:
        for iss in master_issues:
            print(f"ERROR: {iss}")
        sys.exit(1)

    master_content = master_raw.decode('utf-8')
    master_blocks = re.findall(r'@startuml[\s\S]*?@enduml', master_content)
    print(f"Total bloques maestros en DIAGRAMS.md: {len(master_blocks)}")

    total_puml_files = 0
    all_puml_paths: list[tuple[str, Path]] = []

    for cat in CATEGORIES:
        cat_dir = PLANTUML_DIR / cat
        if not cat_dir.exists():
            print(f"ERROR: Directorio {cat_dir} no existe!")
            sys.exit(1)
        files = sorted(cat_dir.glob('*.puml'))
        print(f"  Categoría '{cat}': {len(files)} archivos .puml")
        total_puml_files += len(files)
        for f in files:
            all_puml_paths.append((cat, f))

    print(f"Total archivos .puml en disco: {total_puml_files}")
    assert total_puml_files == len(master_blocks), f"Discrepancia en conteo: {total_puml_files} vs {len(master_blocks)}"

    syntax_errors = 0
    encoding_errors = 0

    for cat, path in all_puml_paths:
        raw = path.read_bytes()
        for iss in check_text_encoding(path, raw):
            print(f"ERROR CODIFICACIÓN: {iss}")
            encoding_errors += 1

        c = raw.decode('utf-8', errors='replace').strip()
        if not (c.startswith('@startuml') and c.endswith('@enduml')):
            print(f"ERROR: Archivo {path} no posee etiquetas completas @startuml / @enduml")
            syntax_errors += 1
        if len(c) < 30:
            print(f"ALERTA: Archivo {path} parece anormalmente corto ({len(c)} bytes)")
            syntax_errors += 1

        # Verificar texto XML del SVG correspondiente si ya existe
        svg_path = RENDER_DIR / cat / f"{path.stem}.svg"
        if svg_path.exists():
            svg_raw = svg_path.read_bytes()
            for iss in check_text_encoding(svg_path, svg_raw):
                print(f"ERROR CODIFICACIÓN SVG: {iss}")
                encoding_errors += 1
            try:
                root = ET.fromstring(svg_raw.decode('utf-8'))
                xml_texts = ' '.join(el.text.strip() for el in root.iter() if el.text and el.text.strip())
                xml_hits = MOJIBAKE_RE.findall(xml_texts)
                if xml_hits or '\ufffd' in xml_texts:
                    print(f"ERROR XML MOJIBAKE en {svg_path}: {xml_hits[:5]}")
                    encoding_errors += 1
            except Exception as exc:
                print(f"ERROR XML en {svg_path}: {exc}")
                syntax_errors += 1

    if syntax_errors == 0 and encoding_errors == 0:
        print("Certificación de Integridad y UTF-8: 100% de las fuentes .puml y SVG evaluados son válidos y libres de mojibake.")
    else:
        print(f"Se detectaron {syntax_errors} errores de sintaxis/XML y {encoding_errors} errores de codificación UTF-8.")
        sys.exit(1)

    print("=== VALIDACIÓN COMPLETADA EXITOSAMENTE ===")


if __name__ == '__main__':
    validate()
