# ASTRO-CARE

**Offline health-monitoring software for Artemis astronauts** · NASA Space Apps Challenge 2026 · Team Deploy to Mars (Barcelona)

A 3D avatar fills the screen and shows each astronaut's health **in real time**: the habitat server streams wearable vitals at 1 Hz and computes **NEWS2 automatically** (nobody types vitals). Water, food, urine, stool, exercise and sleep are logged with one tap. Before any critical lunar-surface task, the **Mission Readiness Test** gives one answer: **GO** or **NO-GO**, with the reason and what to do. Some NO-GOs can be fixed on the spot (e.g. "drink 500 ml" → Done → recalculated).

> Decision support only. The commander / flight surgeon makes the final call.

## Monorepo

```
apps/
  web/        React 19 + Vite + Tailwind 4 + Motion: avatar, care log, readiness test, crew view
  server/     Fastify habitat server (LAN, offline): crew state, care log, checks, NASA data
    data/osdr/   real NASA OSDR CSVs (cached)
    data/donki/  real NASA DONKI JSON (cached)
packages/
  engine/     pure TypeScript clinical engine (NEWS2, PVT, hydration, symptoms, verdict) + Vitest
```

## Run

```bash
npm install
npm run dev        # server :3001 + web :5173 (web proxies /api)
npm test           # engine tests
npm run fetch:data # re-download NASA data (optional; cached copies are committed)
```

Open http://localhost:5173. UI in Spanish. Use the **Demo** buttons (descansado / deshidratado / fatigado / hipoxia) and the **space weather** toggle to reproduce the pitch scenarios.

## NASA data used

| Source | What | How it's used |
|---|---|---|
| [NASA OSDR OSD-569](https://osdr.nasa.gov/bio/repo/data/studies/OSD-569) | Inspiration4 crew (C001–C004) Complete Blood Count, LSDS-7, 7 timepoints (L-92 … R+194) | Crew IDs/sex; blood test card; hemoglobin rule (advice) |
| [NASA OSDR OSD-575](https://osdr.nasa.gov/bio/repo/data/studies/OSD-575) | Inspiration4 Comprehensive Metabolic Panel, LSDS-8 | BUN/creatinine dehydration marker (advice) |
| NASA DONKI (CCMC) via api.nasa.gov | Solar energetic particle events and geomagnetic storms, May 2024 (Kp 9, GOES >100 MeV SEP) | Real solar event → NO-GO for EVA / rover |
| NASA Human Research Program | 5 hazards, 17 risks | Every rule cites its HRP risk |

**Simulated:** the live wearable feed (`apps/server/src/telemetry.ts`) and PVT baselines (OSDR has no wearable vitals for this crew). Crew roles are fictional.

Clinical references: NEWS2 (Royal College of Physicians 2017), PVT-B (Basner & Dinges 2011). Thresholds marked ⚠️ in `packages/engine` must be validated by the team nurse and aerospace engineer.

## API (habitat server)

| Method | Path | |
|---|---|---|
| GET | `/api/meta` | tasks, body zones, lab timepoints, sources |
| GET | `/api/crew`, `/api/crew/:id` | crew state (avatar, NEWS2, intake, last check) |
| GET | `/api/crew/:id/labs` | OSDR lab rows (R+1) |
| POST | `/api/crew/:id/care` | `{type, value, at?}` log water/food/urine/stool/exercise/sleep |
| GET | `/api/telemetry/stream` | live vitals + NEWS2 + avatar state for all crew (SSE, 1 Hz) |
| PUT | `/api/crew/:id/scenario` | demo: `{scenario: nominal\|dehydrated\|fatigued\|hypoxic}` drives the simulated wearable |
| POST | `/api/crew/:id/check` | run GO / NO-GO with the live vitals; returns findings |
| POST | `/api/crew/:id/reset` | clear a crew member's log (demo) |
| GET | `/api/space-weather?at=ISO` | DONKI events + active SEP at that time |
