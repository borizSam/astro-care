# Guion del vídeo de 30 segundos (Project Demo)

**Reglas de la guía oficial:**
- **30 s como máximo.** Si dura más, el proyecto queda fuera del juicio global. Apuntad a 28 s.
- Se puede hablar en español, pero **con subtítulos en inglés obligatorios**. Lo más sencillo es hablar en inglés.
- Sin logos ni elementos de marca de la NASA en nada generado con IA. Si alguna imagen está generada con IA, necesita **marca de agua visible**.
- No puede salir nadie menor de 18 años.
- Subidlo a YouTube como **Unlisted** o **Public**. Comprobad el enlace en una ventana privada.

**Lema:** *ASTRO-CARE: Can you go out today?*  
**Reto:** Create Health Monitoring Software for Astronauts on Space Missions

---

## Guion en inglés (narración y subtítulos), unas 75 palabras

| Tiempo | Qué se dice | Qué se ve |
|---|---|---|
| **0:00–0:02** | "Hi, I'm Boris, from team AstronautsCare, Barcelona." | Cara a cámara, o el nombre del equipo en pantalla |
| **0:02–0:05** | "Our challenge: health monitoring for astronauts. On the Moon, the nearest hospital is three days away." | Imagen de la Luna, con el texto "3 days from help" |
| **0:05–0:10** | "Meet ASTRO-CARE: can you go out today? One clear answer: GO or NO-GO." | Logo y lema; consola con el holograma en verde |
| **0:10–0:20** | "Wearable vitals feed a live hologram and score NEWS2 every second. A reaction test checks fatigue. Real NASA data, DONKI solar storms and OSDR crew records, shapes the verdict, fully offline." | Grabación de pantalla: tecla `2` → prueba → **NO-GO** → DONE → **GO** → tecla `S` → **NO-GO** |
| **0:20–0:30** | "Tomorrow, the same tool protects night-shift nurses, pilots and polar crews. Anyone facing a critical task gets a clear GO, and humans keep the final call." | Hospital, cabina de avión y Antártida; al final el logo con "ASTRO-CARE · GO / NO-GO" |

---

## Versión hablada en español (con los subtítulos en inglés de arriba)

> "Hola, soy Boris, del equipo AstronautsCare, Barcelona. Nuestro reto: crear software de monitorización de la salud para astronautas. En la Luna, el hospital más cercano está a tres días. Esto es ASTRO-CARE: ¿puedes salir hoy? Una respuesta clara: GO o NO-GO. Las constantes del wearable mueven un holograma en directo y calculan NEWS2 cada segundo. Una prueba de reacción mide la fatiga. Datos reales de la NASA (tormentas solares de DONKI y registros de tripulación de OSDR) deciden el veredicto, sin internet. Mañana, la misma herramienta protege a enfermeras de noche, pilotos y bases polares. Un GO claro antes de cada tarea crítica, y la decisión final sigue siendo humana."

En español se habla más despacio. Si pasa de 30 s, quitad "y bases polares" y "sin internet".

---

## Cómo grabar la parte de la demo (0:10–0:20)

1. `npm run dev` y abrid http://localhost:5173 en pantalla completa (F11).
2. Grabad la pantalla con la Xbox Game Bar (`Win + G`) o con OBS.
3. Pulsad `2` (deshidratado) → START TEST → haced la prueba **sin pulsar antes de tiempo** (las salidas en falso cuentan como errores) → **NO-GO** → **DONE** ×2 → **GO** → `S` → **NO-GO**.
4. Al montar, acelerad la prueba de reacción (×4) para que esa parte dure unos 10 s.
