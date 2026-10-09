"""Pruebas Fase 7 — administración: invitaciones, roles y branding.

Ejecutar contra una rama de Neon con todas las migraciones aplicadas:

    python scripts/test_admin.py --url "postgresql://..."

Simula `authenticated` con auth.uid() (GUC app.user_id) y
app.user_email para claim_invites.
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
    """Contexto: BEGIN + SET LOCAL role/user/email, COMMIT al salir."""

    def __init__(self, conn: psycopg.Connection, user_id: uuid.UUID, email: str = ""):
        self.conn = conn
        self.user_id = user_id
        self.email = email

    def __enter__(self):
        self.conn.execute("begin")
        self.conn.execute("set local role authenticated")
        self.conn.execute(
            "select set_config('app.user_id', %s, true)", (str(self.user_id),)
        )
        if self.email:
            self.conn.execute(
                "select set_config('app.user_email', %s, true)", (self.email,)
            )
        return self.conn

    def __exit__(self, exc_type, *_):
        self.conn.execute("rollback" if exc_type else "commit")
        self.conn.execute("reset role")
        return False


def denied(fn) -> bool:
    try:
        fn()
        return False
    except psycopg.Error:
        return True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    args = ap.parse_args()

    run = uuid.uuid4().hex[:8]
    email = f"invitee-{run}@example.com"

    conn = psycopg.connect(args.url, autocommit=True)
    conn.execute("reset role")

    # ---- setup como owner (superusuario) ----
    org = uuid.uuid4()
    owner = uuid.uuid4()
    staff = uuid.uuid4()
    outsider = uuid.uuid4()
    invitee = uuid.uuid4()

    for u in (owner, staff, outsider, invitee):
        conn.execute(
            "insert into auth.users (id) values (%s) on conflict do nothing", (u,)
        )
    conn.execute(
        "insert into public.organizations (id, name, slug) values (%s, %s, %s)",
        (org, f"Org Admin {run}", f"adm-{run}"),
    )
    conn.execute(
        "insert into public.organization_members (organization_id, user_id, role, status)"
        " values (%s, %s, 'owner', 'active'), (%s, %s, 'staff', 'active')",
        (org, owner, org, staff),
    )

    # ---- invitaciones ----
    with Ctx(conn, owner) as c:
        c.execute(
            "insert into public.organization_invites (organization_id, email, role)"
            " values (%s, %s, 'staff')",
            (org, email),
        )
    check("owner crea invitación", True)

    with Ctx(conn, staff) as c:
        check(
            "staff NO puede invitar (solo manager+)",
            denied(
                lambda: c.execute(
                    "insert into public.organization_invites"
                    " (organization_id, email, role) values (%s, %s, 'staff')",
                    (org, f"otro-{run}@example.com"),
                )
            ),
        )

    with Ctx(conn, staff) as c:
        n = c.execute(
            "select count(*) from public.organization_invites where organization_id = %s",
            (org,),
        ).fetchone()[0]
        check("staff no lee invitaciones (select = manager+)", n == 0, f"ve {n}")

    with Ctx(conn, outsider) as c:
        n = c.execute(
            "select count(*) from public.organization_invites where organization_id = %s",
            (org,),
        ).fetchone()[0]
        check("externo no lee invitaciones", n == 0)

    # ---- claim_invites ----
    with Ctx(conn, invitee, email) as c:
        claimed = c.execute("select public.claim_invites()").fetchone()[0]
        check("claim_invites reclama 1 invitación", claimed == 1, f"{claimed}")

    m = conn.execute(
        "select role, status from public.organization_members"
        " where organization_id = %s and user_id = %s",
        (org, invitee),
    ).fetchone()
    check("membresía creada active/staff", m == ("staff", "active"), f"{m}")

    inv = conn.execute(
        "select status, accepted_at is not null from public.organization_invites"
        " where organization_id = %s and email = %s",
        (org, email),
    ).fetchone()
    check("invitación marcada accepted", inv == ("accepted", True), f"{inv}")

    with Ctx(conn, invitee, email) as c:
        again = c.execute("select public.claim_invites()").fetchone()[0]
        check("claim_invites idempotente (0 la 2ª vez)", again == 0, f"{again}")

    # usuario sin invitación
    with Ctx(conn, outsider, f"nadie-{run}@example.com") as c:
        zero = c.execute("select public.claim_invites()").fetchone()[0]
        check("sin invitación pendiente → 0", zero == 0)

    # ---- branding ----
    with Ctx(conn, owner) as c:
        c.execute(
            "update public.organizations set brand = %s::jsonb where id = %s",
            ('{"color": "#0ea5e9", "logo_url": "https://x.test/l.png"}', org),
        )
    b = conn.execute(
        "select brand->>'color' from public.organizations where id = %s", (org,)
    ).fetchone()[0]
    check("owner actualiza brand", b == "#0ea5e9", b)

    with Ctx(conn, staff) as c:
        c.execute(
            "update public.organizations set name = %s where id = %s",
            (f"h4x-{run}", org),
        )
    nm = conn.execute(
        "select name from public.organizations where id = %s", (org,)
    ).fetchone()[0]
    check("staff no puede renombrar org (RLS)", nm == f"Org Admin {run}", nm)

    # ---- sin DELETE en invites ----
    with Ctx(conn, owner) as c:
        check(
            "DELETE en invites sin grant (cancelar = status)",
            denied(
                lambda: c.execute(
                    "delete from public.organization_invites where organization_id = %s",
                    (org,),
                )
            ),
        )

    conn.close()
    failed = [r for r in RESULTS if not r[1]]
    print(f"\n{len(RESULTS) - len(failed)}/{len(RESULTS)} OK")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
