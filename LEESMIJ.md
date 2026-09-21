# Voeding tijdlijn — lokale versie

Open [de startpagina](index.html) in uw browser. Het vertrouwde `file:`-adres blijft werken. Er is geen server of installatie nodig om het naslagwerk te lezen, te zoeken of te filteren.

De site bevat een chronologische route, zes themadossiers, een leeswijzer, begrippen en bronnen. Oude pagina-adressen verwijzen door naar de passende bijgewerkte inhoud.

## Houvast tijdens het lezen

Begin bij 1955 en lees per tijdsmoment eerst de samenvatting. Alle tijdsmomenten beantwoorden dezelfde drie vragen. Na elke periode volgt een tussenbalans. Extra uitleg staat bij de thema’s; andere onderwerpen zijn standaard ingeklapt. Vóór en na de tekst staan dezelfde navigatieknoppen. Deze bedekken geen tekst tijdens het lezen of vergroten.

De gewone leestekst is 20 pixels. Met “Grote letters” wordt dit 25 pixels; “Kleine letters” zet dit terug. De keuze reist mee in interne links via `tekst=groot`, ook naar zoekresultaten en de leesversie. De browser kan daarnaast verder inzoomen. Bij voldoende ondersteuning blijft de keuze ook bij vernieuwen behouden; er worden geen cookies of opslagrechten gevraagd.

`leesversie.html` bevat de 17 tijdsmomenten met hun uitleg en drie tussenbalansen op één pagina. De afdrukknop opent de gewone afdrukdialoog van de browser; navigatie en knoppen worden niet mee afgedrukt. De uitleg van geselecteerde moeilijke begrippen staat direct bij de tekst.

Wanneer u vanuit een tijdsmoment doorklikt, bewaren interne links het vertrekpunt in de adresparameter `vanaf`. Dat werkt ook bij vernieuwen, een tweede dossier, begrippen, zoekresultaten en een nieuw tabblad. Er worden geen cookies of browseropslag gebruikt. Een ander tijdsmoment wordt het nieuwe vertrekpunt. Rechtstreeks geopende dossiers bieden het tijdlijnoverzicht en het begin van de leesroute aan. Externe bronnen houden hun eigen adres; keer daar terug met de terugknop van uw browser. Zonder JavaScript blijven de gewone navigatie en het overzicht beschikbaar, maar wordt de persoonlijke terugroute niet weergegeven.

## Onderhoud

- `site/inhoud.mjs`: teksten, brongegevens, tijdlijn en begrippen.
- `site/bouw.mjs`: genereert de zelfstandige HTML-pagina’s en de zoekindex.
- `assets/site.css`: gedeelde vormgeving, mobiele opmaak en afdrukstijl.
- `assets/site.js`: zoeken, tijdlijnfilters en het vasthouden van de leesroute; werkt ook zonder internet.
- `assets/route.js`: door de bouwstap gegenereerde tijdsmomenten voor de leesroute.
- `site/doorverwijzingen.json`: door de bouwstap gegenereerd overzicht van oude adressen.
- `Actualiteitscontrole-2026-09-21.md`: het onderzoeksverslag vóór de herwerking.

Na een inhoudelijke wijziging: `npm run build`. Voor controles: eerst `npm ci --ignore-scripts`, daarna `npm test`. De testbibliotheek is alleen voor onderhoud; de browser heeft die niet nodig.

Controle omvat de HTML-structuur, lokale verwijzingen en ankers, doorverwijzingen, filtergedrag, de zoekfunctie en leesroutes via meerdere pagina’s met lokale en webadressen. Dit vervangt geen visuele controle in een echte browser. Tijdens deze herwerking blokkeerde de ingebouwde testbrowser het lokale `file:`-adres; de weergave op verschillende schermformaten is daardoor niet visueel bevestigd.

De eerdere versie blijft in de Git-geschiedenis beschikbaar. De publieke website wordt door GitHub Pages gepubliceerd vanuit de hoofdmap van de branch `main`: https://fredje4711.github.io/voeding_tijdlijn/.
