/**
 * Schemat danych „Konstelacji ochrony zdrowia” — ten sam co `research/powiazania/graf.json`
 * (źródło prawdy; kopia w src/data/konstelacja/graf.json). Kryteria i znaczenie pól: research/powiazania/ZASADY.md.
 */

export type NodeType = 'person' | 'institution' | 'body' | 'act' | 'entity';
export type EdgeKind = 'part' | 'role' | 'vote' | 'bill' | 'family' | 'work' | 'contact' | 'context' | 'contract' | 'overlap';
export type Status = 'record' | 'confirmed' | 'media' | 'disputed';
export type Vote = 'YES' | 'NO' | 'ABSTAIN' | 'ABSENT';

export interface Party {
  name: string;
  note?: string;
  sources?: string[];
  former?: boolean;
  until?: string;
}

/** Fakt o osobie bez węzła po drugiej stronie (praca, mandat radnego, rada nadzorcza) */
export interface Role {
  label: string;
  status?: Status;
  sources?: string[];
  date?: string;
  since?: string;
  until?: string;
  kind?: EdgeKind;
}

/** Zarzut karny — zawsze „nie udowodniony fakt” */
export interface Charge {
  label: string;
  date: string;
  by: string;
  sources?: string[];
}

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  short?: string;
  note?: string;
  parent?: string;
  roles?: Role[];
  party?: Party;
  charges?: Charge[];
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  label: string;
  status?: Status;
  sources?: string[];
  date?: string;
  since?: string;
  until?: string;
  /** ostatni dokument potwierdzający funkcję, gdy dnia odejścia nie znamy */
  seen?: string;
  vote?: Vote;
  /** mały organ, w którym liczą się wspólne okresy (okresy.ts) */
  team?: string;
  /** krawędź wyliczona (wspólny okres), nie wpisana */
  derived?: boolean;
}

export interface Source {
  title: string;
  publisher: string;
  date?: string;
  url: string;
}

/** Fakt widoku: krawędź (from, to, opcjonalnie kind), zarzut (charge) albo opis funkcji z roles[] (roleOf + contains) */
export interface ViewFact {
  from?: string;
  to?: string;
  kind?: EdgeKind;
  charge?: string;
  roleOf?: string;
  contains?: string;
}

export interface View {
  id: string;
  title: string;
  lead: string;
  nodes: string[];
  facts: ViewFact[];
}

export interface GraphData {
  asOf: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  sources: Record<string, Source>;
  views: View[];
}
