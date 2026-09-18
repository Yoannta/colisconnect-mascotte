# Le petit voyageur — ColisConnect

Petite mascotte 2D pour le site ColisConnect : un voyageur dessiné **en code**
(SVG + CSS + un peu de JavaScript), qui se promène en bas de l'écran, s'arrête,
regarde autour, vous salue et propose son aide.

Aucune image, aucune librairie, aucun appel réseau : tout est local.

## Fichiers

- `index.html` — terrain d'essai (page de démonstration + boutons de test).
- `mascotte.js` — le personnage complet : dessin SVG, animations, comportement.
- `README.md` — ce fichier.

## Essayer en local

```bash
python -m http.server 8124 --bind 127.0.0.1
# puis ouvrir http://127.0.0.1:8124/
```

Le dépôt sert aussi de page en ligne (GitHub Pages) :
https://yoannta.github.io/colisconnect-mascotte/

## Installer sur le vrai site

Une seule ligne, avant `</body>` :

```html
<script src="mascotte.js" defer></script>
```

Le personnage s'installe tout seul. Pour le configurer :

```html
<script src="mascotte.js"></script>
<script>
  CCMascotte.mount({
    salutation: "Bonjour ! 👋 Besoin d'un coup de main ?",
    delai: 7000,                 // ms avant qu'il remarque le visiteur
    vitesse: 46,                 // vitesse de marche, en pixels/seconde
    onChat: function () {        // à brancher sur le vrai assistant
      ouvrirMonAssistant();
    }
  });
</script>
```

Autres commandes utiles :

- `CCMascotte.relancer({ delai: 1500 })` — il revient et salue presque tout de suite.
- `CCMascotte.monte()` — vrai si le personnage est déjà là.
- `CCMascotte.cacher()` — il s'en va.

## Comportement

1. Il apparaît en bas de l'écran et se promène (jambes, bras, rebond, valise qui suit).
2. Il s'arrête, regarde autour de lui, puis vient saluer (bras levé).
3. Sa bulle « Besoin d'un coup de main ? » apparaît : un clic dessus (ou sur lui) ouvre le chat.
4. Le petit `×` de la bulle le renvoie chez lui — et il ne revient plus pendant 30 jours
   (mémorisé par le navigateur).

## Respect du visiteur

- **Il ne gêne jamais** : sa bande de promenade laisse passer tous les clics ; seuls
  le personnage et sa bulle sont cliquables.
- **Mode calme** : si la page a la classe `is-calm` sur le `<body>`, il reste
  immobile mais garde la parole.
- **Moins d'animation** : si le visiteur a demandé « réduire les animations » dans son
  système (`prefers-reduced-motion`), aucune animation ne tourne — la bulle reste.
- **Téléphone** : il est plus petit (88 × 124 px) et sa bulle reste lisible (13 px).

## Mesures

- Poids : ~22 ko brut, ~6 ko une fois compressé par le serveur.
- 44 pièces SVG, aucune dépendance.
