import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** QR that opens the live PVT on a phone (same network). Generated offline. */
export function QrCard({ url }: { url: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [url]);

  return (
    <aside className="flex w-44 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl bg-white p-3 text-center text-black" aria-label="Escanea para hacer la prueba de reacción en tu móvil">
      <div className="h-28 w-28 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="hud-title text-lg leading-none tracking-tight">Pruébalo tú</div>
      <div className="font-mono text-[10px] leading-tight text-stone-600">Escanea y mide tu fatiga en 30 s</div>
    </aside>
  );
}
