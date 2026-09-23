# Home Alone – Steen voor Steen

Een fan-game in bouwsteen-stijl, gebaseerd op de eerste *Home Alone* (1990).
Kevin is alleen thuis. Om 21:00 uur breken de **Natte Bandieten** Harry en Marv in.
Bouw vallen, verzamel noppen en verdedig het huis.

Er is geen build-stap: gewoon HTML5-canvas en JavaScript.

## Spelen

YouTube-video's spelen niet vanaf een `file://`-pad, dus start een kleine webserver:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Of zet **GitHub Pages** aan (Settings → Pages → *Deploy from a branch*), dan staat het spel online.

Zonder webserver kun je `index.html` ook direct openen. Dan speelt de ingebouwde muziek.

## De filmintro

Na **Spelen** volgt eerst een filmintro in bouwsteen-stijl (overslaan met Enter of een klik):

1. Het huis van de McCallisters in de sneeuw, met de titel
2. De ruzie om de kaaspizza: *"Ik hoop dat ik jullie NOOIT meer zie!"*
3. Een storm, de stroom valt uit en de wekkers gaan niet af
4. *"WE HEBBEN ONS VERSLAPEN!"*, de busjes rijden weg zonder Kevin
5. In het vliegtuig naar Parijs: *"KEVIN!!!"*
6. Kevin alleen thuis: springen op het bed en de aftershave-gil
7. Het busje van "Oh-Kay Loodgieters" met Harry en Marv

Daarna vliegt de voorgevel van het huis steen voor steen weg en kijk je naar binnen.

## Zo werkt het

1. **19:30–21:00 – voorbereiden.** Loop door de kelder, de begane grond en de bovenverdieping.
   Houd **E** ingedrukt bij een stuiterende stapel stenen om er een val van te bouwen.
   Mep spullen kapot voor noppen.
2. **21:00 – de aanval.** Harry komt via de voordeur binnen, Marv via de kelder.
   Elke bandiet heeft 6 hartjes trots. Loopt hij in een val, dan volgt er een grap,
   valt hij in stukjes uit elkaar en verliest hij een hartje. Een val die is afgegaan,
   wordt weer een stapel stenen die je opnieuw kunt bouwen.
3. Word je gepakt, dan val je uit elkaar, verlies je wat noppen en kom je boven weer terug.
   Zoals in elke klassieke bouwsteengame kun je niet af.

### Vallen

IJzige stoep · gloeiende deurklink (met "M"-brandplek) · speelgoedautootjes · kerstballen ·
brander (muts in de fik) · ijzige kelderstoep · strijkijzer door de wasgoedkoker ·
zwaaiende verfblikken · spijker (tegen het plafond gelanceerd) · lijm & veren (TOK TOK!) · Buzz' tarantula

### Grapjes en extra's

- **Q**: de beroemde aftershave-gil, met de handen tegen de wangen. Bandieten in de buurt schrikken zich rot.
- **TV** in de woonkamer: *"Hou het wisselgeld, smerig beest!"* De bandieten vluchten.
- **Buzz' BB-geweer** op zijn kamer (boven, rechts).
- **Met de slee** de grote trap met de rode loper af en de voordeur uit, de sneeuw in. Bandieten die in de weg staan, gaan onderuit.
- Een kartonnen basketballer op het speelgoedtreintje, de enge verwarmingsketel in de kelder,
  een doos pizza van *Lil' Nero's*, een boomhut met kabelbaan en de politie aan het eind.
- De status **Echte Kevin** (16.000 noppen) en 4 gouden stenen om te verdienen.

### Besturing

| Toets | Actie |
|---|---|
| ← → / A D | Lopen |
| ↑ ↓ / W S | Trap op/af |
| Spatie | Springen (ook over bandieten heen) |
| E (vasthouden) | Val bouwen / voorwerp gebruiken |
| F | Kapotmeppen / BB-geweer |
| Q | Gillen |
| Enter | Voorbereiding overslaan |
| P / Esc, M | Pauze, geluid aan/uit |

Op een tablet of telefoon verschijnen knoppen op het scherm.

## Muziek

De originele soundtrack van John Williams wordt **gestreamd** met de officiële YouTube-speler.
Die staat als klein "radio"-venster rechtsonder:

- menu en voorbereiding: *Main Title "Somewhere in My Memory"*
- de aanval: *The Attack on the House*

Onder **Muziek** in het menu kun je eigen YouTube-links plakken, of kiezen voor de ingebouwde muziek.
De muziek wordt niet gedownload of in de repo gezet, want de opnames zijn auteursrechtelijk beschermd.
Lukt YouTube niet (offline, een video die niet ingesloten mag worden, of autoplay die geblokkeerd is),
dan schakelt het spel automatisch over op eigen chiptune-versies van rechtenvrije kerstliedjes:
*Carol of the Bells* (die ook in de film zit), *Jingle Bells* en een rustig slaapliedje.

## Bestanden

- `index.html`: schermen, menu's en de YouTube-radio
- `css/style.css`: bouwsteen-look van de menu's
- `js/draw.js`: tekenfuncties voor stenen, noppen en minifiguren (Kevin, Harry, Marv, politie)
- `js/audio.js`: geluidseffecten (Web Audio), ingebouwde muziek en de YouTube-speler
- `js/intro.js`: de filmintro en de bouwsteengevel van het huis
- `js/game.js`: wereld, vallen, AI van de bandieten, HUD en de spellus

*Onofficiële fan-game voor privégebruik. Niet verbonden aan de LEGO Group of 20th Century Studios.*
