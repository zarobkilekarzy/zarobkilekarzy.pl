Flagi krajów dla `ui/CountryFlag` — proporcje 4:3, nazwa pliku = kod ISO 3166-1 alfa-2 (Unia: `eu`).

Pliki pochodzą z pakietu flag-icons 7.6.0 (https://github.com/lipis/flag-icons), licencja MIT,
Copyright (c) 2013 Panayiotis Lipiridis. Wyjątek: `es.svg` to flaga Hiszpanii bez herbu (same pasy, barwy
z pakietu) — pełna wersja z herbem waży ok. 80 KB, a w rozmiarze ikony herbu i tak nie widać.

Nowy kraj: skopiuj plik `flags/4x3/<kod>.svg` z pakietu. Flaga ma zostać mała (do kilku KB), bo komponent
wstawia ją do HTML jako adres `data:`; ciężką flagę z herbem uprość albo zostaw same pasy.
