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

**Historia del pitch:** `2` → prueba de reacción → NO-GO → DONE ×2 → GO → `S` → NO-GO.

## Estado al cerrar (14-nov-2026)
- **App:** consola médica completa, holograma 3D, NEWS2 automático con tabla, prueba de reacción, GO / NO-GO con DONE, QR para el jurado y estado de tripulación. Toda en inglés (requisito de la entrega).
- **Documentos:** presentación y guiones en [`docs/`](docs/README.md).

## Pendiente
1. **QR desde el móvil:** ahora apunta a la IP interna de WSL. Hay que desplegarlo o arrancar con `PUBLIC_URL=http://<IP-de-Windows>:5174 npm run dev` y redirigir el puerto en Windows.
2. **GitHub público** y página del proyecto en Space Apps, declarando el uso de IA.
3. **Créditos del modelo 3D** (`apps/web/public/models/circulatory.glb`): autor y licencia.
4. **Validación:** la enfermera y el ingeniero revisan los umbrales ⚠️ de `packages/engine/src/`, y se rellena el nombre de la enfermera en `docs/PREGUNTAS.md`.
5. **Vídeo de 30 s** subtitulado en inglés, vídeo de respaldo de la demo y **5 ensayos** del pitch.
6. *(Opcional)* Pulsómetro Bluetooth real e instalar la app sin conexión (PWA).
