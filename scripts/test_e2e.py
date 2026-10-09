"""Prueba E2E del piloto (Fase 9) — escenario completo de negocio.

Flujo: alta cliente → emisión de tarjeta QR → escaneos de empleado →
acumulación → canje → corrección (reverso) → baja de empleado →
rotación/revocación de tarjeta (recuperación Wallet) → idempotencia.

    python scripts/test_e2e.py --url "postgresql://..."
"""

from __future__ import annotations

import argparse
import sys
import uuid

import psycopg

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

RESULTS: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'} {name}" + (f"  ({detail})" if detail else ""))


class Ctx:
    def __init__(self, conn: psycopg.Connection, user_id: uuid.UUID):
        self.conn = conn
        self.user_id = user_id

    def __enter__(self):
        self.conn.execute("begin")
        self.conn.execute("set local role authenticated")
        self.conn.execute(
            "select set_config('app.user_id', %s, true)", (str(self.user_id),)
        )
        return self.conn

    def __exit__(self, exc_type, *_):
        self.conn.execute("rollback" if exc_type else "commit")
        self.conn.execute("reset role")
        return False


def denied(fn, needle: str | None = None) -> bool:
    try:
        fn()
        return False
    except psycopg.Error as e:
        return needle is None or needle in str(e)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    args = ap.parse_args()

    run = uuid.uuid4().hex[:8]
    conn = psycopg.connect(args.url, autocommit=True)
    conn.execute("reset role")

    # ---- seed como owner (superusuario; sin RLS) ----
    org, owner, staff = (uuid.uuid4() for _ in range(3))
    prog, loc, reward, cust = (uuid.uuid4() for _ in range(4))
    for u in (owner, staff):
        conn.execute(
            "insert into auth.users (id) values (%s) on conflict do nothing", (u,)
        )
    conn.execute(
        "insert into public.organizations (id, name, slug) values (%s, %s, %s)",
        (org, f"Piloto {run}", f"piloto-{run}"),
    )
    conn.execute(
        "insert into public.organization_members (organization_id, user_id, role, status)"
        " values (%s, %s, 'owner', 'active'), (%s, %s, 'staff', 'active')",
        (org, owner, org, staff),
    )
    conn.execute(
        "insert into public.locations (id, organization_id, name)"
        " values (%s, %s, 'Sede Piloto')",
        (loc, org),
    )
    conn.execute(
        "insert into public.loyalty_programs"
        " (id, organization_id, name, program_type, stamp_goal)"
        " values (%s, %s, 'Café', 'stamps', 8)",
        (prog, org),
    )
    conn.execute(
        "insert into public.rewards"
        " (id, organization_id, program_id, name, cost_stamps)"
        " values (%s, %s, %s, 'Café gratis', 8)",
        (reward, org, prog),
    )

    # 1) alta de cliente (owner vía policy normal)
    with Ctx(conn, owner) as c:
        c.execute(
            "insert into public.customers (id, organization_id, first_name, phone)"
            " values (%s, %s, 'Cliente Piloto', %s)",
            (cust, org, f"+57000{run}"),
        )
    check("alta de cliente", True)

    # 2) emisión de tarjeta
    with Ctx(conn, owner) as c:
        card = c.execute("select public.issue_card(%s, %s)", (cust, prog)).fetchone()[0]
        token = c.execute(
            "select token from public.customer_cards where id = %s", (card,)
        ).fetchone()[0]
    check("issue_card crea tarjeta con token", bool(card and token), token[:8] + "…")

    # 3) vista pública de la tarjeta
    with Ctx(conn, staff) as c:
        pub = c.execute("select public.get_card_public(%s)", (token,)).fetchone()[0]
    check("get_card_public expone tarjeta", pub is not None)

    # 4) 8 escaneos del empleado → 8 sellos
    for i in range(8):
        with Ctx(conn, staff) as c:
            c.execute(
                "select public.scan_card(%s, 1, %s, %s)",
                (token, loc, f"{run}-scan-{i}"),
            )
    bal = conn.execute(
        "select current_stamps from public.loyalty_accounts"
        " where organization_id = %s and customer_id = %s",
        (org, cust),
    ).fetchone()[0]
    check("8 escaneos → 8 sellos acumulados", bal == 8, f"saldo={bal}")

    # 5) canje
    with Ctx(conn, staff) as c:
        red = c.execute(
            "select public.redeem_reward(%s, %s, %s, %s)",
            (reward, cust, loc, f"{run}-redeem"),
        ).fetchone()[0]
    bal = conn.execute(
        "select current_stamps from public.loyalty_accounts"
        " where organization_id = %s and customer_id = %s",
        (org, cust),
    ).fetchone()[0]
    check("canje de recompensa (8→0)", bal == 0, f"red={str(red)[:8]} saldo={bal}")

    # 6) corrección: revertir el canje (tx 'redeem' -8 → +8 compensatorio)
    tx = conn.execute(
        "select id from public.loyalty_transactions"
        " where organization_id = %s and transaction_type = 'redeem'"
        " order by created_at desc limit 1",
        (org,),
    ).fetchone()[0]
    with Ctx(conn, owner) as c:
        c.execute(
            "select public.reverse_transaction(%s, %s)", (tx, "corrección piloto")
        )
    bal = conn.execute(
        "select current_stamps from public.loyalty_accounts"
        " where organization_id = %s and customer_id = %s",
        (org, cust),
    ).fetchone()[0]
    check("corrección: reverso del canje devuelve 8 sellos", bal == 8, f"saldo={bal}")

    # 7) baja de empleado → pierde acceso operativo
    with Ctx(conn, owner) as c:
        c.execute(
            "update public.organization_members set status = 'suspended'"
            " where organization_id = %s and user_id = %s",
            (org, staff),
        )
    with Ctx(conn, staff) as c:
        check(
            "empleado dado de baja no puede escanear",
            denied(
                lambda: c.execute(
                    "select public.scan_card(%s, 1, %s, %s)",
                    (token, loc, f"{run}-scan-x"),
                ),
                "forbidden",
            ),
        )
    with Ctx(conn, staff) as c:
        n = c.execute(
            "select count(*) from public.customers where organization_id = %s", (org,)
        ).fetchone()[0]
    check("empleado suspendido no lee clientes", n == 0, f"ve {n}")

    # 8) recuperación Wallet: rotar token → el viejo muere
    with Ctx(conn, owner) as c:
        c.execute("select public.rotate_card_token(%s)", (card,))
        new_token = c.execute(
            "select token from public.customer_cards where id = %s", (card,)
        ).fetchone()[0]
    check("rotación genera token nuevo", new_token != token)
    with Ctx(conn, owner) as c:
        old = c.execute("select public.get_card_public(%s)", (token,)).fetchone()[0]
        check("token anterior ya no resuelve (null)", old is None)
        pub2 = c.execute("select public.get_card_public(%s)", (new_token,)).fetchone()[
            0
        ]
    check("token nuevo resuelve la tarjeta", pub2 is not None)

    # 9) revocación definitiva
    with Ctx(conn, owner) as c:
        c.execute("select public.revoke_card(%s)", (card,))
        check(
            "tarjeta revocada no escanea",
            denied(
                lambda: c.execute(
                    "select public.scan_card(%s, 1, %s, %s)",
                    (new_token, loc, f"{run}-scan-y"),
                ),
                "card_revoked",
            ),
        )

    # 10) idempotencia E2E (el scan 0 con su clave no duplica visita)
    n = conn.execute(
        "select count(*) from public.customer_visits"
        " where organization_id = %s and idempotency_key = %s",
        (org, f"{run}-scan-0"),
    ).fetchone()[0]
    check("idempotencia E2E: 1 visita por clave", n == 1, f"{n}")

    # 11) analítica del piloto
    with Ctx(conn, owner) as c:
        a = c.execute("select public.org_analytics(%s, 30)", (org,)).fetchone()[0]
    check(
        "analytics refleja el piloto",
        a["visits_total"] == 8 and a["redemptions_completed"] == 1,
        f"visitas={a['visits_total']} canjes={a['redemptions_completed']}",
    )

    conn.close()
    failed = [r for r in RESULTS if not r[1]]
    print(f"\n{len(RESULTS) - len(failed)}/{len(RESULTS)} OK")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
