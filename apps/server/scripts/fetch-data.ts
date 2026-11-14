/**
 * Downloads the real NASA data used by ASTRO-CARE into apps/server/data/.
 * Run once with internet (`npm run fetch:data`); the app then works fully offline.
 *
 * Sources:
 *  - NASA OSDR OSD-569 (Inspiration4 whole blood, LSDS-7 Complete Blood Count)
 *  - NASA OSDR OSD-575 (Inspiration4 serum, LSDS-8 Comprehensive Metabolic Panel)
 *  - NASA DONKI (CCMC) via api.nasa.gov: SEP and GST events, May 2024 storm
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const OSDR = 'https://osdr.nasa.gov/geode-py/ws/studies';
const KEY = process.env.NASA_API_KEY ?? 'DEMO_KEY';

const files: { url: string; out: string }[] = [
  { url: `${OSDR}/OSD-569/download?source=datamanager&file=LSDS-7_Complete_Blood_Count_CBC.upload_SUBMITTED.csv`, out: 'osdr/OSD-569_LSDS-7_CBC.csv' },
  { url: `${OSDR}/OSD-575/download?source=datamanager&file=LSDS-8_Comprehensive_Metabolic_Panel_CMP.upload_SUBMITTED.csv`, out: 'osdr/OSD-575_LSDS-8_CMP.csv' },
  { url: `https://api.nasa.gov/DONKI/SEP?startDate=2024-05-01&endDate=2024-05-31&api_key=${KEY}`, out: 'donki/sep-2024-05.json' },
  { url: `https://api.nasa.gov/DONKI/GST?startDate=2024-05-08&endDate=2024-05-15&api_key=${KEY}`, out: 'donki/gst-2024-05.json' },
];

for (const f of files) {
  const res = await fetch(f.url);
  if (!res.ok) throw new Error(`${res.status} ${f.url}`);
  const path = join(DATA, f.out);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, Buffer.from(await res.arrayBuffer()));
  console.log('saved', f.out);
}
