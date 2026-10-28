---
title: Symulator podaży lekarzy 1987–2050
category: Narzędzie
topic: ksztalcenie
order: 5
stat: { value: "164 892", unit: lekarzy w rejestrze na start modelu }
summary: Zmieniaj limity przyjęć na studia i zobacz, ilu lekarzy będzie praktykować za 10, 20 i 30 lat.
# osobna trasa src/pages/analizy/symulator-podazy-lekarzy.astro — wpis zostaje bez treści
href: /analizy/symulator-podazy-lekarzy/
date: 2026-09-01
# 16.10.2026: limity z LIMITS (wersje końcowe rozporządzeń), limit dziś 2026/27
# 16.10.2026: zgony wg tablic GUS 2025, grupa 71+ ubywa tylko przez zgony, warianty NIL dosłownie
changelog:
  - date: 2026-10-16
    text: "Model przeliczony: limity przyjęć według ostatecznych wersji rozporządzeń i z limitem na 2026/27, zgony według tablic GUS, lekarze po 70. roku życia ubywają tylko przez zgony, a warianty zespołu NIL bez przeliczania na dzisiejszy limit. Przy naborze jak dziś w 2050 r. wychodzi ok. **249,8 tys.** lekarzy (wcześniej 253,7 tys.), a w wariancie A — ok. 188,3 tys. (wcześniej 201,0 tys.)."
    correction: true
  - date: 2026-10-05
    text: "Dodane losy rocznika: model odejmuje odsiew na studiach (kończy 80% przyjętych) i wyjazdy (5% absolwentów) oraz dolicza ok. 1000 lekarzy z dyplomem zagranicznym rocznie — wartości z analizy o odsiewie, zmieniane suwakami. Wcześniej model zakładał, że studia kończą wszyscy przyjęci; przy naborze jak dziś wynik na 2050 r. spadł z ok. 277,9 tys. do 253,7 tys. lekarzy."
---
