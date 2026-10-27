/**
 * Wersja angielska modułu src/data/narzedzia.ts: kafle narzędzi w hubach /en/data/ i /en/mechanisms/.
 * Zostają tylko kafle, które mają sens dla czytelnika EN: mapa kolejek na SOR (strona EN) i przeglądarka
 * monitoringu (tylko po polsku — przycisk z „(in Polish)”). Bez symulatorów, egzaminu LEK, barometru
 * i infografik do udostępnienia — to strony i grafiki tylko po polsku. Hub bez kafli nie ma sekcji „Tools”.
 */
import type { ToolTile } from '@/types';
import type { hubTiles as hubTilesPl } from '@/data/narzedzia';
import { page as sorPage } from '@/data/en/kolejki-sor';
import { monitoring } from '@/lib/monitoring';
import { formatEN } from '@/lib/format';

const facilities = monitoring.facilities.length;

const monitoringTile: ToolTile = {
  label: 'Monitoring',
  title: 'Doctors’ pay monitoring',
  desc: `${formatEN(facilities)} public ${facilities === 1 ? 'facility' : 'facilities'}. Who disclosed data on doctors’ pay, who refused, who stayed silent.`,
  links: [{ label: 'Open the browser (in Polish)', href: '/dane/monitoring-watchdog/' }],
  pictogram: 'szpital',
};

const sor: ToolTile = {
  label: 'Live',
  title: sorPage.title,
  desc: sorPage.description,
  links: [{ label: 'See the map', href: '/en/patient-rights/emergency-department/' }],
  pictogram: 'kolejka',
};

/** Zestawy kafli hubów (te same klucze co w PL); kolor kafla wynika z pozycji (blocks/ToolTiles). */
export const hubTiles: Record<keyof typeof hubTilesPl, ToolTile[]> = {
  dane: [monitoringTile, sor],
  analizy: [],
  mechanizmy: [sor],
};
