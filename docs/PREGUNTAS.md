# Ronda de preguntas: respuestas preparadas

Respuestas cortas (15–20 s). Cuando la respuesta depende de vuestra situación, hay una opción para cada caso: **elegid la que sea verdad**.

**Quién responde:**

| Tipo de pregunta | Responde |
|---|---|
| Clínica, NEWS2, síntomas | **Enfermera** |
| App, datos, arquitectura | **Boris** |
| Misión, Luna, tareas, radiación | **Ingeniero aeroespacial** |

**Regla de oro:** si no sabes algo, dilo: "No lo hemos validado todavía; sería el siguiente paso". La honestidad puntúa más que inventar.

---

## 1. Clínicas

**¿Por qué NEWS2 y no otra escala?**
Es la escala de alerta temprana más usada en hospitales del Reino Unido y de muchos otros países, está validada y es sencilla: seis constantes, y cada una suma de 0 a 3 puntos. Un astronauta no es médico: necesita algo simple y probado, no una escala que solo entienda un especialista.

**NEWS2 es para pacientes de hospital, no para astronautas sanos. ¿Es válida?**
NEWS2 detecta deterioro agudo, que es justo lo que buscamos antes de una tarea peligrosa. Para personas sanas añadimos una comparación con **sus propios valores normales**: avisamos si el pulso sube 20 por encima de lo habitual, aunque NEWS2 siga en 0. Adaptarla del todo al vuelo espacial requeriría validación con médicos de vuelo; es el siguiente paso.

**¿Quién ha validado los umbrales?**
- *Si la enfermera los ha revisado:* "Los ha revisado nuestra enfermera, [nombre], con su experiencia en [servicio/hospital]. Son un punto de partida razonable, no un dispositivo médico certificado."
- *Si todavía no:* "Son propuestas basadas en la literatura: NEWS2 y PVT-B. Están marcados en el código para que los revise un profesional; es lo primero que haríamos."

**¿Es un dispositivo médico?**
No. Es **apoyo a la decisión**: no diagnostica ni trata. La decisión final es del comandante o del médico de vuelo, y así lo dice cada veredicto. Para usarlo de verdad habría que certificarlo.

**¿Y si el astronauta miente o no marca sus síntomas?**
La mayoría de los datos no dependen de él: las constantes vienen de sensores, y la prueba de reacción no se puede hacer mejor de lo que estás. La consciencia la evalúa un compañero. Los síntomas sí dependen de él, y por eso no son la única fuente.

**¿Cómo detectáis la confusión?**
No con la prueba de reacción: ir lento indica fatiga, no confusión. La consciencia la marca un **compañero** con la escala ACVPU (alerta, confusión, responde a la voz, al dolor o no responde), porque quien está confuso no se da cuenta.

**¿Por qué la hidratación da NO-GO?**
Porque en un paseo lunar pasas de 6 a 8 horas dentro del traje, sin poder beber con normalidad ni ir al baño. La deshidratación baja la presión y causa mareo y errores. Es un NO-GO que se corrige en el momento: bebes, pulsas HECHO, y se recalcula.

**¿Qué síntomas tenéis y por qué esos?**
Los ligados a riesgos que la NASA reconoce:
- **cabeza:** dolor, mareo y confusión, por CO₂ o falta de oxígeno;
- **ojos:** visión borrosa de cerca, por SANS, el síndrome ocular del vuelo espacial;
- **pecho:** dolor, falta de aire y palpitaciones;
- **articulaciones:** dolor y hormigueo, por enfermedad descompresiva;
- **piel:** erupción, por reactivación de virus.

Un síntoma grave bloquea cualquier tarea; uno moderado bloquea el paseo lunar.

**¿Cuántos falsos positivos (NO-GO injustos) da?**
- *Honesto:* "No lo hemos medido: haría falta un estudio con personas reales. Hemos diseñado las reglas para que, ante la duda, sea preferible un NO-GO a un GO peligroso, y siempre explica el motivo para que el humano lo valore."

---

## 2. Prueba de reacción (PVT)

**¿30 segundos son suficientes?**
No para un diagnóstico. La versión validada (**PVT-B**) dura **3 minutos**, y es la que usaríamos en la misión. En la demo la acortamos a 30 segundos para que el jurado pueda probarla. Lo pone en la propia pantalla.

**¿Por qué mide la fatiga?**
Es el test de referencia en investigación del sueño: con fatiga aumentan el tiempo de reacción y los **lapsus**, respuestas de más de 355 ms. La NASA ha usado una versión de 3 minutos en la Estación Espacial Internacional.

**¿Y si alguien es lento por naturaleza?**
No comparamos con la población, sino con **su propio valor normal**. Da NO-GO quien está más lento que él mismo: más de un 15 % para un paseo lunar y un 30 % para el laboratorio.

