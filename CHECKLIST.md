# CHECKLIST — SaaS Fidelización Fruppy

> Seguimiento de ejecución del plan `plan_saas_fidelizacion_crm_wallet.md`.
> **Actualización automática:** no editar el bloque de progreso a mano.
> Usar: `python scripts/checklist.py status|done <ID>|undone <ID>|refresh`

<!-- PROGRESS:START -->
**Última actualización:** 2026-10-09 11:07  
**Global:** 6/89 hechas (7%) `█░░░░░░░░░░░░░░░░░░░` · en curso: 0 · bloqueadas: 0

| Sección | Hecho | Total | % | Progreso |
|---|---|---|---|---|
| SETUP — Infraestructura del workspace | 6 | 7 | 86% | `█████████░` |
| Fase 0 — Auditoría y decisión de base | 0 | 10 | 0% | `░░░░░░░░░░` |
| Fase 1 — Base del proyecto y entorno | 0 | 8 | 0% | `░░░░░░░░░░` |
| Fase 2 — Identidad, organizaciones y aislamiento | 0 | 6 | 0% | `░░░░░░░░░░` |
| Fase 3 — CRM básico | 0 | 6 | 0% | `░░░░░░░░░░` |
| Fase 4 — Motor de fidelización | 0 | 7 | 0% | `░░░░░░░░░░` |
| Fase 5 — QR y flujo de empleado | 0 | 6 | 0% | `░░░░░░░░░░` |
| Fase 6 — Tarjeta web y Wallet | 0 | 6 | 0% | `░░░░░░░░░░` |
| Fase 7 — Dashboard y configuración del comercio | 0 | 9 | 0% | `░░░░░░░░░░` |
| Fase 8 — Analítica básica | 0 | 3 | 0% | `░░░░░░░░░░` |
| Fase 9 — Piloto con comercios | 0 | 3 | 0% | `░░░░░░░░░░` |
| Fase 10 — SaaS comercial (no empezar hasta validar MVP) | 0 | 4 | 0% | `░░░░░░░░░░` |
| Definición de "MVP listo" (del plan) | 0 | 14 | 0% | `░░░░░░░░░░` |
<!-- PROGRESS:END -->

## Leyenda de estado

- `[ ]` pendiente · `[~]` en curso · `[x]` hecho · `[!]` bloqueado
- Cada tarea tiene un ID estable (`SETUP-*`, `F0-*`, `F1-*`, …) para `checklist.py`.

---

## SETUP — Infraestructura del workspace

- [x] <!-- SETUP-1 --> Entorno conda `F_FRUPPY` (Python 3.11) creado
- [x] <!-- SETUP-2 --> Dependencias Python instaladas (`pip install -r requirements.txt`)
- [x] <!-- SETUP-3 --> `.env.example` y `.env` local creados (sin secretos reales)
- [x] <!-- SETUP-4 --> `.gitignore` con protección de secretos y artefactos
- [x] <!-- SETUP-5 --> `CHECKLIST.md` + `scripts/checklist.py` de actualización automática
- [ ] <!-- SETUP-6 --> Repositorio git inicializado
- [x] <!-- SETUP-7 --> `environment.yml` y `requirements.txt` del entorno

## Fase 0 — Auditoría y decisión de base

- [ ] <!-- F0-T1 --> Inspeccionar `digital-loyalty-cards`: README, LICENSE, package.json, migraciones, RLS, SQL, APIs, middleware, auth, QR, Wallet, tests
- [ ] <!-- F0-T2 --> Inspeccionar `passlet`: licencia, versión publicada, compatibilidad Node, APIs de actualización, tests
- [ ] <!-- F0-T3 --> Inspeccionar `starfiniti-loyalty` solo como referencia arquitectónica (AGPL/GPL — no copiar código)
- [ ] <!-- F0-T4 --> Inspeccionar `passkit-node-quickstart` como referencia de integración PassKit
- [ ] <!-- F0-T5 --> Revisar issues y actividad reciente de los repos
- [ ] <!-- F0-T6 --> Ejecutar instalación/verificaciones seguras en local y registrar resultados
- [ ] <!-- F0-T7 --> Threat model corto: multi-tenant, saldo, canje, QR, secretos, Wallet
- [ ] <!-- F0-T8 --> Matriz de decisión A/B/C (extender repo / proyecto limpio / PassKit)
- [ ] <!-- F0-T9 --> Crear `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`
- [ ] <!-- F0-T10 --> Presentar informe y **obtener aprobación del usuario** antes de Fase 1

## Fase 1 — Base del proyecto y entorno

- [ ] <!-- F1-T1 --> Crear repo/fork según licencia y decisión de Fase 0
- [ ] <!-- F1-T2 --> Ramas y protección de `main`
- [ ] <!-- F1-T3 --> `.env.example` completo para la app Next.js
- [ ] <!-- F1-T4 --> TypeScript estricto, lint, formato y scripts de test
- [ ] <!-- F1-T5 --> Entornos local/preview/producción sin compartir credenciales
- [ ] <!-- F1-T6 --> Supabase local + migraciones reproducibles
- [ ] <!-- F1-T7 --> CI: lint, typecheck, tests, build
- [ ] <!-- F1-T8 --> Página de salud no sensible y manejo de errores

## Fase 2 — Identidad, organizaciones y aislamiento

- [ ] <!-- F2-T1 --> Registro/login/logout con Supabase Auth
- [ ] <!-- F2-T2 --> Flujo de creación de organización + membresía owner
- [ ] <!-- F2-T3 --> Sedes y roles básicos
- [ ] <!-- F2-T4 --> RLS en todas las tablas iniciales
- [ ] <!-- F2-T5 --> Middleware/guards de rutas privadas
- [ ] <!-- F2-T6 --> Pruebas de acceso cruzado entre organizaciones (tests negativos)

