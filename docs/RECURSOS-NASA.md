# Recursos del reto y cómo los usa ASTRO-CARE

Resumen de los recursos oficiales del reto *Create Health Monitoring Software for Astronauts on Space Missions* (descargados el 15-nov-2026) y de qué parte de la app responde a cada uno. Sirve para la ronda de preguntas.

## Lo que pide el reto, y dónde está en la app
| El reto pide | En ASTRO-CARE |
|---|---|
| Herramienta visual para que el astronauta evalúe su salud y actúe | Veredicto GO / NO-GO con motivo y acción; botón HECHO que recalcula |
| «Una figura humana donde cada parte es clicable y muestra su función y estado» | Cuerpo 3D: cada zona abre qué hace, qué le pasa en el espacio, qué hacer, sus medidas de hoy y su semáforo |
| Indicadores: presión, pulso, temperatura, sueño… | NEWS2 automática (pulso, O₂, respiración, presión, temperatura, consciencia) + sueño, agua, comida |
| Gráficas dinámicas en el tiempo | Panel «Tendencia»: pulso, oxígeno y NEWS2 de los últimos 2 minutos, con la banda normal |
| Código de colores | Verde / ámbar / rojo en zonas, NEWS2, gráficas y veredicto |
| Avisar para medir o actuar como rutina | Chequeo antes de cada tarea crítica; «Rutina» de 6 hábitos |
| Gamificación | Rutina 6/6 y «Día completo» |
| No asumir que el astronauta sabe de medicina | Texto llano en cada zona y en cada aviso; tabla NEWS2 explicada |
| ¿Cuándo avisar a la tripulación o al médico de vuelo? | Bandas NEWS2: vigilar, avisar al médico, emergencia |
| Distintos entornos (nave, estación, rover, base) | El veredicto depende de la tarea: paseo lunar o laboratorio del hábitat |

## Los 5 peligros (NASA HRP) y qué hacemos con cada uno
| Peligro | Qué dice la NASA | En la app |
|---|---|---|
| Radiación espacial | Invisible; de lo más peligroso del vuelo | Tormenta solar real (DONKI) bloquea las tareas en superficie |
| Aislamiento y confinamiento | Afecta al comportamiento y al rendimiento | Sueño y prueba de reacción |
| Distancia a la Tierra | Ayuda médica y suministros cada vez más lejos | Funciona sin internet; decide con reglas locales |
| Gravedad | Músculos, huesos, oído interno y órganos se readaptan | Zonas de articulaciones y cabeza; presión antes del traje; ejercicio diario |
| Entorno cerrado y hostil | Temperatura, presión, microbios, respuesta inmune | Zona de piel (erupciones); oxígeno bajo dentro del traje |

## Riesgos HRP que cita la app
Respuesta inmunitaria alterada · función sensoriomotora · adaptaciones cardiovasculares · enfermedad por descompresión · hipoxia · alimentación y nutrición inadecuadas · lesiones y rendimiento en paseos espaciales · forma física reducida · SANS (ojos) · cambios óseos · sueño insuficiente.

## Criterios del jurado
Los criterios de Space Apps en ediciones anteriores son **impacto, creatividad, validez, relevancia y presentación**. No pudimos descargar la página de 2026: confirmadlos en la web del evento.

| Criterio | Nuestro argumento |
|---|---|
| Impacto | Evita salir a una tarea de 6–8 h en mal estado; también sirve a sanitarios y pilotos |
| Creatividad | Una sola respuesta en vez de un panel de números; el cuerpo 3D reacciona a las constantes |
| Validez | NEWS2 y PVT-B son métodos publicados; 13 tests del motor; se dice qué es simulado |
| Relevancia | Responde punto por punto al enunciado (tabla de arriba) |
| Presentación | Historia de 3 pasos: NO-GO, GO, tormenta |

## Fuentes
- NASA HRP, 5 Hazards of Human Spaceflight: https://www.nasa.gov/hrp/hazards/
- NASA HRP, Risks of Human Spaceflight: https://www.nasa.gov/hrp/risks/
- Vídeo del reto (3 min; repite el enunciado): https://www.youtube.com/watch?v=RERG3gEmdC8
- CSA, radiación y salud del astronauta: enlace desde la pestaña Resources del reto (no usamos datos de la CSA)
