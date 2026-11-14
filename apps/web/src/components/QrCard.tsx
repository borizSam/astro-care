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
    <aside className="flex items-center gap-4 rounded-xl border-4 border-white bg-white p-3 text-black" aria-label="Scan to start the live test">
      <div className="h-28 w-28 shrink-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="min-w-0">
        <div className="hud-title text-4xl leading-[0.95] tracking-tight">Scan to start<br />live test</div>
        <div className="mt-1 text-lg font-semibold">Assess your fatigue now.</div>
        <div className="truncate font-mono text-[10px] text-stone-500">{url}</div>
      </div>
    </aside>
  );
}
