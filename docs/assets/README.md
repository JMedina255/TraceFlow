# Guía de Recursos Gráficos, Visuales y Evidencias — TraceFlow SCM

> **Proyecto:** TraceFlow SCM — Sistema de Gestión de Configuración de Software  
> **Organización:** ÉXODO S.A.C. | **Equipo:** C-SharkTeam  
> **Línea Base:** Etapa 06 (Formalización Gráfica, Extracción PlantUML y Capturas de Prototipo)  
> **Fecha:** 12/11/2026  

---

## 1. Organización del Directorio `docs/assets/`

```text
docs/assets/
├── README.md                          <- Guía técnica de mantenimiento y reproducción
├── diagramas/
│   ├── MANIFEST.md                    <- Manifiesto completo de los 114 diagramas oficiales
│   ├── plantuml/                      <- Códigos fuente originales (.puml)
│   │   ├── generales/                 <- 13 diagramas generales (DG-01 a DG-13)
│   │   ├── analisis/                  <- 65 diagramas de análisis (DG-SEQ, DG-AO, DG-SAD-A)
│   │   ├── diseno/                    <- 15 diagramas arquitectónicos y secuencias (DG-D, DG-DSEQ)
│   │   └── uwe/                       <- 21 diagramas UWE (DG-UWE-NAV, DG-UWE-PRES)
│   └── render/                        <- Renders generados en formatos SVG y PNG
│       ├── generales/                 <- 13 SVG + 13 PNG
│       ├── analisis/                  <- 65 SVG + 65 PNG
│       ├── diseno/                    <- 15 SVG + 15 PNG
│       └── uwe/                       <- 21 SVG + 21 PNG
└── capturas/                          <- Evidencias reales de interfaces del prototipo React
    ├── INDEX.md                       <- Índice exhaustivo de las 17 capturas
    ├── autenticacion/                 <- SCREEN-01 (Login institucional)
    ├── dashboard/                     <- SCREEN-02 (Vistas Solicitante, Gestor, CCB)
    ├── rfc/                           <- SCREEN-05, SCREEN-06, SCREEN-07 (Bandeja, Expediente, Alta, Subsanación)
    ├── analisis-impacto/              <- SCREEN-08 (Análisis dimensional)
    ├── ccb/                           <- SCREEN-09 (Sala de deliberación y votación)
    ├── autorizaciones/                <- SCREEN-10 (Autorización cambio menor - doble llave)
    ├── soporte/                       <- SOPORTE-01 (404 Not Found), SOPORTE-02 (403 Forbidden)
    └── placeholders/                  <- SCREEN-03, SCREEN-12, SCREEN-13, SCREEN-17
```

---

## 2. Convenciones de Nomenclatura y Trazabilidad

1. **Identificadores Canónicos:** Todo recurso responde a un ID formal normalizado:
   - `DG-XX`: Diagramas generales del SRS y SAD.
   - `DG-SEQ-XX` / `DG-AO-XX`: Diagramas de análisis de Casos de Uso y Objetos BCE.
   - `DG-SAD-AXX`: Modelos arquitectónicos conceptuales del SAD de Análisis.
   - `DG-DXX` / `DG-DSEQ-XX`: Modelos de arquitectura y secuencias técnicas del SAD de Diseño.
   - `DG-UWE-NAV-XX` / `DG-UWE-PRES-XX`: Modelos de navegación y presentación UWE.
   - `SCREEN-XX`: Interfaces y vistas del prototipo navegable.
2. **Separación de Responsabilidades:**
   - El archivo `.puml` es el código fuente editable (versionado en Git).
   - El archivo `.svg` es el artefacto vectorial preferente para renderizado nítido en documentación Markdown.
   - El archivo `.png` es el artefacto rasterizado de alta definición para suites ofimáticas e interoperabilidad.

---

## 3. Scripts de Automatización

Los scripts se ubican en `docs/scripts/diagramas/`:

| Script | Propósito y Función | Dependencias |
|---|---|---|
| `extract_diagrams.py` | Extrae y modulariza los 114 bloques `@startuml` desde `docs/DIAGRAMS.md` hacia archivos `.puml` individuales. | Python 3.10+ |
| `validate_diagrams.py` | Audita la integridad sintáctica de todos los archivos `.puml` (balance `@startuml`/`@enduml`, sintaxis PlantUML). | Python 3.10+ |
| `render_diagrams.py` | Compila determinísticamente los 114 diagramas a formatos `.svg` y `.png` usando `plantuml.jar` y piping seguro. | Java 17+, `plantuml.jar` |
| `capture_screens.py` | Ejecuta el prototipo React en modo preview y captura automáticamente 17 interfaces reales con Selenium Headless. | Node.js, Chrome, Selenium |
| `generate_manifests.py` | Genera y sincroniza `MANIFEST.md`, `INDEX.md` y `README.md` con los archivos reales del disco. | Python 3.10+ |

---

## 4. Instrucciones de Regeneración Paso a Paso

### A. Requisitos Previos
- **Java SE 17+** instalado y en PATH.
- **PlantUML JAR** (versión 1.2024.7 o compatible) ubicado en `~/.plantuml/plantuml.jar` o en el entorno.
- **Python 3.10+** con paquete `selenium` instalado (`pip install selenium`).
- **Google Chrome** instalado para capturas Headless.
- **Node.js 18+** y npm para el prototipo.

### B. Ejecución de la Cadena de Automatización

```bash
# 1. Extraer definiciones PUML desde DIAGRAMS.md
python docs/scripts/diagramas/extract_diagrams.py

# 2. Validar sintaxis de archivos PUML
python docs/scripts/diagramas/validate_diagrams.py

# 3. Renderizar a SVG y PNG (114 diagramas)
python docs/scripts/diagramas/render_diagrams.py

# 4. Compilar prototipo React y capturar interfaces reales
cd prototype && npm run build && cd ..
python docs/scripts/diagramas/capture_screens.py

# 5. Regenerar manifiestos e índices
python docs/scripts/diagramas/generate_manifests.py
```

*TraceFlow SCM — C-SharkTeam — ÉXODO S.A.C.*
