# Project page: text for every field (copy and paste)

Space Apps project page → **My Team → Project → Edit**. Everything must be in **English**. Use **Save Progress** often.

---

## Project Name
ASTRO-CARE

## High-Level Project Summary
ASTRO-CARE is offline health-monitoring software that answers one question before every critical task on the Moon: can this astronaut go out today? GO or NO-GO. A live 3D body shows the astronaut's vital signs, the hospital NEWS2 early-warning score is computed every second, and a 30-second reaction test (based on NASA's PVT-B) measures fatigue. The verdict depends on the task, explains why and what to do, and some NO-GOs can be fixed on the spot (drink 500 ml, tap DONE, recompute). A real solar particle event from NASA DONKI blocks surface tasks even for a healthy astronaut. It addresses the challenge because astronauts far from Earth must detect changes in their own bodies without being doctors, and a clear, explained decision before a 7-hour moonwalk can prevent accidents.

## Link to Project Demo
`<public link to ASTRO-CARE-pitch-EN.pptx on Google Drive, or to the 30-second video on YouTube>`

## Link to Final Project
https://github.com/borizSam/astro-care

## Detailed Project Description
**What it does.** Before a critical task (moonwalk/EVA, rover drive or habitat lab work), ASTRO-CARE gives a single verdict, GO or NO-GO, with the reason, the action to take and the scientific source of every rule. The commander or flight surgeon keeps the final call.

**How it works.**
- A habitat server (Fastify, runs on the local network, no internet needed) streams wearable vital signs once per second and computes NEWS2 (Royal College of Physicians 2017) on every reading.
- A web console (React, three.js) shows a live 3D circulatory body whose heart beats at the measured pulse and changes colour with the risk level. Each body zone is clickable and explains, in plain language, what it does, what spaceflight does to it (NASA Human Research Program risk), what to do today, and today's readings with a green/amber/red status.
- A live trend panel shows pulse, oxygen and NEWS2 over the last two minutes; a 6-habit daily routine (water, meals, toilet, exercise, sleep, check) is logged with one tap.
- A 30-second reaction test based on PVT-B (Basner & Dinges 2011) compares the astronaut with their own baseline; lapses and false starts count as errors.
- A pure TypeScript clinical engine combines vitals, reaction test, hydration, sleep, symptoms and space weather. Each task has its own thresholds: the same tired astronaut can be GO for lab work and NO-GO for a 7-hour moonwalk.
- Space weather comes from NASA DONKI: the real 11 May 2024 solar particle event (GOES >100 MeV) blocks EVA and rover tasks.

**Safety design.** It follows clinical decision-support rules: missing data is never assumed (no sleep logged → NO-GO for EVA), malformed input is rejected, and 109 automated tests check every NEWS2 band edge and that no dangerous state ever returns GO.

**Benefits.** No medical knowledge needed, works offline with communication delays or blackouts, explains every decision, and catches fixable problems (dehydration, no toilet break) before the astronaut is sealed in a suit for hours.

**What we hope to achieve.** Connect real suit sensors, validate the thresholds with flight surgeons, and bring the same GO/NO-GO check to Earth: nurses after 12-hour night shifts, pilots, air traffic controllers and remote bases.

**Tools.** TypeScript, React 19, Vite, Tailwind CSS, Motion, three.js, Fastify, Vitest, Node.js. Open source under the MIT license.

**Honest limits.** The live wearable feed is simulated (OSDR has no wearable data for this crew); the thresholds are reviewed by our team nurse but not yet clinically validated.

## Use of Super Intelligence (SI)
*(Only for data collection; judges don't see this answer.)*
Yes. The idea, the clinical rules and the thresholds were chosen by the team. We used an AI coding assistant (Claude, Anthropic) to help write and review parts of the TypeScript code and tests, and to draft and translate documentation, the pitch script and the English user interface. All AI-assisted code was reviewed and tested by the team. The narration of the 30-second demo video is an AI-generated voice (Piper TTS, open-source); this is labelled on screen and in the video metadata. No AI-generated images are used: all visuals are captures of the real app. This is also stated in the "Use of AI" section of the repository README.

## NASA Data
- **NASA DONKI (CCMC, via api.nasa.gov):** solar energetic particle events and geomagnetic storms of May 2024 (Kp 9, GOES >100 MeV SEP). The real 11 May 2024 event drives the NO-GO for surface tasks (EVA, rover): the Moon has no magnetic field.
- **NASA OSDR OSD-569 (LSDS-7):** Inspiration4 crew Complete Blood Count, 7 timepoints. Crew IDs and reference blood tests in the app.
- **NASA OSDR OSD-575 (LSDS-8):** Inspiration4 Comprehensive Metabolic Panel. Reference blood tests.
- **NASA Human Research Program:** the 5 spaceflight hazards and their risks. Every alert and every body zone cites its HRP risk.
- **NASA PVT-B:** the reaction test is based on the psychomotor vigilance test used by NASA on the International Space Station.

## Space Agency Partner Data and Other References
- NEWS2: Royal College of Physicians, *National Early Warning Score (NEWS) 2*, 2017.
- PVT-B: Basner M., Dinges D.F., "Maximizing sensitivity of the psychomotor vigilance test (PVT) to sleep loss", *Sleep*, 2011.
- Open-source libraries (MIT): React, Vite, Tailwind CSS, Motion, three.js, qrcode, Fastify, Vitest.
- Fonts (SIL Open Font License 1.1): Oswald, JetBrains Mono, via Fontsource.
- 3D circulatory model: made by the team, optimised with glTF-Transform. **⚠️ Confirm its origin before submitting.**
- AI assistance: Claude (Anthropic), as described in the SI field.
- Video narration: Piper TTS (open source, MIT) with the en_GB-alan voice (AI-generated audio).
- No Space Agency Partner data was used.

---

## Before you click "Submit for Judging"
- [ ] Every member (Boris, Antony, Andrea) is registered for the **same Barcelona Local Event**, not waitlisted, and appears on the **Members** tab.
- [ ] The GitHub repository is **public**: `gh repo edit borizSam/astro-care --visibility public --accept-visibility-change-consequences`.
- [ ] The demo link opens in a **private browser window** with no login.
- [ ] Tick: "I have read and understand the project submission requirements…".
- [ ] Tick: "I confirm that the submitted project represents my team's original work and that all external resources… are listed in the References field…".
- [ ] **Submit for Judging** before **23:59 today (Barcelona time)**. You can edit and resubmit until then.
