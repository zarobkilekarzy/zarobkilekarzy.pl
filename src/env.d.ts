declare namespace App {
  interface Locals {
    /** adresy, których zapowiedź (dane dymka) jest już zapisana na tej stronie — article/ProseLink, raz na adres */
    peeked?: Set<string>;
  }
}
