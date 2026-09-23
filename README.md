# Home Alone – Steen voor Steen

Een **3D** fan-game in de stijl van de LEGO-games (denk aan LEGO Jurassic World), gebaseerd op de eerste *Home Alone* (1990).
Kevin is alleen thuis. Om 21:00 uur breken de **Natte Bandieten** Harry en Marv in.
Bouw vallen van stuiterende stapels stenen, verzamel ronddraaiende noppen en verdedig het huis.

Het draait volledig in de browser met WebGL ([Three.js](https://threejs.org), meegeleverd in `lib/`). Er is geen build-stap.

## Spelen

Start een kleine webserver in deze map:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Of zet **GitHub Pages** aan (Settings → Pages → *Deploy from a branch*), dan staat het spel online.

Dubbelklikken op `index.html` werkt niet: browsers laden 3D-modules niet vanaf `file://`. Gebruik dus altijd een webserver of GitHub Pages.

## De filmintro

Na **Spelen** volgt eerst een 3D-filmintro (overslaan met Enter of een klik):

1. De openingsshot: de camera vliegt 's nachts door de besneeuwde straat naar het verlichte huis van de McCallisters, en de titel verschijnt
2. De ruzie om de kaaspizza: *"Ik hoop dat ik jullie NOOIT meer zie!"*
3. Een storm, de stroom valt uit en de wekkers gaan niet af
4. *"WE HEBBEN ONS VERSLAPEN!"*, de busjes rijden weg zonder Kevin
5. In het vliegtuig naar Parijs: *"KEVIN!!!"*
6. Kevin alleen thuis: springen op het bed en de aftershave-gil
7. Het busje van "Oh-Kay Loodgieters" met Harry en Marv

Daarna begint het spel. De camera volgt Kevin schuin van boven. Muren, dak en de bovenverdieping worden doorzichtig zodra je naar binnen gaat, zoals in de LEGO-games.

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
- De status **Echte Kevin** (20.000 noppen) en 4 gouden stenen om te verdienen.

### Besturing

| Toets | Actie |
|---|---|
| W A S D / pijltjes | Lopen (ook de grote trap op en af) |
| Spatie | Springen (ook over bandieten heen) |
| E (vasthouden) | Val bouwen / voorwerp gebruiken |
| F | Kapotmeppen / BB-geweer |
| Q | Gillen |
| Enter | Voorbereiding overslaan |
| P / Esc, M | Pauze, geluid aan/uit |

Op een tablet of telefoon verschijnen een joystick en knoppen op het scherm.

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

- `index.html`: schermen, HUD, intro-overlays en de YouTube-radio
- `css/style.css`: bouwsteen-look van menu's en HUD
- `src/lego.js`: stenen met noppen (instanced), texturen en minifiguren met gezichtsuitdrukkingen
- `src/world.js`: het huis, de tuinen, de straat, licht, sneeuw en de botsings- en kamerindeling
- `src/game.js`: Kevin, de AI van de bandieten, vallen, noppen, camera met doorkijk en HUD
- `src/intro.js`: de filmintro met camerapaden
- `src/main.js`: opstarten, invoer, menu's en de spellus
- `js/audio.js`: geluidseffecten (Web Audio), ingebouwde muziek en de YouTube-speler
- `lib/three.module.min.js`: Three.js r170 (MIT-licentie, zie `lib/three.LICENSE`)

*Onofficiële fan-game voor privégebruik. Niet verbonden aan de LEGO Group of 20th Century Studios.*
