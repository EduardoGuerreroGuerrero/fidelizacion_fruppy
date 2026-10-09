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

### Estructura

```
.
├── plan_saas_fidelizacion_crm_wallet.md   # Plan maestro de ejecución
├── CHECKLIST.md                           # Seguimiento (auto-actualizable)
├── environment.yml                        # Entorno conda F_FRUPPY
├── requirements.txt                       # Deps Python de tooling
├── .env.example                           # Plantilla de variables (sin secretos)
├── scripts/
│   └── checklist.py                       # Gestor del checklist
├── docs/
│   ├── ARCHITECTURE.md                    # Arquitectura (Fase 0)
│   ├── SECURITY.md                        # Seguridad y threat model (Fase 0)
│   ├── DECISIONS.md                       # Decisiones técnicas ADR (Fase 0)
│   ├── ROADMAP.md                         # Roadmap por fases (Fase 0)
│   └── audits/                            # Informes de auditoría de repos
└── audits/repos/                          # Clones de referencia (gitignored)
```

## Reglas de seguridad (resumen)

- Nunca commitear `.env`, certificados ni claves (`.gitignore` los cubre).
- `SUPABASE_SERVICE_ROLE_KEY` jamás en el navegador ni en `NEXT_PUBLIC_*`.
- Todo dato de negocio aislado por `organization_id` + RLS.
- Puntos/sellos en ledger inmutable; correcciones = movimientos compensatorios.
- Decisiones y riesgos se documentan en `docs/`.
