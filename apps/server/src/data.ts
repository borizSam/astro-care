import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LabPanel, SolarParticleEvent, VitalsBaseline } from '@astro-care/engine';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');

export const TIMEPOINTS = ['L-92', 'L-44', 'L-3', 'R+1', 'R+45', 'R+82', 'R+194'] as const;

interface LabRow {
  analyte: string;
  value: number | null;
  min: number | null;
  max: number | null;
  units: string;
  subject: string;
  sex: string;
  timepoint: string;
}

function num(s: string | undefined): number | null {
  if (s === undefined || s === '' || s === 'NA') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** OSDR LSDS CSVs have no quoted fields, so a plain split is safe. */
function readLabCsv(file: string): LabRow[] {
  const text = readFileSync(join(DATA, 'osdr', file), 'utf8').replace(/^﻿/, '');
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const cols = header.split(',');
  const idx = (name: string) => cols.indexOf(name);
  const tpCol = idx('TEST_DATE') >= 0 ? idx('TEST_DATE') : idx('timepoint');
  return lines.map((l) => {
    const c = l.split(',');
    return {
      analyte: c[idx('ANALYTE')],
      value: num(c[idx('VALUE')]),
      min: num(c[idx('RANGE_MIN')]),
      max: num(c[idx('RANGE_MAX')]),
      units: c[idx('UNITS')],
      subject: c[idx('SUBJECT_ID')],
      sex: c[idx('SEX')],
      timepoint: c[tpCol],
    };
  });
}

const cbc = readLabCsv('OSD-569_LSDS-7_CBC.csv');
const cmp = readLabCsv('OSD-575_LSDS-8_CMP.csv');
const allLabs = [...cbc.map((r) => ({ ...r, panel: 'CBC' })), ...cmp.map((r) => ({ ...r, panel: 'CMP' }))];

export const OSDR_SOURCES = [
  { id: 'OSD-569', name: 'Inspiration4 whole blood: Complete Blood Count (LSDS-7)', url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-569' },
  { id: 'OSD-575', name: 'Inspiration4 serum: Comprehensive Metabolic Panel (LSDS-8)', url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-575' },
];

const KEY_ANALYTES = ['HEMOGLOBIN', 'HEMATOCRIT', 'WHITE BLOOD CELL COUNT', 'PLATELET COUNT', 'UREA NITROGEN (BUN)', 'CREATININE', 'SODIUM', 'POTASSIUM', 'GLUCOSE', 'ALBUMIN', 'CALCIUM'];

function baseAnalyte(a: string) {
  return a.replace(' (FEMALE)', '');
}

export function labsFor(subject: string, timepoint?: string) {
  const rows = allLabs.filter((r) => r.subject === subject && (!timepoint || r.timepoint === timepoint));
  return rows
    .filter((r) => KEY_ANALYTES.includes(baseAnalyte(r.analyte)) && r.value !== null)
    .map((r) => ({ ...r, analyte: baseAnalyte(r.analyte), outOfRange: (r.min !== null && r.value! < r.min) || (r.max !== null && r.value! > r.max) }));
}

/** Lab panel consumed by the engine (advice-only rules). */
export function labPanelFor(subject: string, timepoint: string): LabPanel {
  const rows = labsFor(subject, timepoint);
  const get = (a: string) => rows.find((r) => r.analyte === a);
  const hgb = get('HEMOGLOBIN');
  return {
    source: 'NASA OSDR OSD-569 / OSD-575 (Inspiration4)',
    timepoint,
    bun: get('UREA NITROGEN (BUN)')?.value ?? undefined,
    creatinine: get('CREATININE')?.value ?? undefined,
    hemoglobin: hgb?.value ?? undefined,
    hemoglobinMin: hgb?.min ?? undefined,
  };
}

interface CrewFile {
  crew: { id: string; role: string; guest?: boolean; baseline: VitalsBaseline; pvtBaselineMedianMs: number }[];
}
const crewFile: CrewFile = JSON.parse(readFileSync(join(DATA, 'crew.json'), 'utf8'));

export function crewList() {
  return crewFile.crew.map((c) => ({
    ...c,
    sex: cbc.find((r) => r.subject === c.id)?.sex ?? '?',
    labSource: 'NASA OSDR (Inspiration4)',
  }));
}

// ---------- DONKI ----------
interface DonkiSep {
  sepID: string;
  eventTime: string;
  instruments: { displayName: string }[];
  link: string;
}
interface DonkiGst {
  gstID: string;
  startTime: string;
  allKpIndex: { kpIndex: number; observedTime: string }[];
}
const sep: DonkiSep[] = JSON.parse(readFileSync(join(DATA, 'donki', 'sep-2024-05.json'), 'utf8'));
const gst: DonkiGst[] = JSON.parse(readFileSync(join(DATA, 'donki', 'gst-2024-05.json'), 'utf8'));

/** SEP considered "active" for 24 h after onset (⚠️ simplification, to validate). */
const SEP_ACTIVE_H = 24;

export function solarEventAt(iso: string): SolarParticleEvent | null {
  const t = new Date(iso).getTime();
  const active = sep
    .filter((e) => {
      const start = new Date(e.eventTime).getTime();
      return t >= start && t <= start + SEP_ACTIVE_H * 3600_000;
    })
    // prefer the highest-energy detection
    .sort((a, b) => Number(b.instruments[0].displayName.includes('>100')) - Number(a.instruments[0].displayName.includes('>100')));
  const e = active[0];
  return e ? { sepID: e.sepID, eventTime: e.eventTime, instrument: e.instruments[0].displayName } : null;
}

export function spaceWeatherSummary() {
  return {
    source: 'NASA DONKI (CCMC), api.nasa.gov',
    sep: sep.map((e) => ({ sepID: e.sepID, eventTime: e.eventTime, instrument: e.instruments[0].displayName, link: e.link })),
    gst: gst.map((g) => ({ gstID: g.gstID, startTime: g.startTime, kpMax: Math.max(...g.allKpIndex.map((k) => k.kpIndex)) })),
  };
}
