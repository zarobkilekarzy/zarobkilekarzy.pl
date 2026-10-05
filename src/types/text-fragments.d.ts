// Typy do generatora linków Text Fragments z `text-fragments-polyfill` (Google
// Chrome Labs). Paczka jest w czystym JS, bez własnych deklaracji, a `strict`
// odrzuca import modułu bez typów. Opisujemy tylko to, czego używa
// `CytatLink.astro`. Kształt jest przepisany ze źródła:
// node_modules/text-fragments-polyfill/src/fragment-generation-utils.js

declare module 'text-fragments-polyfill/dist/fragment-generation-utils.js' {
  /** Składniki dyrektywy `text=[prefix-,]textStart[,textEnd][,-suffix]`. */
  export interface TextFragment {
    textStart: string;
    textEnd?: string;
    prefix?: string;
    suffix?: string;
  }

  export interface GenerateFragmentResult {
    /** Wartość z `GenerateFragmentStatus`: 0 = sukces. */
    status: number;
    fragment?: TextFragment;
  }

  export const GenerateFragmentStatus: {
    SUCCESS: 0;
    INVALID_SELECTION: 1;
    AMBIGUOUS: 2;
    TIMEOUT: 3;
    EXECUTION_FAILED: 4;
  };

  export function generateFragmentFromRange(range: Range, startTime?: number): GenerateFragmentResult;
  export function isValidRangeForFragmentGeneration(range: Range): boolean;
}
