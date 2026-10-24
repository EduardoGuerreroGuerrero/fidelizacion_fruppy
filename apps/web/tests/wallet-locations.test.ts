import { test } from "node:test";
import assert from "node:assert/strict";
import { toWalletLocations, validCoords, MAX_WALLET_LOCATIONS } from "../lib/wallet/locations";
import { renderCampaignText } from "../lib/push/template";

test("coordenadas válidas e inválidas", () => {
  assert.ok(validCoords(4.65, -74.05));
  assert.ok(validCoords("4.65", "-74.05"));
  assert.ok(!validCoords(null, -74));
  assert.ok(!validCoords(91, 0));
  assert.ok(!validCoords(0, 181));
  assert.ok(!validCoords("abc", 1));
});

test("solo sedes activas con coordenadas, sin duplicados", () => {
  const { locations } = toWalletLocations(
    [
      { name: "A", lat: 4.65, lng: -74.05, status: "active" },
      { name: "A copia", lat: 4.65, lng: -74.05, status: "active" },
      { name: "Inactiva", lat: 5, lng: -75, status: "inactive" },
      { name: "Sin coords", lat: null, lng: null, status: "active" },
    ],
    "Café",
  );
  assert.equal(locations.length, 1);
  assert.equal(locations[0].relevantText, "Café · A");
});

test("tope de 10 ubicaciones y cuenta las que sobran", () => {
  const rows = Array.from({ length: 13 }, (_, i) => ({ name: `S${i}`, lat: 4 + i * 0.01, lng: -74, status: "active" }));
  const r = toWalletLocations(rows, "X");
  assert.equal(r.locations.length, MAX_WALLET_LOCATIONS);
  assert.equal(r.overLimit, 3);
});

test("variables de campaña", () => {
  assert.equal(renderCampaignText("Hola {nombre}, pasa por {negocio}", { nombre: "Ana", negocio: "Café" }), "Hola Ana, pasa por Café");
  assert.equal(renderCampaignText("Hola {nombre}, pasa por {negocio}", {}), "Hola, pasa por tu comercio");
  assert.equal(renderCampaignText("Oferta {desconocida} hoy", {}), "Oferta hoy");
  assert.equal(renderCampaignText("{ NOMBRE }!", { nombre: "Eva" }), "Eva!");
});
