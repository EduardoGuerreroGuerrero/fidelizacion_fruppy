#!/usr/bin/env python3
"""Actualización automática de CHECKLIST.md.

Uso:
    python scripts/checklist.py status            # ver progreso
    python scripts/checklist.py done F0-T1        # marcar hecho
    python scripts/checklist.py doing F0-T1       # marcar en curso
    python scripts/checklist.py undone F0-T1      # marcar pendiente
    python scripts/checklist.py blocked F0-T1     # marcar bloqueado
    python scripts/checklist.py refresh           # recalcular bloque de progreso
    python scripts/checklist.py note F0-T1 "txt"  # hecho + nota al final de la línea

Tras cada cambio se regenera el bloque <!-- PROGRESS --> de CHECKLIST.md.
Solo usa la librería estándar (compatible con el env conda F_FRUPPY).
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
CHECKLIST = ROOT / "CHECKLIST.md"

TASK_RE = re.compile(r"^(?P<indent>\s*)- \[(?P<mark>[ x~!])\]\s*<!--\s*(?P<tid>[A-Z0-9._-]+)\s*-->\s*(?P<text>.*)$")
HEADING_RE = re.compile(r"^##\s+(?P<name>.+?)\s*$")
PROGRESS_START = "<!-- PROGRESS:START -->"
PROGRESS_END = "<!-- PROGRESS:END -->"

MARKS = {"done": "x", "doing": "~", "undone": " ", "blocked": "!"}
STATUS_LABEL = {"x": "hecho", "~": "en curso", "!": "bloqueado", " ": "pendiente"}


def load() -> list[str]:
    if not CHECKLIST.exists():
        sys.exit(f"No existe {CHECKLIST}")
    return CHECKLIST.read_text(encoding="utf-8").splitlines()


def save(lines: list[str]) -> None:
    CHECKLIST.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse(lines: list[str]):
    """Devuelve tasks=[{id, mark, section, idx}] y lista ordenada de secciones."""
    tasks, sections, current = [], [], "General"
    for i, line in enumerate(lines):
        h = HEADING_RE.match(line)
        if h:
            current = h.group("name")
            if current not in sections:
                sections.append(current)
            continue
        t = TASK_RE.match(line)
        if t:
            tasks.append(
                {"id": t.group("tid"), "mark": t.group("mark"),
                 "section": current, "idx": i}
            )
    return tasks, sections


def bar(pct: float, width: int = 20) -> str:
    filled = round(pct / 100 * width)
    return "█" * filled + "░" * (width - filled)


def refresh(lines: list[str]) -> list[str]:
    tasks, sections = parse(lines)
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    done = sum(1 for t in tasks if t["mark"] == "x")
    wip = sum(1 for t in tasks if t["mark"] == "~")
    blocked = sum(1 for t in tasks if t["mark"] == "!")
    total = len(tasks)
    pct = done / total * 100 if total else 0

    out = [
        PROGRESS_START,
        f"**Última actualización:** {now}  ",
        f"**Global:** {done}/{total} hechas "
        f"({pct:.0f}%) `{bar(pct)}` "
        f"· en curso: {wip} · bloqueadas: {blocked}",
        "",
        "| Sección | Hecho | Total | % | Progreso |",
        "|---|---|---|---|---|",
    ]
    for sec in sections:
        st = [t for t in tasks if t["section"] == sec]
        if not st:
            continue
        sd = sum(1 for t in st if t["mark"] == "x")
        sp = sd / len(st) * 100
        out.append(f"| {sec} | {sd} | {len(st)} | {sp:.0f}% | `{bar(sp, 10)}` |")
    out.append(PROGRESS_END)

    try:
        start = lines.index(PROGRESS_START)
        end = lines.index(PROGRESS_END)
    except ValueError:
        sys.exit("No se encontraron los marcadores PROGRESS en CHECKLIST.md")
    return lines[:start] + out + lines[end + 1:]


def set_mark(lines: list[str], task_id: str, mark: str, note: str | None = None) -> list[str]:
    for i, line in enumerate(lines):
        t = TASK_RE.match(line)
        if t and t.group("tid") == task_id:
            text = t.group("text").rstrip()
            if note:
                text = f"{text} — _{note}_"
            lines[i] = f"{t.group('indent')}- [{mark}] <!-- {task_id} --> {text}"
            return lines
    sys.exit(f"Tarea no encontrada: {task_id}")


def cmd_status(lines: list[str]) -> None:
    tasks, sections = parse(lines)
    total = len(tasks)
    done = sum(1 for t in tasks if t["mark"] == "x")
    pct = done / total * 100 if total else 0
    print(f"\nProgreso global: {done}/{total} ({pct:.0f}%)  {bar(pct)}\n")
    for sec in sections:
        st = [t for t in tasks if t["section"] == sec]
        if not st:
            continue
        sd = sum(1 for t in st if t["mark"] == "x")
        sp = sd / len(st) * 100
        print(f"  {sec:<55} {sd}/{len(st)}  {bar(sp, 10)} {sp:.0f}%")
        for t in st:
            if t["mark"] in ("~", "!"):
                print(f"      [{STATUS_LABEL[t['mark']]}] {t['id']}")
    print()


def main() -> None:
    p = argparse.ArgumentParser(description="Gestor del CHECKLIST del proyecto")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("status")
    sub.add_parser("refresh")
    for name in MARKS:
        sp = sub.add_parser(name)
        sp.add_argument("task_id")
    sp = sub.add_parser("note")
    sp.add_argument("task_id")
    sp.add_argument("note")
    args = p.parse_args()

    lines = load()
    if args.cmd == "status":
        cmd_status(lines)
        return
    if args.cmd == "refresh":
        save(refresh(lines))
        print("Bloque de progreso actualizado.")
        return
    if args.cmd == "note":
        lines = set_mark(lines, args.task_id, "x", note=args.note)
        save(refresh(lines))
        print(f"{args.task_id} marcado como hecho con nota.")
        return
    lines = set_mark(lines, args.task_id, MARKS[args.cmd])
    save(refresh(lines))
    print(f"{args.task_id} → {STATUS_LABEL[MARKS[args.cmd]]}.")


if __name__ == "__main__":
    main()
