# Cómo funciona ASTRO-CARE (para Boris)

Resumen técnico para entender la app, defenderla ante el jurado y saber de dónde sale cada dato.

## 1. Qué es, en 20 segundos
Una **consola médica web** que vigila a cada astronauta en tiempo real con un holograma 3D. Antes de una tarea crítica en la Luna responde **GO** o **NO-GO**, con el motivo y qué hacer. Corre en la red local del hábitat: **no necesita internet**.

## 2. Qué ve el usuario
| Zona | Qué hace |
|---|---|
| **Holograma (izquierda)** | Modelo 3D del sistema circulatorio. El corazón late al pulso real, la sangre corre más rápido si sube el pulso, las arterias se vuelven moradas si baja el oxígeno, y el color va según NEWS2. |
| **Zonas del cuerpo** | Cada punto es una zona (cabeza, pecho, abdomen, piel, articulaciones) con su semáforo: verde, ámbar o rojo. Al tocarla se abre qué hace esa parte, qué le pasa en el espacio (riesgo NASA HRP), qué hacer, sus medidas de hoy y los síntomas que se pueden marcar. |
| **NEWS2** | Se calcula solo cada segundo. Franja de 4 niveles y botón **"ver tabla"** con el desglose. |
| **Rutina** | Seis hábitos del día: agua, comida, baño, ejercicio, sueño y chequeo. Los cuatro primeros se registran con un toque; sueño y chequeo son automáticos. Con 6/6 sale «Día completo». Agua, comida y baño afectan al veredicto antes de tareas largas. |
| **Tendencia (derecha, abajo)** | Gráfica en directo de pulso, oxígeno y NEWS2 de los últimos 2 minutos, con la banda normal de fondo. Se guarda solo en el navegador: al recargar empieza de cero. |
| **Prueba de reacción (derecha)** | El anillo se pone verde y hay que pulsar. Dura 30 s en la demo; la validada (PVT-B) dura 3 min. Al acabar sale el veredicto. |
| **Veredicto** | GO o NO-GO con los motivos. Si el problema se corrige al momento (beber agua), botón **HECHO** y se recalcula. |
| **QR** | Abre la prueba en el móvil de un juez; su resultado sale en la pantalla grande. |
| **Estado de tripulación** (abajo) | Tarjetas de los 4 tripulantes con su holograma, estado y último test. |
| **Clima espacial** (abajo) | Activa la tormenta solar real del 11-may-2024. |

## 3. Cómo decide (motor clínico)
Archivo: `packages/engine/src/rules.ts`. Cada regla devuelve **ok**, **recomendación** o **bloqueo**. **Si hay algún bloqueo, NO-GO; si no, GO** (con recomendaciones).

| Regla | NO-GO si… | ¿Se corrige en el momento? |
|---|---|---|
| Prueba de reacción | Más de un 15 % más lento que su valor normal (paseo lunar) o un 30 % (laboratorio), o demasiados lapsus | No |
| NEWS2 | Total ≥ 5 o un parámetro con 3 | No |
| Consciencia | No está alerta | No |
| Agua | < 500 ml en 3 h antes de una tarea de ≥ 4 h | **Sí** |
| Baño | > 2 h sin orinar antes de una tarea de ≥ 4 h | **Sí** |
| Síntomas | Graves: siempre. Moderados: en el paseo lunar | No |
| Sueño | < 5 h antes del paseo lunar | No |
| Presión | Sistólica ≤ 100 antes del paseo lunar | No |
| Clima espacial | Evento de partículas solares activo (paseo lunar) | No |

Los umbrales marcados con ⚠️ en el código son propuestas del equipo; los validan la enfermera y el ingeniero aeroespacial.

