# CHECKLIST — SaaS Fidelización Fruppy

> Seguimiento de ejecución del plan `plan_saas_fidelizacion_crm_wallet.md`.
> **Actualización automática:** no editar el bloque de progreso a mano.
> Usar: `python scripts/checklist.py status|done <ID>|undone <ID>|refresh`

<!-- PROGRESS:START -->
**Última actualización:** 2026-10-09 22:01  
**Global:** 85/89 hechas (96%) `███████████████████░` · en curso: 0 · bloqueadas: 0

| Sección | Hecho | Total | % | Progreso |
|---|---|---|---|---|
| SETUP — Infraestructura del workspace | 7 | 7 | 100% | `██████████` |
| Fase 0 — Auditoría y decisión de base | 10 | 10 | 100% | `██████████` |
| Fase 1 — Base del proyecto y entorno | 8 | 8 | 100% | `██████████` |
| Fase 2 — Identidad, organizaciones y aislamiento | 6 | 6 | 100% | `██████████` |
| Fase 3 — CRM básico | 6 | 6 | 100% | `██████████` |
| Fase 4 — Motor de fidelización | 7 | 7 | 100% | `██████████` |
| Fase 5 — QR y flujo de empleado | 6 | 6 | 100% | `██████████` |
| Fase 6 — Tarjeta web y Wallet | 6 | 6 | 100% | `██████████` |
| Fase 7 — Dashboard y configuración del comercio | 9 | 9 | 100% | `██████████` |
| Fase 8 — Analítica básica | 3 | 3 | 100% | `██████████` |
| Fase 9 — Piloto con comercios | 3 | 3 | 100% | `██████████` |
| Fase 10 — SaaS comercial (no empezar hasta validar MVP) | 0 | 4 | 0% | `░░░░░░░░░░` |
| Definición de "MVP listo" (del plan) | 14 | 14 | 100% | `██████████` |
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
- [x] <!-- SETUP-6 --> Repositorio git inicializado
- [x] <!-- SETUP-7 --> `environment.yml` y `requirements.txt` del entorno

## Fase 0 — Auditoría y decisión de base

- [x] <!-- F0-T1 --> Inspeccionar `digital-loyalty-cards`: README, LICENSE, package.json, migraciones, RLS, SQL, APIs, middleware, auth, QR, Wallet, tests
- [x] <!-- F0-T2 --> Inspeccionar `passlet`: licencia, versión publicada, compatibilidad Node, APIs de actualización, tests
- [x] <!-- F0-T3 --> Inspeccionar `starfiniti-loyalty` solo como referencia arquitectónica (AGPL/GPL — no copiar código)
- [x] <!-- F0-T4 --> Inspeccionar `passkit-node-quickstart` como referencia de integración PassKit
- [x] <!-- F0-T5 --> Revisar issues y actividad reciente de los repos
- [x] <!-- F0-T6 --> Ejecutar instalación/verificaciones seguras en local y registrar resultados
- [x] <!-- F0-T7 --> Threat model corto: multi-tenant, saldo, canje, QR, secretos, Wallet
- [x] <!-- F0-T8 --> Matriz de decisión A/B/C (extender repo / proyecto limpio / PassKit)
- [x] <!-- F0-T9 --> Crear `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`
- [x] <!-- F0-T10 --> Presentar informe y **obtener aprobación del usuario** antes de Fase 1

## Fase 1 — Base del proyecto y entorno

- [x] <!-- F1-T1 --> Crear repo/fork según licencia y decisión de Fase 0
- [x] <!-- F1-T2 --> Ramas y protección de `main`
- [x] <!-- F1-T3 --> `.env.example` completo para la app Next.js
- [x] <!-- F1-T4 --> TypeScript estricto, lint, formato y scripts de test
- [x] <!-- F1-T5 --> Entornos local/preview/producción sin compartir credenciales
- [x] <!-- F1-T6 --> Supabase local + migraciones reproducibles
- [x] <!-- F1-T7 --> CI: lint, typecheck, tests, build
- [x] <!-- F1-T8 --> Página de salud no sensible y manejo de errores

## Fase 2 — Identidad, organizaciones y aislamiento

- [x] <!-- F2-T1 --> Registro/login/logout con Supabase Auth
- [x] <!-- F2-T2 --> Flujo de creación de organización + membresía owner
- [x] <!-- F2-T3 --> Sedes y roles básicos
- [x] <!-- F2-T4 --> RLS en todas las tablas iniciales
- [x] <!-- F2-T5 --> Middleware/guards de rutas privadas
- [x] <!-- F2-T6 --> Pruebas de acceso cruzado entre organizaciones (tests negativos)

## Fase 3 — CRM básico

- [x] <!-- F3-T1 --> Listado, búsqueda, filtros y ficha de cliente
- [x] <!-- F3-T2 --> Alta/edición con validación de servidor
- [x] <!-- F3-T3 --> Historial cronológico de visitas y transacciones
- [x] <!-- F3-T4 --> Detección de duplicados por teléfono/email (sin fusión automática)
- [x] <!-- F3-T5 --> Exportación CSV con controles anti-fórmula y autorización
- [x] <!-- F3-T6 --> Consentimiento de marketing registrado por separado

