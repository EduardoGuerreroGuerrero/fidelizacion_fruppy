#!/usr/bin/env python3
"""Pruebas del motor de fidelización contra Postgres real (Fase 4).

Requiere DATABASE_URL apuntando a una DB con migraciones aplicadas con
--stub-auth. Simula el rol `authenticated` + auth.uid() vía GUCs de sesión,
igual que hace Supabase con el JWT.

    python scripts/db_apply.py --stub-auth
    python scripts/test_engine.py
"""

from __future__ import annotations

import os
import sys
from contextlib import contextmanager
from pathlib import Path

import psycopg
from dotenv import load_dotenv

if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
URL = os.environ.get("DATABASE_URL") or sys.exit("DATABASE_URL requerido")

USER_A = "11111111-1111-1111-1111-111111111111"
USER_B = "22222222-2222-2222-2222-222222222222"

# Las claves de idempotencia son únicas por organización: cada ejecución usa
# un prefijo propio para no colisionar con corridas anteriores en la misma DB.
import uuid

RUN = uuid.uuid4().hex[:8]


def K(key: str) -> str:
    return f"{RUN}-{key}"


passed = failed = 0


def check(name: str, cond: bool, detail: str = "") -> None:
    global passed, failed
    if cond:
        passed += 1
        print(f"  PASS {name}")
    else:
        failed += 1
        print(f"  FAIL {name}  {detail}")


@contextmanager
def as_user(conn, user_id: str):
    """Ejecuta una tx como el rol `authenticated` con auth.uid() = user_id."""
    with conn.cursor() as c, conn.transaction():
        c.execute("set local role authenticated")
        c.execute("select set_config('app.user_id', %s, true)", (user_id,))
        yield c


def call_fails(cur, sql, params=(), needle="") -> bool:
    try:
        cur.execute(sql, params)
        return False
    except Exception as e:  # noqa: BLE001 — test harness
        return needle in str(e)


