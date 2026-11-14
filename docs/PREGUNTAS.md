# Ronda de preguntas: respuestas preparadas

Respuestas cortas (15–20 s). Si una pregunta es clínica, responde la **enfermera**; si es técnica, **Boris**; si es de misión, el **ingeniero aeroespacial**. Regla de oro: **si no sabes algo, dilo** ("no lo hemos validado todavía, sería el siguiente paso"). La honestidad puntúa más que inventar.

---

## Clínicas
**¿Por qué NEWS2 y no otra escala?**
Porque es la escala de alerta temprana más usada en hospitales, está validada y es sencilla: seis constantes, cada una suma de 0 a 3. Un astronauta no es médico, y necesita algo simple y probado.

**NEWS2 está pensada para pacientes de hospital, no para astronautas sanos. ¿Es válida?**
Es una buena pregunta. NEWS2 detecta deterioro agudo, que es justo lo que buscamos. Para un astronauta sano, además comparamos con **sus propios valores normales**; por ejemplo, avisamos si el pulso sube 20 por encima de lo habitual. Adaptarla del todo a vuelo espacial sería un trabajo de validación con la NASA.

**¿Quién ha validado los umbrales?**
Los ha revisado nuestra enfermera, [nombre]. Son un punto de partida razonable, no un dispositivo médico certificado. Están en el código, marcados para revisarse.

**¿Y si el astronauta miente o no marca sus síntomas?**
Por eso la mayoría de los datos no dependen de él: las constantes vienen de sensores y la prueba de reacción no se puede fingir hacia arriba. Y la consciencia la evalúa un compañero, no él mismo.

**¿Cómo detectáis la confusión?**
No con la prueba de reacción: ir lento indica fatiga, no confusión. La consciencia (escala ACVPU) la marca un compañero, porque quien está confuso no se da cuenta.

---

## Prueba de reacción (PVT)
**¿30 segundos son suficientes?**
No para un diagnóstico. La versión validada (PVT-B) dura **3 minutos** y es la que usaríamos en la misión. En la demo la acortamos para que el jurado pueda probarla.

**¿Por qué la prueba de reacción mide fatiga?**
Es el test de referencia en investigación del sueño: con fatiga aumentan el tiempo de reacción y los lapsus (respuestas de más de 355 ms). La NASA usa una versión de 3 minutos en la Estación Espacial.

**¿Y si alguien simplemente es lento?**
Por eso no comparamos con la población, sino con **su propio valor normal**. Un tripulante lento por naturaleza no da NO-GO; da NO-GO quien está más lento que él mismo.

---

## Datos
**¿Qué datos de la NASA usáis?**
Tres fuentes:
- **DONKI:** la tormenta solar real del 11 de mayo de 2024, con partículas de más de 100 MeV.
- **OSDR:** análisis de sangre reales de la tripulación de Inspiration4.
- **Human Research Program:** los riesgos que cita cada regla.

**¿Las constantes son reales?**
No: son **simuladas**, y lo decimos claramente. OSDR no tiene datos de pulsera de estos astronautas. El simulador está en un solo archivo; en la misión se sustituye por la pulsera o los sensores del traje sin tocar el resto. La NASA ya usa una pulsera de actividad (ARCHeR) en Artemis II.

**¿Para qué sirven los análisis de OSDR si no deciden el veredicto?**
Identifican a la tripulación y dan valores de referencia reales. No los usamos para el veredicto de hoy porque son de antes y después de un vuelo, no de hoy: sería engañoso.

**¿Por qué la tormenta solar da NO-GO aunque el astronauta esté sano?**
Porque la Luna no tiene campo magnético ni atmósfera: las partículas solares llegan directamente. Estar sano no significa estar seguro. En el laboratorio, dentro del hábitat protegido, da GO.

---

## Técnicas
**¿Funciona sin internet?**
Sí. Corre en un ordenador del hábitat y las tablets se conectan por la red local. Los datos de la NASA están descargados y guardados en el proyecto.

**¿Usáis inteligencia artificial?**
**No para decidir.** Son reglas clínicas transparentes: se puede ver por qué sale cada NO-GO. En un tema de salud, esto es intencionado. Sí usamos asistentes de IA para programar más rápido, y lo declaramos en la página del proyecto.

**¿Cuál es la arquitectura?**
Un monorepo: un motor clínico en TypeScript con tests, un servidor Node que simula la telemetría y la envía en directo, y una web en React con three.js para el holograma.

**¿Cómo escala a una tripulación más grande o a Marte?**
La vista de tripulación ya maneja varios tripulantes. Para Marte el cambio clave sería un retraso de comunicación de hasta 20 minutos: aún más motivo para que la decisión se tome a bordo.

**¿De dónde sale el modelo 3D?**
*(Completar con el autor y la licencia antes del evento.)*

---

## Producto e impacto
**¿Quién decide al final?**
El comandante o el médico de vuelo. ASTRO-CARE es **apoyo a la decisión**, no sustituye a nadie. Lo pone en cada veredicto.

**¿Qué pasa si da un falso NO-GO?**
Es preferible a un falso GO en un paseo lunar. Además, muchos NO-GO se corrigen al momento (beber, ir al baño) y el veredicto explica siempre el motivo, así que el humano puede valorarlo.

**¿Qué lo diferencia de un smartwatch?**
Un reloj muestra datos; ASTRO-CARE **decide para una tarea concreta**. El mismo cansancio es GO para el laboratorio y NO-GO para un paseo lunar. Y además tiene en cuenta el entorno (clima espacial).

**¿Uso en la Tierra?**
Personal sanitario tras turnos de noche, pilotos y controladores aéreos, bases aisladas como la Antártida. Cualquier trabajo donde la fatiga es peligrosa y no hay nadie que te evalúe.

**¿Siguientes pasos?**
1. Conectar una pulsera real.
2. Validar los umbrales con profesionales.
3. Usar la prueba de reacción de 3 minutos.
4. Probarlo en un análogo, como una base o una simulación de misión.

---

## Preguntas difíciles (que conviene llevar ensayadas)
**"¿Esto no es una demo bonita con datos inventados?"**
La interfaz es bonita, pero detrás hay un motor clínico con tests, una escala hospitalaria real y datos reales de la NASA. Lo único simulado son las constantes en directo, porque no tenemos una pulsera de astronauta. Por eso hemos separado el simulador: es lo primero que se sustituye.

**"¿Por qué confiaría un astronauta en esto?"**
Porque le explica **por qué**: no es una caja negra. Y porque no le quita la decisión, le da información para tomarla.

**"¿Habéis hablado con algún astronauta o médico de vuelo?"**
Si no: no todavía. Es el siguiente paso, y nuestra enfermera aporta la experiencia clínica real de evaluar a personas tras turnos largos.