## Fase 4 — Motor de fidelización

- [x] <!-- F4-T1 --> Programa de sellos funcional primero; modelo extensible a puntos
- [x] <!-- F4-T2 --> Función SQL transaccional para añadir sellos/puntos
- [x] <!-- F4-T3 --> Canje atómico y registro de redención
- [x] <!-- F4-T4 --> Ledger inmutable + reversos compensatorios
- [x] <!-- F4-T5 --> Idempotencia en operaciones de escritura
- [x] <!-- F4-T6 --> Sin saldos negativos ni doble canje concurrente (pruebas)
- [x] <!-- F4-T7 --> Proyección de saldo actualizada en la misma transacción

## Fase 5 — QR y flujo de empleado

- [x] <!-- F5-T1 --> Token público aleatorio y revocable por tarjeta
- [x] <!-- F5-T2 --> QR sin datos personales ni privilegios
- [x] <!-- F5-T3 --> Página de cliente con estado y tarjeta
- [x] <!-- F5-T4 --> Flujo empleado: escanear/buscar, validar sesión/rol, registrar visita
- [x] <!-- F5-T5 --> Confirmación visual de éxito/error
- [x] <!-- F5-T6 --> Rate limiting y protección anti-abuso

## Fase 6 — Tarjeta web y Wallet

- [x] <!-- F6-T1 --> Tarjeta web responsive como alternativa sin Wallet
- [x] <!-- F6-T2 --> Interfaz `WalletProvider`: createPass/updatePass/revokePass/healthCheck
- [x] <!-- F6-T3 --> Primer proveedor implementado, luego el segundo
- [x] <!-- F6-T4 --> Credenciales Apple/Google fuera del repositorio
- [x] <!-- F6-T5 --> Reintentos idempotentes; fallos de Wallet no revierten puntos
- [x] <!-- F6-T6 --> `wallet_passes` solo con identificadores y estado técnico

## Fase 7 — Dashboard y configuración del comercio

- [x] <!-- F7-T1 --> Inicio: clientes, visitas, recompensas, actividad reciente
- [x] <!-- F7-T2 --> Clientes: tabla, búsqueda y perfil
- [x] <!-- F7-T3 --> Programas: crear/editar programa y reglas
- [x] <!-- F7-T4 --> Recompensas: catálogo y canjes
- [x] <!-- F7-T5 --> Personal: invitaciones y roles
- [x] <!-- F7-T6 --> Sedes: gestión básica
- [x] <!-- F7-T7 --> Tarjeta: branding y vista previa
- [x] <!-- F7-T8 --> Configuración: nombre, logo, colores, moneda, zona horaria
- [x] <!-- F7-T9 --> Auditoría: movimientos y acciones sensibles

## Fase 8 — Analítica básica

- [x] <!-- F8-T1 --> Métricas: clientes, activos, visitas, canjes, puntos/sellos
- [x] <!-- F8-T2 --> Tasa de retorno con fórmula documentada
- [x] <!-- F8-T3 --> Definiciones documentadas; zona horaria consistente; reconciliables

## Fase 9 — Piloto con comercios

- [x] <!-- F9-T1 --> Piloto con un negocio y datos de prueba
- [x] <!-- F9-T2 --> Escenarios E2E: alta, QR, visita, acumulación, canje, corrección, baja empleado, Wallet
- [x] <!-- F9-T3 --> Backups y restauración verificados; procedimiento de soporte documentado

## Fase 10 — SaaS comercial (no empezar hasta validar MVP)

- [ ] <!-- F10-T1 --> Planes, límites, suscripciones y portal de facturación
- [ ] <!-- F10-T2 --> Emails transaccionales, campañas y automatizaciones
- [ ] <!-- F10-T3 --> Importación CSV, privacidad/términos/acuerdo de tratamiento de datos
- [ ] <!-- F10-T4 --> Backups, recuperación, monitoreo y alertas en producción

---

## Definición de "MVP listo" (del plan)

- [x] <!-- MVP-1 --> Comercio crea organización y configura su programa
- [x] <!-- MVP-2 --> Personal con roles limitados registrado
- [x] <!-- MVP-3 --> Alta de clientes
- [x] <!-- MVP-4 --> Empleado autenticado escanea QR y registra visita
- [x] <!-- MVP-5 --> Puntos/sellos contabilizados atómicamente
- [x] <!-- MVP-6 --> Canje sin doble canje
- [x] <!-- MVP-7 --> Historial auditable
- [x] <!-- MVP-8 --> Cliente consulta su tarjeta web
- [x] <!-- MVP-9 --> Wallet funciona en pruebas o dependencia documentada
- [x] <!-- MVP-10 --> Aislamiento entre organizaciones probado con tests negativos
- [x] <!-- MVP-11 --> Sin secretos en repo ni logs
- [x] <!-- MVP-12 --> lint, typecheck, tests y build pasan
- [x] <!-- MVP-13 --> Backups y restauración probados
- [x] <!-- MVP-14 --> Privacidad y consentimiento listos para revisión legal
