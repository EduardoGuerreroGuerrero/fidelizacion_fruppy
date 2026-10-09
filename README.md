# Fruppy — SaaS de fidelización, CRM y tarjetas digitales

Plataforma SaaS multiempresa para que comercios locales gestionen programas de
fidelización (sellos/puntos), CRM de clientes y tarjetas digitales para
Apple Wallet / Google Wallet.

Documento rector: [`plan_saas_fidelizacion_crm_wallet.md`](plan_saas_fidelizacion_crm_wallet.md)

## Estado del proyecto

Ver **[CHECKLIST.md](CHECKLIST.md)** — se actualiza automáticamente con:

```bash
python scripts/checklist.py status        # ver progreso por fase
python scripts/checklist.py done F0-T1    # marcar tarea hecha
python scripts/checklist.py doing F0-T1   # marcar en curso
python scripts/checklist.py blocked F0-T1 # marcar bloqueada
```

## Entorno de desarrollo

### Requisitos

- Conda (Miniconda/Anaconda)
- Git
- Node.js LTS (a partir de Fase 1, para la app Next.js)

### Puesta en marcha

```bash
# Crear/actualizar el entorno conda del proyecto
conda env update -f environment.yml --prune
conda activate F_FRUPPY

# O si el env ya existe:
conda activate F_FRUPPY
pip install -r requirements.txt

# Variables de entorno locales (sin secretos reales en el repo)
cp .env.example .env
```

### Aplicación (apps/web)

```bash
npm install         # instala workspaces (node_modules en raíz)
npm run dev         # Next.js dev en http://localhost:3000
npm run check       # lint + typecheck + test + build
```

Variables: copiar `.env.example` a `apps/web/.env.local` con los valores locales.

### Estructura

```
.
├── plan_saas_fidelizacion_crm_wallet.md   # Plan maestro de ejecución
├── CHECKLIST.md                           # Seguimiento (auto-actualizable)
├── environment.yml / requirements.txt     # Entorno conda F_FRUPPY (tooling)
├── package.json                           # Workspaces npm (apps/*)
├── .env.example                           # Plantilla de variables (sin secretos)
├── apps/
│   └── web/                               # App Next.js 16 + TS estricto + Tailwind
├── supabase/
│   ├── config.toml                        # Stack local (requiere Docker)
│   └── migrations/                        # Migraciones SQL versionadas
├── scripts/
│   └── checklist.py                       # Gestor del checklist
├── docs/
│   ├── ARCHITECTURE.md / SECURITY.md / DECISIONS.md / ROADMAP.md
│   └── audits/                            # Informes de auditoría de repos
└── audits/repos/                          # Clones de referencia (gitignored)
```

## Reglas de seguridad (resumen)

- Nunca commitear `.env`, certificados ni claves (`.gitignore` los cubre).
- `SUPABASE_SERVICE_ROLE_KEY` jamás en el navegador ni en `NEXT_PUBLIC_*`.
- Todo dato de negocio aislado por `organization_id` + RLS.
- Puntos/sellos en ledger inmutable; correcciones = movimientos compensatorios.
- Decisiones y riesgos se documentan en `docs/`.
