# Analítica — definiciones (Fase 8)

Fuente única: `org_analytics(organization_id, days)` (migración 0006),
`security definer` + verificación de membresía activa. Cada métrica es
reconciliable con la tabla de origen indicada.

## Convenciones

- **Período**: `days` últimos días (default 30), cortado en medianoche de la
  zona horaria de la organización (`organizations.timezone`, UTC por
  defecto). El día actual va incluido.
- **Buckets diarios**: `visits_daily` agrupa por fecha local de la org, no UTC.
- `generated_at` está en UTC (`now()`).

## Métricas

| Campo | Definición | Origen |
|---|---|---|
| `customers_total` | Clientes `status='active'` | `customers` |
| `customers_new` | Clientes creados dentro del período | `customers.created_at` |
| `customers_active` | Clientes distintos con ≥1 visita **o** ≥1 movimiento de ledger en el período | `customer_visits` ∪ `loyalty_transactions→loyalty_accounts` |
| `visits_total` | Visitas registradas en el período | `customer_visits` |
| `visits_daily` | Array `[{day, count}]` por día local | `customer_visits.created_at at time zone tz` |
| `points_earned` | Σ `points_delta` de `earn` en el período | `loyalty_transactions` |
| `points_redeemed` | Σ −`points_delta` de `redeem` (valores negativos) | `loyalty_transactions` |
| `stamps_earned` / `stamps_redeemed` | Ídem con `stamps_delta` | `loyalty_transactions` |
| `rewards_issued` | Recompensas `status='active'` en el catálogo | `rewards` |
| `redemptions_completed` | Canjes `status='completed'` en el período | `redemptions` |
| `redemptions_reversed` | Canjes `status='reversed'` en el período | `redemptions` |

## Tasa de retorno

```
return_rate = clientes con ≥2 visitas en el período
              ─────────────────────────────────────
              clientes con ≥1 visita en el período
```

`return_rate_numerator` y `return_rate_denominator` se exponen para
auditoría. Si el denominador es 0, `return_rate` es `null` (no 0 — sin
visitantes no hay tasa definida).

## Excluido a propósito

Ventas, ticket promedio y LTV **no se muestran**: solo existen datos fiables
cuando el POS reporta `purchase_amount_minor`, y presentarlos mezclados con
visitas sin monto sería engañoso (criterio de aceptación del plan).