def main() -> None:
    with psycopg.connect(URL) as conn:
        conn.autocommit = True
        cur = conn.cursor()

        # neondb_owner puede hacer SET ROLE sin grant explícito;
        # reset preventivo por si el pooler devuelve una sesión con role heredado
        cur.execute("reset role")

        # ---- seed como owner (RLS no aplica a neondb_owner) ----
        cur.execute(
            "insert into auth.users(id) values (%s),(%s) on conflict do nothing",
            (USER_A, USER_B),
        )
        cur.execute(
            "insert into organizations(name,slug) values('Org A','ta'),('Org B','tb')"
            " on conflict (slug) do nothing"
        )
        cur.execute(
            "insert into organization_members(organization_id,user_id,role)"
            " select id,%s,'owner' from organizations where slug='ta'"
            " on conflict do nothing",
            (USER_A,),
        )
        cur.execute(
            "insert into organization_members(organization_id,user_id,role)"
            " select id,%s,'owner' from organizations where slug='tb'"
            " on conflict do nothing",
            (USER_B,),
        )
        cur.execute(
            "insert into customers(organization_id,first_name)"
            " select id,'Ana' from organizations where slug='ta' returning id"
        )
        cust_a = cur.fetchone()[0]
        cur.execute(
            "insert into loyalty_programs(organization_id,name,program_type,stamp_goal)"
            " select id,'Sellos','stamps',9 from organizations where slug='ta'"
            " returning id"
        )
        prog_a = cur.fetchone()[0]
        cur.execute(
            "insert into loyalty_accounts(organization_id,customer_id,program_id)"
            " values((select id from organizations where slug='ta'),%s,%s)"
            " returning id",
            (cust_a, prog_a),
        )
        acc_a = cur.fetchone()[0]
        cur.execute(
            "insert into rewards(organization_id,program_id,name,cost_stamps)"
            " values((select id from organizations where slug='ta'),%s,"
            "        'Cafe gratis',9) returning id",
            (prog_a,),
        )
        reward_a = cur.fetchone()[0]

        def stamps() -> int:
            cur.execute(
                "select current_stamps from loyalty_accounts where id=%s", (acc_a,)
            )
            return cur.fetchone()[0]

        print("\n== Fase 4: motor de fidelizacion ==")

        with as_user(conn, USER_A) as c:
            c.execute("select public.earn(%s,0,5,null,null,%s,null)", (acc_a, K("e1")))
            tx_e1 = c.fetchone()[0]
        check("earn otorga 5 sellos", stamps() == 5)

        with as_user(conn, USER_A) as c:
            c.execute("select public.earn(%s,0,5,null,null,%s,null)", (acc_a, K("e1")))
            tx_e1b = c.fetchone()[0]
        check(
            "idempotencia: misma clave devuelve tx original sin duplicar",
            tx_e1 == tx_e1b and stamps() == 5,
        )

        with as_user(conn, USER_A) as c:
            ok = call_fails(
                c,
                "select public.redeem_reward(%s,%s,null,%s)",
                (reward_a, cust_a, K("r1")),
                "insufficient_balance",
            )
        check("canje sin saldo suficiente → insufficient_balance", ok)
        check("saldo intacto tras canje fallido", stamps() == 5)

        with as_user(conn, USER_A) as c:
            c.execute("select public.earn(%s,0,4,null,null,%s,null)", (acc_a, K("e2")))
            c.execute(
                "select public.redeem_reward(%s,%s,null,%s)",
                (reward_a, cust_a, K("r2")),
            )
            red1 = c.fetchone()[0]
        check("canje atomico con saldo suficiente (9-9=0)", stamps() == 0)

        with as_user(conn, USER_A) as c:
            ok = call_fails(
                c,
                "select public.redeem_reward(%s,%s,null,%s)",
                (reward_a, cust_a, K("r3")),
                "insufficient_balance",
            )
        check("segundo canje sin saldo → rechazado (sin doble canje)", ok)

        with as_user(conn, USER_A) as c:
            c.execute(
                "select public.redeem_reward(%s,%s,null,%s)",
                (reward_a, cust_a, K("r2")),
            )
            red2 = c.fetchone()[0]
        check("reintento de canje con misma clave → mismo redencion", red1 == red2)

        with as_user(conn, USER_B) as c:
            ok = call_fails(
                c,
                "select public.earn(%s,0,1,null,null,%s,null)",
                (acc_a, K("x")),
                "forbidden",
            )
        check("usuario de Org B no puede otorgar sellos en Org A", ok)

        with as_user(conn, USER_B) as c:
            c.execute("select first_name from customers")
            rows = c.fetchall()
        check("Org B no lee clientes de Org A (RLS)", rows == [])

        # reverso exitoso: gana 3 y lo revierte
        with as_user(conn, USER_A) as c:
            c.execute("select public.earn(%s,0,3,null,null,%s,null)", (acc_a, K("e3")))
            tx_e3 = c.fetchone()[0]
        check("earn +3 para prueba de reverso", stamps() == 3)

        with as_user(conn, USER_A) as c:
            c.execute(
                "select public.reverse_transaction(%s,'registro erroneo')",
                (tx_e3,),
            )
        check("reverso compensa sellos (3→0)", stamps() == 0)

        with as_user(conn, USER_A) as c:
            ok = call_fails(
                c,
                "select public.reverse_transaction(%s,'otra vez')",
                (tx_e3,),
                "already_reversed",
            )
        check("doble reverso de la misma tx → already_reversed", ok)

        # reverso que dejaria saldo negativo debe fallar
        with as_user(conn, USER_A) as c:
            ok = call_fails(
                c,
                "select public.reverse_transaction(%s,'forzar negativo')",
                (tx_e1,),
            )
        check("reverso que dejaria saldo negativo → rechazado por CHECK", ok)

        with as_user(conn, USER_A) as c:
            ok = call_fails(
                c,
                "update loyalty_transactions set stamps_delta=99 where id=%s",
                (tx_e1,),
            )
        check("UPDATE directo al ledger → prohibido", ok)

        cur.execute(
            "select coalesce(sum(stamps_delta),0) from loyalty_transactions"
            " where account_id=%s",
            (acc_a,),
        )
        ledger_sum = cur.fetchone()[0]
        check(
            "saldo == SUM(ledger) (reconciliable)",
            stamps() == ledger_sum,
            f"saldo={stamps()} ledger={ledger_sum}",
        )

        # --- record_visit + idempotencia ---
        with as_user(conn, USER_A) as c:
            c.execute(
                "select public.record_visit(%s,null,15000,'pos',%s)",
                (cust_a, K("v1")),
            )
            v1 = c.fetchone()[0]
            c.execute(
                "select public.record_visit(%s,null,15000,'pos',%s)",
                (cust_a, K("v1")),
            )
            v2 = c.fetchone()[0]
        check("record_visit idempotente (misma clave → misma visita)", v1 == v2)
        cur.execute("select count(*) from customer_visits where id=%s", (v1,))
        check("visita persistida con atribución", cur.fetchone()[0] == 1)

        # --- concurrencia real: dos canjes simultáneos, solo uno gana ---
        with as_user(conn, USER_A) as c:
            c.execute("select public.earn(%s,0,9,null,null,%s,null)", (acc_a, K("e4")))
        check("earn +9 para test de concurrencia", stamps() == 9)

        import threading

        results: list[tuple[str, object]] = []

        def worker(key: str) -> None:
            with psycopg.connect(URL, autocommit=True) as c2:
                c2.execute("reset role")  # por si el pooler devuelve sesión heredada
                # set local dentro de tx: no fuga de role hacia el pooler
                try:
                    with c2.transaction():
                        c2.execute("set local role authenticated")
                        c2.execute(
                            "select set_config('app.user_id', %s, true)", (USER_A,)
                        )
                        r = c2.execute(
                            "select public.redeem_reward(%s,%s,null,%s)",
                            (reward_a, cust_a, key),
                        ).fetchone()
                        results.append(("ok", r[0]))
                except Exception as e:  # noqa: BLE001 — test harness
                    results.append(("fail", str(e)))

        threads = [
            threading.Thread(target=worker, args=(K("c1"),)),
            threading.Thread(target=worker, args=(K("c2"),)),
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        wins = [r for r in results if r[0] == "ok"]
        losses = [r for r in results if r[0] == "fail"]
        check(
            "concurrencia: exactamente un canje gana",
            len(wins) == 1
            and len(losses) == 1
            and "insufficient_balance" in str(losses[0][1]),
            str(results),
        )
        check("saldo final 0 tras canje concurrente", stamps() == 0)

        cur.execute(
            "select count(*) from redemptions"
            " where account_id=%s and status='completed'",
            (acc_a,),
        )
        n_done = cur.fetchone()[0]
        check(
            "solo 2 redenciones en la cuenta (r2 + ganador concurrente)",
            n_done == 2,
            f"completadas={n_done}",
        )

        print(f"\n{passed} pasaron, {failed} fallaron")
        sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
