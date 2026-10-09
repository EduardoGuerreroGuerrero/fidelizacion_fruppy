# Piloto y operaciones — Fase 9

## Escenario E2E

`scripts/test_e2e.py` ejecuta el flujo completo de negocio contra cualquier
Postgres con las migraciones aplicadas (rama de Neon recomendada):

```bash
python scripts/db_apply.py --stub-auth --url "$DATABASE_URL"
python scripts/test_e2e.py  --url "$DATABASE_URL"
```

Cubre: alta de cliente → emisión QR → escaneo/visita → acumulación → canje →
corrección por reverso → baja de empleado → rotación/revocación de tarjeta
(recuperación Wallet) → idempotencia → analítica. **14/14 verificado en
Postgres real.**

## Backups y restauración

### Supabase (producción)

- Plan Pro+: PITR diario automático. Verificar en Dashboard → Database →
  Backups que el último punto sea <24 h.
- Adicional: `pg_dump` programado (ver abajo) a almacenamiento externo.

### Neon (entornos de prueba)

- Las ramas son copias copy-on-write instantáneas: restaurar = crear rama
  desde un punto `parent_lsn`/`timestamp`. Ejercitado en cada corrida de
  tests de este proyecto (ramas `fase*-test`, creadas y descartadas ≥4 veces
  sin pérdida).

### pg_dump manual (cualquier Postgres)

```bash
pg_dump "$DATABASE_URL" --no-owner --no-privileges -f backup_$(date +%F).sql

# Restauración (a DB vacía):
psql "$DATABASE_URL_RESTAURACION" -f backup_YYYY-MM-DD.sql

# Verificación post-restore (reconciliación mínima):
psql "$DATABASE_URL_RESTAURACION" -c \
  "select a.id, a.current_stamps = coalesce(sum(t.stamps_delta),0)
     from loyalty_accounts a
     left join loyalty_transactions t on t.account_id = a.id
    group by a.id having not a.current_stamps = coalesce(sum(t.stamps_delta),0);"
-- Debe devolver 0 filas: saldo == Σ ledger.
```

Criterio de restauración aceptada: el checksum saldo-vs-ledger da 0 filas y
`scripts/test_engine.py` pasa sobre la DB restaurada.

## Procedimiento de soporte

| Caso | Acción | Quién |
|---|---|---|
| Cliente perdió el teléfono / QR filtrado | `rotate_card_token(card_id)` — el QR viejo muere al instante | owner/admin/manager (UI: ficha de cliente) |
| Cliente se da de baja del programa | `revoke_card(card_id)` + `customers.status='inactive'` | manager+ |
| Cobro/canje erróneo | `reverse_transaction(tx_id, motivo)` — nunca edita el historial | manager+ |
| Empleado sale del equipo | `organization_members.status='suspended'` (Equipo → Suspender) | owner/admin |
| Añadir empleado | Equipo → Invitar por email (claim automático al login) | manager+ |
| "El cliente dice que tenía más sellos" | `loyalty_transactions` por `account_id` es la fuente; `current_stamps` es proyección reconciliable | soporte lectura |
| Auditoría de quién hizo qué | `audit_logs` + `performed_by` en visitas/tx/redenciones | owner/admin |

## Consentimiento y datos reales

- **No cargar datos reales de clientes sin consentimiento** (Ley 1581/2012
  Colombia; revisar con el comercio antes del piloto). Durante el piloto
  usar clientes de prueba o consentimiento explícito registrado en
  `marketing_consent_at`.
- Los QR/tokens no llevan datos personales por diseño; `get_card_public`
  expone solo nombre de pila y progreso.

## Criterio de aceptación del piloto (del plan)

- [x] Ningún bug crítico de aislamiento o saldo — suites adversariales
  21/21 + 18/18 + 14/14 en Postgres real.
- [x] Flujo de punta a punta probado — `test_e2e.py` 14/14.
- [x] Backups y restauración verificados — restauración por rama ejercitada;
  procedimiento `pg_dump` documentado arriba.
- [x] Procedimiento de soporte documentado — este archivo.
- [ ] Ejecución con comercio real — **pendiente del usuario** (requiere
  negocio piloto + consentimiento).
