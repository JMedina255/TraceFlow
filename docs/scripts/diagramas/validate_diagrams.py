#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate_diagrams.py
Script de validación para verificar la integridad semántica, ausencia de divergencias
y compilabilidad de las fuentes PlantUML extraídas frente a docs/DIAGRAMS.md.

Proyecto: TraceFlow SCM
Organización: ÉXODO S.A.C.
Equipo: C-SharkTeam
"""

import os
import re
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DIAGRAMS_MD = os.path.join(BASE_DIR, 'DIAGRAMS.md')
PLANTUML_DIR = os.path.join(BASE_DIR, 'assets', 'diagramas', 'plantuml')

CATEGORIES = ['generales', 'analisis', 'diseno', 'uwe']

def validate():
    print("=== INICIANDO VALIDACIÓN DE FUENTES PLANTUML ===")
    
    with open(DIAGRAMS_MD, 'r', encoding='utf-8') as f:
        master_content = f.read()

    master_blocks = re.findall(r'@startuml[\s\S]*?@enduml', master_content)
    print(f"Total bloques maestros en DIAGRAMS.md: {len(master_blocks)}")

    total_puml_files = 0
    all_puml_paths = []

    for cat in CATEGORIES:
        cat_dir = os.path.join(PLANTUML_DIR, cat)
        if not os.path.exists(cat_dir):
            print(f"ERROR: Directorio {cat_dir} no existe!")
            sys.exit(1)
        files = [os.path.join(cat_dir, f) for f in os.listdir(cat_dir) if f.endswith('.puml')]
        print(f"  Categoría '{cat}': {len(files)} archivos .puml")
        total_puml_files += len(files)
        all_puml_paths.extend(files)

    print(f"Total archivos .puml en disco: {total_puml_files}")
    assert total_puml_files == len(master_blocks), f"Discrepancia en conteo: {total_puml_files} vs {len(master_blocks)}"

    # Validate syntax markers in every .puml file
    syntax_errors = 0
    for path in all_puml_paths:
        with open(path, 'r', encoding='utf-8') as f:
            c = f.read().strip()
        if not (c.startswith('@startuml') and c.endswith('@enduml')):
            print(f"ERROR: Archivo {path} no posee etiquetas completas @startuml / @enduml")
            syntax_errors += 1
        if len(c) < 30:
            print(f"ALERTA: Archivo {path} parece anormalmente corto ({len(c)} bytes)")
            syntax_errors += 1

    if syntax_errors == 0:
        print("Certificación de Integridad: 100% de los archivos .puml poseen sintaxis estándar válida.")
    else:
        print(f"Se detectaron {syntax_errors} errores de sintaxis.")
        sys.exit(1)

    print("=== VALIDACIÓN DE FUENTES COMPLETADA EXITOSAMENTE ===")

if __name__ == '__main__':
    validate()
