# SECURITY — Modelo de amenazas y controles

> Estado: borrador Fase 0. Se actualiza en cada fase. Alcance: SaaS multiempresa
> de fidelización con CRM, QR y tarjetas Wallet.

## Activos

- Saldos de puntos/sellos (valor económico para el cliente y coste para el comercio).
- Datos personales de clientes (nombre, teléfono, email, cumpleaños) — Ley 1581
  de 2012 (Colombia): consentimiento, minimización, derecho de supresión.
- Credenciales: service_role de Supabase, cert/llave Apple, service account
  Google, secretos de firma.
- Aislamiento entre organizaciones (un comercio NO debe ver a otro).

## Amenazas y controles

| # | Amenaza | Vector | Control |
|---|---|---|---|
| T1 | Fuga entre organizaciones | IDOR en API, query sin filtro tenant | `organization_id` en todas las tablas de negocio, RLS con policies por membresía, tests negativos cruzados (A intenta leer/modificar B) |
| T2 | Manipulación de saldo | Cliente o staff editan `points` directo | RLS sin UPDATE de saldo para roles de negocio; mutaciones solo vía RPC `security definer` con autorización verificada dentro de la función |
| T3 | Doble canje | Dos requests simultáneos canjean el mismo premio | Transacción SQL con `SELECT ... FOR UPDATE` o UPDATE condicional (`balance >= cost`) + constraint de saldo no negativo + `idempotency_key` UNIQUE |
| T4 | Replay de acumulación | Reintento/repetición del mismo escaneo | `idempotency_key` UNIQUE por operación; índice parcial; cliente genera clave por intento |
| T5 | Falsificación de historial | Edición de `loyalty_transactions` | Ledger append-only: REVOKE UPDATE/DELETE; correcciones = transacción `reversal`/`adjustment` referenciando la original |
| T6 | QR como autorización | Escanear QR ajeno para autollenar puntos | El QR solo identifica (token opaco aleatorio ≥128 bits, revocable); toda mutación exige sesión de empleado válida + rol + organización coincidente |
| T7 | Fuerza bruta de tokens/PIN | Enumerar seriales o PIN | Tokens con entropía suficiente; rate limiting y bloqueo progresivo en login y endpoints de tarjeta; comparación constante (timing-safe) |
| T8 | Fuga de secretos | `service_role` en bundle/logs/repo | Solo server-side; nunca `NEXT_PUBLIC_*`; `.env` gitignored; revisión de logs sin PII ni secretos; secreto de firma dedicado (no reusar service key) |
| T9 | Escalación de rol | `staff` invoca acciones de `owner` | Autorización por rol verificada en servidor/SQL en cada operación, no solo en UI; `manager` no toca owner/billing/settings globales |
| T10 | Inyección por CSV | Fórmula en nombre/teléfono exportado | Prefijar `'` a celdas que empiecen por `= + - @`; exportación autorizada por organización |
| T11 | Wallet como fuente de verdad | Manipular pase local | Wallet es espejo: el saldo real vive en Postgres; el pase se regenera desde DB; `authenticationToken` por pase para el web service de Apple |
| T12 | Tokens de tarjeta revocados siguen vivos | Reuso de QR tras rota/revocación | Rotación de `card_token`; checks de estado (`status='active'`) en cada uso; timestamps de revocación |
| T13 | Datos personales excesivos | Formulario pide de más | Minimización: solo lo necesario para el programa; consentimiento de marketing separado con timestamp |
| T14 | Dependencias vulnerables | Cadena npm comprometida | `npm audit` en CI; preferir deps sin sub-dependencias (passlet: 0 runtime deps); versiones con ≥7 días publicadas; lockfile commiteado |
| T15 | Fallo de Wallet corrompe estado | Excepción en sync revierte puntos | Sync Wallet fuera de la transacción de saldo; cola de reintentos con `last_sync_error_code`; healthCheck de proveedor |

## Políticas RLS (principios, Fase 2)

1. RLS ON en toda tabla expuesta por el Data API — sin excepciones.
2. Lectura de negocio: solo miembros activos de la organización (`organization_members.status='active'`).
3. Clientes (si tienen cuenta) solo leen SU cuenta/tarjeta; nunca escriben saldo.
4. Escrituras de saldo solo por RPC `security definer` con checks internos.
5. `service_role` confinado a servidor; REVOKE EXECUTE por defecto en funciones.
6. Tests adversariales obligatorios por tabla antes de datos reales.

## Secretos

- Gestión: `.env` local (gitignored), gestor de secretos del hosting en
  staging/prod. Nada de secretos en código, tests, fixtures ni logs.
- Rotación: procedimiento documentado para signing secret, service_role,
  certificados Apple y service account Google.
- Nunca guardar en `wallet_passes` claves privadas ni JWT de larga duración.

## Revisión legal pendiente

- Ley 1581 de 2012 y decretos reglamentarios (Colombia): política de tratamiento
  de datos, consentimiento, mecanismo de supresión/exportación. Revisión
  jurídica antes del piloto con datos reales (Fase 9). Esta app no es asesoría
  legal.
