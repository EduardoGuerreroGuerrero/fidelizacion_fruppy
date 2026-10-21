# Planes y cobro — propuesta técnica (QA-P3)

Estado: **sin implementar**. La landing publica tres planes (Gratis $0, Pro
$29.000 COP/mes, Business $59.000 COP/mes) pero hoy:

- no hay cobro (ningún proveedor de pagos integrado);
- no hay `plan` en la organización;
- el único límite aplicado es el de campañas push por mes (`limits` JSON);
- los límites del plan Gratis (1 programa, 50 clientes) **no se hacen cumplir**.

No se implementó porque exige **decisiones de negocio** y una cuenta de pagos.

## Decisiones que necesito del dueño

1. **Proveedor de pagos** (Colombia, COP): Wompi (Bancolombia), Mercado Pago,
   ePayco o Stripe. Recomendación para empezar: **Wompi** (suscripciones con
   tarjeta y PSE, sin intermediario extranjero).
2. **Qué es cada plan exactamente** (la landing y `/preguntas` deben coincidir):
   topes de clientes/programas/sedes, qué incluye push, campañas y reportes.
3. **Qué pasa al vencer o bajar de plan**: ¿solo lectura? ¿se apagan push/QR?
4. **Prueba de 30 días** del plan Pro: ¿con tarjeta o sin tarjeta?
5. **Facturación electrónica** (DIAN): ¿la emite el proveedor o un tercero?

## Diseño propuesto (cuando haya decisiones)

- Columnas en `organizations`: `plan` (`free|pro|business`), `plan_status`
  (`trialing|active|past_due|canceled`), `plan_renews_at`, `provider_customer_id`
  — **no editables por el comercio** (ya protegidas por la 0021: solo
  `service_role`/RPC).
- Tabla `plan_limits(plan, max_customers, max_programs, max_locations, push, campaigns_per_month)`
  como fuente única; `limits` JSON pasa a ser override por org.
- Aplicación en la base (no solo en la UI): triggers `before insert` en
  `customers`, `loyalty_programs` y `locations` que consultan el plan; mensajes
  estables (`plan_limit_customers`…) que la UI traduce con CTA de mejora.
- Webhook `POST /api/billing/webhook` (firma verificada, idempotente) que
  actualiza `plan_status` con `service_role`; cron diario que degrada a `free`
  los vencidos.
- Pantalla **Plan y facturación** en Configuración: plan actual, uso vs. tope,
  botón de pago y de cancelar.
- Tests SQL: tope de clientes, tope de programas, degradación, y que un admin
  no puede cambiar su plan.

## Mientras tanto

- La landing no debería prometer "Pago seguro" ni topes que no se aplican
  (item QA-B11, rama de landing).
- Cuidado con activar topes sin revisar el uso actual: Fruppy puede superar
  50 clientes.
