/**
 * Rejestr zestawów map. Komponent PolandMap i grafiki do pobrania biorą warstwy stąd po id,
 * więc tę samą mapę można postawić na dowolnej stronie (`<PolandMap set="monitoring" />`, także
 * z wybranymi warstwami) i wygenerować jako obraz.
 *
 * Nowy temat: funkcja budująca warstwy (kontrakt w ./types) i wpis poniżej.
 */
import { monitoringMap } from '@/lib/monitoring/map';
import { sorMap } from '@/lib/sor/map';
import type { MapSet } from './types';

export const mapSets = {
  monitoring: monitoringMap,
  sor: sorMap,
} satisfies Record<string, MapSet>;

export type MapSetId = keyof typeof mapSets;