**¿Y si un juez saca NO-GO en la prueba del QR?**
Es justamente lo interesante: la prueba ha detectado que reacciona más lento que la referencia. Explicad que el perfil del jurado usa un valor de referencia típico (unos 330 ms), no el suyo propio, y que con su referencia personal el resultado sería más justo.

**¿Se puede hacer trampa pulsando antes de tiempo?**
No: si pulsas antes de que aparezca la señal, o en menos de 100 ms, cuenta como **salida en falso**. Y si no respondes en 5 segundos, cuenta como lapsus.

---

## 3. Datos

**¿Qué datos de la NASA usáis?**
Tres fuentes:
- **DONKI:** la tormenta solar real del 11 de mayo de 2024 (partículas de más de 100 MeV, Kp 9).
- **OSDR:** análisis de sangre reales de la tripulación de Inspiration4 (estudios OSD-569 y OSD-575).
- **Human Research Program:** los riesgos que cita cada regla.

**¿Las constantes son reales?**
No: son **simuladas**, y lo decimos claramente. OSDR no tiene datos de pulsera de estos astronautas; lo comprobamos. El simulador está aislado en un solo archivo, así que en la misión se sustituye por la pulsera o los sensores del traje sin tocar nada más. La NASA ya usa una pulsera de actividad (ARCHeR) en Artemis II.

**¿Para qué sirven los análisis de OSDR si no deciden el veredicto?**
Identifican a la tripulación y dan valores de referencia reales. No los usamos para el veredicto de hoy porque son de antes y después de un vuelo de 2021, no de hoy: usarlos para decidir sería engañoso.

**¿Por qué la tormenta solar da NO-GO aunque el astronauta esté sano?**
La Luna no tiene campo magnético ni atmósfera: las partículas solares llegan directamente. Estar sano no es lo mismo que estar seguro. Dentro del hábitat protegido, la tarea de laboratorio sigue siendo GO.

**¿Por qué una tormenta de 2024 y no una de hoy?**
Para la demo usamos un evento real y conocido, guardado en local para no depender de internet. La app consulta el evento activo en cada momento: con conexión a DONKI usaría el clima espacial actual.

**¿Qué es Kp 9?**
El nivel máximo de la escala de tormentas geomagnéticas. La del 10 y 11 de mayo de 2024 fue la más fuerte en unos 20 años: hubo auroras visibles incluso en España.

---

## 4. Técnicas

**¿Funciona sin internet?**
Sí. Corre en un ordenador del hábitat y las tablets se conectan por la red local. Los datos de la NASA están descargados y guardados en el proyecto, y las fuentes y el modelo 3D también van incluidos.

**¿Usáis inteligencia artificial?**
**No para decidir.** Son reglas clínicas transparentes: se ve por qué sale cada NO-GO, y en un tema de salud eso es intencionado. Sí usamos asistentes de IA para programar y documentar más rápido, y lo declaramos en la página del proyecto, como piden las normas.

**¿Cuál es la arquitectura?**
Un monorepo con tres partes:
- un **motor clínico** en TypeScript con tests automáticos;
- un **servidor** Node (Fastify) que simula la telemetría y la envía en directo cada segundo;
- una **web** en React con three.js para el holograma.

**¿Cuánto habéis programado durante el hackathon?**
Todo el código se ha escrito durante el evento, en un repositorio creado para ello.

**¿Cómo escala a más tripulantes o a Marte?**
La vista de tripulación ya maneja varios tripulantes. Para Marte, el cambio clave es el retraso de comunicación, de hasta unos 20 minutos por trayecto: es todavía más motivo para decidir a bordo sin esperar a la Tierra.

**¿Y la privacidad de los datos médicos?**
Los datos no salen del hábitat: no hay nube. En una versión real añadiríamos acceso con credenciales y registro de quién ve qué, como en un hospital.

**¿Qué pasa si se cae el servidor o un sensor?**
La consola muestra "SIN SEÑAL" en vez de valores falsos. Sin datos fiables, no hay GO automático: se recurre al médico o al comandante.

**¿De dónde sale el modelo 3D?**
- *Si lo creasteis vosotros:* "Lo modelamos nosotros para el proyecto, a partir de [herramienta/base]."
- *Si es de una web con licencia libre:* "Es un modelo de [autor], de [Sketchfab/otra web], con licencia [CC BY / la que sea]; está citado en el README."
- *Si no estáis seguros:* "Es un modelo anatómico de referencia; antes de publicar verificaremos la licencia y lo citaremos." **Mejor comprobadlo antes del evento.**

---

## 5. Producto e impacto

