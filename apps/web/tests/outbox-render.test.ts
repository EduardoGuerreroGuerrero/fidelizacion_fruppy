import { test } from "node:test";
import assert from "node:assert/strict";
import { renderOutboxEmail } from "../lib/email/outbox";

process.env.NEXT_PUBLIC_BASE_URL = "https://app.example.test";

test("invitación de equipo: rol en español, enlaces con el correo y sin HTML inyectado", () => {
  const r = renderOutboxEmail("team_invite", {
    org_name: '<img src=x onerror=alert(1)>Heladería',
    role: "manager",
    invited_email: "nuevo+x@ejemplo.com",
  });
  assert.ok(r);
  assert.match(r.subject, /Te invitaron a/);
  assert.match(r.html, /encargado/);
  assert.match(r.html, /signup\?email=nuevo%2Bx%40ejemplo\.com/);
  assert.match(r.html, /login\?email=nuevo%2Bx%40ejemplo\.com/);
  assert.ok(!r.html.includes("<img src=x"), "el nombre del comercio debe ir escapado");
  assert.match(r.html, /&lt;img/);
});

test("invitación sin datos mínimos no se renderiza (queda como error, no se envía vacía)", () => {
  assert.equal(renderOutboxEmail("team_invite", { org_name: "X" }), null);
});

test("respuesta a derechos: tipo, resultado y respuesta escapada", () => {
  const r = renderOutboxEmail("rights_response", {
    org_name: "Fruppy",
    first_name: "ana",
    request_type: "erasure",
    status: "resolved",
    response: "Listo <script>alert(1)</script>\nSaludos",
    privacy_email: "privacidad@fruppy.test",
  });
  assert.ok(r);
  assert.match(r.subject, /Respuesta a tu solicitud/);
  assert.match(r.html, /eliminación de tus datos/);
  assert.match(r.html, /fue atendida/);
  assert.ok(!r.html.includes("<script>"), "la respuesta debe ir escapada");
  assert.match(r.html, /mailto:privacidad@fruppy\.test/);
});

test("respuesta rechazada lo dice", () => {
  const r = renderOutboxEmail("rights_response", {
    org_name: "Fruppy",
    request_type: "access",
    status: "rejected",
    response: "No encontramos datos asociados.",
  });
  assert.ok(r);
  assert.match(r.html, /no pudo ser atendida/);
});

test("tarjeta de bienvenida conserva su formato (regresión)", () => {
  const r = renderOutboxEmail("welcome_card", {
    org_name: "Fruppy",
    program_name: "Club",
    card_token: "a".repeat(32),
    first_name: "luis",
  });
  assert.ok(r);
  assert.match(r.subject, /Bienvenido a Fruppy/);
  assert.match(r.html, /https:\/\/app\.example\.test\/t\/a{32}/);
});
