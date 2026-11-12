#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
capture_screens.py
Script de automatización para la captura reproducible de interfaces reales
del prototipo React SPA mediante Selenium y Chrome Headless.

Proyecto: TraceFlow SCM
Organización: ÉXODO S.A.C.
Equipo: C-SharkTeam
"""

import os
import subprocess
import sys
import time
import urllib.request
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
PROTOTYPE_DIR = os.path.join(BASE_DIR, 'prototype')
CAPTURAS_DIR = os.path.join(BASE_DIR, 'docs', 'assets', 'capturas')

TARGET_DIRS = {
    'autenticacion': os.path.join(CAPTURAS_DIR, 'autenticacion'),
    'dashboard': os.path.join(CAPTURAS_DIR, 'dashboard'),
    'rfc': os.path.join(CAPTURAS_DIR, 'rfc'),
    'analisis-impacto': os.path.join(CAPTURAS_DIR, 'analisis-impacto'),
    'ccb': os.path.join(CAPTURAS_DIR, 'ccb'),
    'autorizaciones': os.path.join(CAPTURAS_DIR, 'autorizaciones'),
    'soporte': os.path.join(CAPTURAS_DIR, 'soporte'),
    'placeholders': os.path.join(CAPTURAS_DIR, 'placeholders'),
}

PORT = 4173
BASE_URL = f"http://localhost:{PORT}"

def ensure_dirs():
    for d in TARGET_DIRS.values():
        os.makedirs(d, exist_ok=True)

def set_auth_session(driver, user_id, role_id):
    """Establece la sesión activa en localStorage usando las claves versionadas de storageService."""
    driver.execute_script(f"""
        localStorage.setItem('traceflow_demo_v1_active_demo_user_id', JSON.stringify('{user_id}'));
        localStorage.setItem('traceflow_demo_v1_active_demo_role_id', JSON.stringify('{role_id}'));
        localStorage.setItem('traceflow_demo_v1_traceflow_session_expires_at', JSON.stringify(Date.now() + 86400000));
        localStorage.setItem('traceflow_demo_v1_traceflow_session_token', JSON.stringify('tok_headless_session'));
    """)

def is_server_running():
    try:
        with urllib.request.urlopen(f"{BASE_URL}/", timeout=1) as resp:
            return resp.status == 200
    except Exception:
        return False

def capture_all():
    ensure_dirs()
    print("=== INICIANDO CAPTURA DE INTERFACES REALES DEL PROTOTIPO ===")

    server_process = None
    if is_server_running():
        print(f"Servidor de previsualización ya detectado en {BASE_URL}.")
    else:
        print(f"Iniciando servidor de previsualización en puerto {PORT}...")
        server_process = subprocess.Popen(
            f"npx vite preview --port {PORT}",
            cwd=PROTOTYPE_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True
        )
        for _ in range(15):
            time.sleep(1)
            if is_server_running():
                print(f"Servidor de previsualización listo en {BASE_URL}.")
                break
        else:
            raise RuntimeError(f"No se pudo conectar al servidor de previsualización en {BASE_URL}")

    # 2. Setup Selenium Chrome Headless
    chrome_options = Options()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--window-size=1440,900')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-dev-shm-usage')

    driver = None
    manifest_captures = []

    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_window_size(1440, 900)
        print("Driver Chrome Headless inicializado correctamente (1440x900).")

        # Screens to capture: (category, filename, route, user_id, role_id, screen_id, context_desc)
        tasks = [
            # 1. Autenticación
            ('autenticacion', 'SCREEN-01_login_institucional.png', '/login', None, None, 'SCREEN-01', 'Portal de Acceso Institucional y Selección de Rol'),
            # 2. Dashboards por Rol
            ('dashboard', 'SCREEN-02_dashboard_solicitante.png', '/dashboard', 'USR-001', 'PU-01', 'SCREEN-02', 'Dashboard Adaptativo: Vista Solicitante (PU-01)'),
            ('dashboard', 'SCREEN-02_dashboard_gestor.png', '/dashboard', 'USR-001', 'PU-02', 'SCREEN-02', 'Dashboard Adaptativo: Vista Gestor de Configuración (PU-02)'),
            ('dashboard', 'SCREEN-02_dashboard_ccb.png', '/dashboard', 'USR-004', 'PU-04', 'SCREEN-02', 'Dashboard Adaptativo: Vista Comité de Control de Cambios CCB (PU-04)'),
            # 3. Flujo RFC
            ('rfc', 'SCREEN-05_bandeja_general_rfcs.png', '/rfcs', 'USR-001', 'PU-02', 'SCREEN-05', 'Bandeja General de Solicitudes de Cambio (Filtros y Búsqueda)'),
            ('rfc', 'SCREEN-06_expediente_360_rfc.png', '/rfcs/RFC-2026-0001', 'USR-001', 'PU-02', 'SCREEN-06', 'Expediente Integral 360° de RFC-2026-0001 (Ciclo de Vida)'),
            ('rfc', 'SCREEN-07_captura_rfc.png', '/rfcs/new', 'USR-001', 'PU-01', 'SCREEN-07', 'Portal de Captura y Registro de Nueva RFC (PU-01)'),
            ('rfc', 'SCREEN-07_subsanacion_rfc.png', '/rfcs/RFC-2026-0001/edit', 'USR-001', 'PU-01', 'SCREEN-07', 'Consola de Subsanación de RFC Observada (PU-01)'),
            # 4. Análisis de Impacto
            ('analisis-impacto', 'SCREEN-08_analisis_impacto_tecnico.png', '/rfcs/RFC-2026-0001/impact-analysis', 'USR-002', 'PU-03', 'SCREEN-08', 'Consola de Análisis de Impacto Técnico Dimensional (PU-03)'),
            # 5. Deliberación CCB
            ('ccb', 'SCREEN-09_sala_deliberacion_ccb.png', '/rfcs/RFC-2026-0001/ccb-deliberation', 'USR-004', 'PU-04', 'SCREEN-09', 'Sala de Deliberación y Votación Colegiada del CCB (PU-04)'),
            # 6. Autorizaciones
            ('autorizaciones', 'SCREEN-10_autorizacion_cambio_menor.png', '/rfcs/RFC-2026-0002/minor-approval', 'USR-001', 'PU-02', 'SCREEN-10', 'Consola de Autorización Delegada de Cambio Menor - Doble Llave'),
            # 7. Vistas de Soporte
            ('soporte', 'SOPORTE-01_error_404_not_found.png', '/ruta-inexistente-404', 'USR-001', 'PU-02', 'SOPORTE-01', 'Vista Institucional de Error 404 (Ruta No Encontrada)'),
            ('soporte', 'SOPORTE-02_error_403_access_denied.png', '/projects', 'USR-001', 'PU-01', 'SOPORTE-02', 'Vista de Acceso Denegado (403 Forbidden por RoleGuard)'),
            # 8. Pantallas Demostrativas Placeholder
            ('placeholders', 'SCREEN-03_directorio_proyectos_placeholder.png', '/projects', 'USR-001', 'PU-02', 'SCREEN-03', 'Directorio de Proyectos (Demostración ScreenPlaceholder)'),
            ('placeholders', 'SCREEN-12_explorador_ecs_placeholder.png', '/ecs', 'USR-003', 'PU-05', 'SCREEN-12', 'Explorador de ECS y 3 Bibliotecas (ScreenPlaceholder)'),
            ('placeholders', 'SCREEN-13_operaciones_scm_placeholder.png', '/scm/operations', 'USR-003', 'PU-05', 'SCREEN-13', 'Consola de Operaciones Check-Out/In (ScreenPlaceholder)'),
            ('placeholders', 'SCREEN-17_lineas_base_placeholder.png', '/baselines', 'USR-003', 'PU-05', 'SCREEN-17', 'Gestión de Líneas Base y Rollback (ScreenPlaceholder)'),
        ]

        # Prime the browser and localStorage
        driver.get(f"{BASE_URL}/login")
        time.sleep(1)

        for cat, filename, route, user_id, role_id, screen_id, desc in tasks:
            print(f"Capturando: {screen_id} -> {filename} ({route})...")
            if user_id and role_id:
                set_auth_session(driver, user_id, role_id)
            elif route == '/login':
                driver.execute_script("localStorage.clear();")

            driver.get(f"{BASE_URL}{route}")
            time.sleep(1.2)  # Allow React rendering and transitions to complete

            target_path = os.path.join(TARGET_DIRS[cat], filename)
            driver.save_screenshot(target_path)

            file_size = os.path.getsize(target_path)
            print(f"  [OK] Guardado en {target_path} ({file_size} bytes)")

            manifest_captures.append({
                'filename': filename,
                'screen_id': screen_id,
                'category': cat,
                'route': route,
                'role': role_id or 'Público',
                'description': desc,
                'file_size': file_size,
                'rel_path': f"assets/capturas/{cat}/{filename}"
            })

        print(f"\nCaptura completada: {len(manifest_captures)} interfaces reales registradas!")
        return manifest_captures

    finally:
        if driver:
            driver.quit()
        if server_process:
            server_process.terminate()
            print("Servidor de previsualización detenido.")

if __name__ == '__main__':
    capture_all()
