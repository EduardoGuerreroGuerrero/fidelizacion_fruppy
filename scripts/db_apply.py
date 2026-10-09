#!/usr/bin/env python3
"""Aplica migraciones SQL de supabase/migrations a cualquier Postgres.

Uso:
    set DATABASE_URL=postgresql://user:pass@host/db
    python scripts/db_apply.py [--stub-auth] [--dir supabase/migrations]

- Crea tabla _migrations para idempotencia (no reaplica lo ya aplicado).
- --stub-auth crea el schema auth + auth.users + auth.uid() para Postgres
  plano (Neon, CI). En Supabase real el schema auth ya existe.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parent.parent

STUB_AUTH = """
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
-- En Supabase, auth.uid() lee el JWT; en Postgres plano lee un GUC de test.
create or replace function auth.uid() returns uuid
language sql stable as
$$ select nullif(current_setting('app.user_id', true),'')::uuid $$;
"""


def main() -> None:
    p = argparse.ArgumentParser(description="Aplica migraciones SQL")
    p.add_argument("--dir", default=str(ROOT / "supabase" / "migrations"))
    p.add_argument("--stub-auth", action="store_true")
    p.add_argument("--url", default=None, help="override DATABASE_URL")
    args = p.parse_args()

    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
    import os

    url = args.url or os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL no definido (pásalo por env o --url)")

    migrations = sorted(Path(args.dir).glob("*.sql"))
    if not migrations:
        sys.exit(f"Sin migraciones en {args.dir}")

    with psycopg.connect(url, autocommit=False) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "create table if not exists public._migrations"
                " (name text primary key, applied_at timestamptz default now())"
            )
            if args.stub_auth:
                print("== auth stub")
                cur.execute(STUB_AUTH)
            for f in migrations:
                cur.execute(
                    "select 1 from public._migrations where name = %s", (f.name,)
                )
                if cur.fetchone():
                    print(f"   skip  {f.name} (ya aplicada)")
                    continue
                print(f"== apply {f.name}")
                cur.execute(f.read_text(encoding="utf-8"))
                cur.execute(
                    "insert into public._migrations (name) values (%s)", (f.name,)
                )
        conn.commit()
    print("OK — migraciones aplicadas")


if __name__ == "__main__":
    main()