**¿Quién decide al final?**
El comandante o el médico de vuelo. ASTRO-CARE es **apoyo a la decisión**, no sustituye a nadie, y lo pone en cada veredicto.

**¿Qué pasa si da un falso NO-GO?**
Es preferible a un falso GO en un paseo lunar. Muchos NO-GO se corrigen al momento (beber, ir al baño), y el veredicto siempre explica el motivo, así que el humano puede valorarlo y decidir.

**¿Qué lo diferencia de un smartwatch?**
Un reloj muestra datos; ASTRO-CARE **decide para una tarea concreta**. El mismo cansancio es GO para el laboratorio y NO-GO para un paseo lunar. Además tiene en cuenta el entorno (clima espacial) y lo que no mide un reloj (síntomas, hidratación, consciencia).

**¿Por qué la Luna y no Marte?**
Porque es la misión actual de la NASA, Artemis, y los recursos del reto se centran en ella. Lo que funciona en la Luna, con 3 días hasta casa, es aún más necesario en Marte, donde el viaje dura meses.

**¿Uso en la Tierra?**
Personal sanitario tras turnos de noche, pilotos y controladores aéreos, bases aisladas como la Antártida o plataformas petrolíferas: cualquier trabajo donde la fatiga es peligrosa y nadie te evalúa antes de empezar.

**¿Cuánto costaría?**
El software es gratuito de desplegar: funciona en cualquier ordenador con navegador. El coste real sería el sensor (una pulsera de unos 100–300 €) y la validación clínica.

**¿Siguientes pasos?**
1. Conectar una pulsera real.
2. Validar los umbrales con profesionales sanitarios.
3. Usar la prueba de reacción de 3 minutos.
4. Probarlo en un análogo: una base remota o una simulación de misión.

**¿Ya existe algo así en la NASA?**
La NASA mide la salud de la tripulación con muchas herramientas (ARCHeR en Artemis II, pruebas de reacción en la Estación Espacial), pero suelen enviar los datos a médicos en la Tierra. Nuestra propuesta es que la **decisión GO / NO-GO se tome a bordo**, en el momento, sin depender de la comunicación.

---

## 6. Equipo

**¿Qué ha hecho cada uno?**
- **Enfermera:** reglas clínicas, síntomas y textos de "qué hacer".
- **Ingeniero aeroespacial:** tareas de la misión, umbrales de cada tarea y clima espacial.
- **Boris (DevOps):** la app, el servidor y el despliegue.

**¿Qué ha sido lo más difícil?**
- *Opción técnica:* "Que el holograma reaccione en tiempo real a las constantes sin ralentizar la consola."
- *Opción de producto:* "Decidir qué quitar: teníamos muchas ideas, y lo difícil fue quedarnos con una sola pregunta, GO o NO-GO."

**¿Qué haríais con más tiempo?**
Conectar una pulsera real y probarlo con personal sanitario tras un turno de noche, para medir si detecta la fatiga de verdad.

---

## 7. Preguntas difíciles (llevadlas ensayadas)

**"¿No es una demo bonita con datos inventados?"**
La interfaz es bonita, pero detrás hay un motor clínico con tests, una escala hospitalaria real y datos reales de la NASA. Lo único simulado son las constantes en directo, porque no tenemos una pulsera de astronauta, y por eso el simulador está separado: es lo primero que se sustituye.

**"¿Por qué confiaría un astronauta en esto?"**
Porque le explica **por qué**: no es una caja negra. Y porque no le quita la decisión, le da información para tomarla.

**"¿Habéis hablado con algún astronauta o médico de vuelo?"**
- *Si sí:* "Sí, con [persona/rol]. Nos dijo [lo que aportó], y por eso [cambio que hicisteis]."
- *Si no:* "Todavía no; es el siguiente paso. Nuestra enfermera aporta la experiencia real de evaluar a personas tras turnos largos, que es el caso más parecido en la Tierra."

**"¿Qué pasa si el sistema se equivoca y alguien sale a un paseo lunar enfermo?"**
Por eso no es autónomo: es una segunda opinión que se suma al criterio del comandante y del médico de vuelo, no lo sustituye. Y siempre muestra por qué ha decidido, para que se pueda contrastar.

**"Esto ya lo hace un médico por videollamada."**
En la Luna, sí, con unos segundos de retraso y si hay cobertura. En Marte, con hasta 20 minutos de retraso, ya no. Y aunque haya conexión, ASTRO-CARE da la respuesta en 5 minutos, antes de cada tarea, sin ocupar al médico.

**"¿Por qué el avatar tiene cuatro colores si el veredicto es binario?"**
El avatar muestra el **estado general del día** (normal, riesgo bajo, medio o alto, según NEWS2). El veredicto es la **decisión para una tarea concreta**: o sales o no sales. Son dos preguntas distintas.
