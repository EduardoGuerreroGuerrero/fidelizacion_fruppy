#!/usr/bin/env python3
"""Aplica stub-auth + migraciones + tests E2E a una rama temporal de Neon.

Uso:
    NEON_DSN='postgresql://...' python scripts/run_e2e_neon.py
    NEON_RESET=1 NEON_DSN=... python scripts/run_e2e_neon.py   # reutiliza la rama:
                                                              # borra public y auth antes

Replica exactamente el job `sql` de CI: stub de auth, luego cada archivo de
supabase/migrations en orden, luego cada archivo de supabase/tests.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parent.parent

STUB = """
create schema if not exists auth;
create table if not exists auth.users(id uuid primary key);
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then
    create role authenticated nologin;
  end if;
end $$;
create or replace function auth.uid() returns uuid
language sql stable as
$$ select nullif(current_setting('app.user_id', true),'')::uuid $$;
"""


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # notices con UTF-8
    dsn = os.environ.get("NEON_DSN")
    if not dsn:
        print("Falta NEON_DSN", file=sys.stderr)
        return 2

    files = sorted((ROOT / "supabase" / "migrations").glob("*.sql"))
    tests = sorted((ROOT / "supabase" / "tests").glob("*.sql"))

    notices: list[str] = []
    with psycopg.connect(dsn, autocommit=True) as conn:
        conn.add_notice_handler(lambda d: notices.append(d.message_primary or ""))
        if os.environ.get("NEON_RESET") == "1":
            print("== reset: drop schema public/auth (rama temporal)")
            conn.execute(
                "drop schema if exists public cascade; create schema public;"
                " grant usage on schema public to public;"
                " drop schema if exists auth cascade;"
            )
        print("== auth stub")
        conn.execute(STUB)
        for f in files:
            print(f"== applying {f.name}")
            conn.execute(f.read_text(encoding="utf-8"))
        for f in tests:
            print(f"== running {f.name}")
            conn.execute(f.read_text(encoding="utf-8"))

    for n in notices:
        if n.strip():
            print(n)
    print("== DONE: stub + migraciones + tests OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