## 4. De dónde sale cada dato
| Dato | Fuente | ¿Real? | Dónde está |
|---|---|---|---|
| Tormenta solar 11-may-2024 (partículas > 100 MeV, Kp 9) | **NASA DONKI** (api.nasa.gov, CCMC) | ✅ Real | `apps/server/data/donki/` |
| Análisis de sangre de 4 astronautas, 7 fechas (de 92 días antes a 194 días después del vuelo) | **NASA OSDR**: OSD-569 (hemograma) y OSD-575 (panel metabólico), misión Inspiration4 | ✅ Real | `apps/server/data/osdr/` |
| IDs de la tripulación (C001–C004) | NASA OSDR (Inspiration4, anonimizados) | ✅ Real | `apps/server/data/crew.json` |
| Riesgos que cita cada regla | **NASA Human Research Program** (5 peligros, 17 riesgos) | ✅ Real | Textos del motor |
| Escala NEWS2 | Royal College of Physicians, 2017 | ✅ Real | `packages/engine/src/news2.ts` |
| Prueba de reacción | PVT-B (Basner y Dinges, 2011); lapsus > 355 ms | ✅ Método real | `apps/web/src/components/PvtPanel.tsx` |
| Constantes en directo (pulso, SpO₂…) | Simulador del servidor | ⚠️ **Simulado** | `apps/server/src/telemetry.ts` |
| Valores normales de cada tripulante | Inventados con valores típicos | ⚠️ Simulado | `apps/server/data/crew.json` |
| Roles (comandante, piloto…) | Inventados | ⚠️ Simulado | `crew.json` |

- **Los análisis de OSDR no deciden el veredicto de hoy:** son de antes y después de un vuelo, no de hoy. Están en la API (`/api/crew/:id/labs`) como referencia y para identificar a la tripulación.
- **OSDR no tiene datos de pulsera** de estos astronautas (lo comprobamos). Por eso las constantes en directo son simuladas.
- Los datos se descargaron una vez con `npm run fetch:data` y están **guardados en el repo**, así que la demo no depende de internet.

## 5. Arquitectura (monorepo)
```
packages/engine   Motor clínico en TypeScript puro (NEWS2, reglas, veredicto) + 13 tests
apps/server       Servidor del hábitat (Node + Fastify, puerto 3001)
                    · simula la telemetría a 1 Hz y la envía en directo (SSE)
                    · calcula el veredicto, guarda cuidados y chequeos (JSON)
                    · sirve los datos de DONKI y OSDR
apps/web          Consola (React + three.js + Tailwind, puerto 5173/5174)
```
**Flujo:** el simulador genera las constantes cada segundo, el servidor calcula NEWS2 y lo envía a la web, y la web pinta el holograma. Al acabar la prueba, la web manda resultado y síntomas al servidor, que aplica el motor y devuelve GO o NO-GO.

## 6. Cómo arrancar y hacer la demo
```bash
cd ~/NASA/astro-care
npm install        # solo la primera vez
npm run dev        # servidor + web → abre la URL que imprime Vite
npm test           # tests del motor
```

**Controles ocultos para quien presenta** (el público no los ve):

| Tecla | Acción |
|---|---|
| `D` | Mostrar u ocultar el panel de demo |
| `1` | Descansado |
| `2` | Deshidratado (para la historia del pitch) |
| `3` | Fatigado (4 h de sueño) |
| `4` | Hipoxia (NEWS2 8, arterias moradas) |
| `S` | Tormenta solar ON/OFF (recalcula el veredicto al momento) |

**Historia del pitch:** `2` → prueba → NO-GO → HECHO ×2 → GO → `S` → NO-GO.

## 7. Problemas conocidos antes del evento
- **QR:** apunta a la IP interna de WSL y el móvil no llega. Hay que arrancar con `PUBLIC_URL=http://<IP-de-Windows>:5174 npm run dev` y redirigir el puerto en Windows, o desplegar la app en internet.
- **Si alguien reacciona muy lento** (más de un 15 % por encima de 310 ms), le da NO-GO por fatiga. Ensayad la prueba.
- **WebGL:** si el portátil no lo soporta, se muestra un avatar 2D (ya está preparado).
- **Modelo 3D:** hay que citar de dónde salió y su licencia.
- **Uso de IA:** hay que declararlo en la página del proyecto de Space Apps.