## Fase 3 — CRM básico

- [ ] <!-- F3-T1 --> Listado, búsqueda, filtros y ficha de cliente
- [ ] <!-- F3-T2 --> Alta/edición con validación de servidor
- [ ] <!-- F3-T3 --> Historial cronológico de visitas y transacciones
- [ ] <!-- F3-T4 --> Detección de duplicados por teléfono/email (sin fusión automática)
- [ ] <!-- F3-T5 --> Exportación CSV con controles anti-fórmula y autorización
- [ ] <!-- F3-T6 --> Consentimiento de marketing registrado por separado

## Fase 4 — Motor de fidelización

- [ ] <!-- F4-T1 --> Programa de sellos funcional primero; modelo extensible a puntos
- [ ] <!-- F4-T2 --> Función SQL transaccional para añadir sellos/puntos
- [ ] <!-- F4-T3 --> Canje atómico y registro de redención
- [ ] <!-- F4-T4 --> Ledger inmutable + reversos compensatorios
- [ ] <!-- F4-T5 --> Idempotencia en operaciones de escritura
- [ ] <!-- F4-T6 --> Sin saldos negativos ni doble canje concurrente (pruebas)
- [ ] <!-- F4-T7 --> Proyección de saldo actualizada en la misma transacción

## Fase 5 — QR y flujo de empleado

- [ ] <!-- F5-T1 --> Token público aleatorio y revocable por tarjeta
- [ ] <!-- F5-T2 --> QR sin datos personales ni privilegios
- [ ] <!-- F5-T3 --> Página de cliente con estado y tarjeta
- [ ] <!-- F5-T4 --> Flujo empleado: escanear/buscar, validar sesión/rol, registrar visita
- [ ] <!-- F5-T5 --> Confirmación visual de éxito/error
- [ ] <!-- F5-T6 --> Rate limiting y protección anti-abuso

## Fase 6 — Tarjeta web y Wallet

- [ ] <!-- F6-T1 --> Tarjeta web responsive como alternativa sin Wallet
- [ ] <!-- F6-T2 --> Interfaz `WalletProvider`: createPass/updatePass/revokePass/healthCheck
- [ ] <!-- F6-T3 --> Primer proveedor implementado, luego el segundo
- [ ] <!-- F6-T4 --> Credenciales Apple/Google fuera del repositorio
- [ ] <!-- F6-T5 --> Reintentos idempotentes; fallos de Wallet no revierten puntos
- [ ] <!-- F6-T6 --> `wallet_passes` solo con identificadores y estado técnico

## Fase 7 — Dashboard y configuración del comercio

- [ ] <!-- F7-T1 --> Inicio: clientes, visitas, recompensas, actividad reciente
- [ ] <!-- F7-T2 --> Clientes: tabla, búsqueda y perfil
- [ ] <!-- F7-T3 --> Programas: crear/editar programa y reglas
- [ ] <!-- F7-T4 --> Recompensas: catálogo y canjes
- [ ] <!-- F7-T5 --> Personal: invitaciones y roles
- [ ] <!-- F7-T6 --> Sedes: gestión básica
- [ ] <!-- F7-T7 --> Tarjeta: branding y vista previa
- [ ] <!-- F7-T8 --> Configuración: nombre, logo, colores, moneda, zona horaria
- [ ] <!-- F7-T9 --> Auditoría: movimientos y acciones sensibles

## Fase 8 — Analítica básica

- [ ] <!-- F8-T1 --> Métricas: clientes, activos, visitas, canjes, puntos/sellos
- [ ] <!-- F8-T2 --> Tasa de retorno con fórmula documentada
- [ ] <!-- F8-T3 --> Definiciones documentadas; zona horaria consistente; reconciliables

## Fase 9 — Piloto con comercios

- [ ] <!-- F9-T1 --> Piloto con un negocio y datos de prueba
- [ ] <!-- F9-T2 --> Escenarios E2E: alta, QR, visita, acumulación, canje, corrección, baja empleado, Wallet
- [ ] <!-- F9-T3 --> Backups y restauración verificados; procedimiento de soporte documentado

## Fase 10 — SaaS comercial (no empezar hasta validar MVP)

- [ ] <!-- F10-T1 --> Planes, límites, suscripciones y portal de facturación
- [ ] <!-- F10-T2 --> Emails transaccionales, campañas y automatizaciones
- [ ] <!-- F10-T3 --> Importación CSV, privacidad/términos/acuerdo de tratamiento de datos
- [ ] <!-- F10-T4 --> Backups, recuperación, monitoreo y alertas en producción

---

## Definición de "MVP listo" (del plan)

- [ ] <!-- MVP-1 --> Comercio crea organización y configura su programa
- [ ] <!-- MVP-2 --> Personal con roles limitados registrado
- [ ] <!-- MVP-3 --> Alta de clientes
- [ ] <!-- MVP-4 --> Empleado autenticado escanea QR y registra visita
- [ ] <!-- MVP-5 --> Puntos/sellos contabilizados atómicamente
- [ ] <!-- MVP-6 --> Canje sin doble canje
- [ ] <!-- MVP-7 --> Historial auditable
- [ ] <!-- MVP-8 --> Cliente consulta su tarjeta web
- [ ] <!-- MVP-9 --> Wallet funciona en pruebas o dependencia documentada
- [ ] <!-- MVP-10 --> Aislamiento entre organizaciones probado con tests negativos
- [ ] <!-- MVP-11 --> Sin secretos en repo ni logs
- [ ] <!-- MVP-12 --> lint, typecheck, tests y build pasan
- [ ] <!-- MVP-13 --> Backups y restauración probados
- [ ] <!-- MVP-14 --> Privacidad y consentimiento listos para revisión legal
