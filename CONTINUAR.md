# Para continuar mañana

## Levantar el proyecto
```bash
cd ~/NASA/astro-care
git switch develop        # todo el trabajo está aquí (main solo tiene el commit inicial)
npm install               # solo si es otro ordenador o se borró node_modules
npm run dev               # servidor :3001 + web → abre la URL que imprime Vite (5173 o 5174)
npm test                  # 13 tests del motor clínico
```

**Controles ocultos para quien presenta:**
- `D`: panel de demo;
- `1`–`4`: perfiles (rested, dehydrated, fatigued, hypoxic);
- `S`: tormenta solar.

**Historia del pitch (3 min):** `2` → prueba de reacción → NO-GO → DONE ×2 → GO → `S` → NO-GO → tocar el abdomen.

## Estado al cerrar (15-nov-2026)
- **App:** consola médica completa, holograma 3D, NEWS2 automático con tabla, prueba de reacción, GO / NO-GO con DONE, tabla NEWS2 en directo y estado de tripulación (sin QR). Toda en inglés. Nuevo: cada zona del cuerpo explica qué hace, qué le pasa en el espacio y qué hacer, con su semáforo; gráfica de tendencia de 2 min; rutina de 6 hábitos. Toda en español.
- **Documentos:** presentación y guion de 3 minutos, y resumen de recursos del reto, en [`docs/`](docs/README.md).

## Pendiente
1. ~~**QR desde el móvil**~~: quitado de la consola (la página `?live` sigue existiendo).
2. **GitHub público** y página del proyecto en Space Apps, declarando el uso de IA.
3. **Créditos del modelo 3D** (`apps/web/public/models/circulatory.glb`): autor y licencia.
4. **Validación:** la enfermera y el ingeniero revisan los umbrales ⚠️ de `packages/engine/src/`, y se rellena el nombre de la enfermera en `docs/PREGUNTAS.md`.
5. **Vídeo de 30 s** subtitulado en inglés, vídeo de respaldo de la demo y **5 ensayos** del pitch.
6. *(Opcional)* Pulsómetro Bluetooth real e instalar la app sin conexión (PWA).
