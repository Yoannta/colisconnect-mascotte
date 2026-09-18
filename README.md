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
- `CCMascotte.ranger()` — il s'en va (et ne revient plus pendant 30 jours).
- `CCMascotte.jet(true)` — rejoue tout de suite la scène du grand départ.
- `CCMascotte.oublierJet()` — remet à zéro le compteur des 12 heures.

## Comportement

1. Il apparaît en bas de l'écran et se promène (jambes, bras, rebond, valise qui suit).
2. Il s'arrête, regarde autour de lui, puis vient saluer (bras levé).
3. Sa bulle « Besoin d'un coup de main ? » apparaît : un clic dessus (ou sur lui) ouvre le chat.
4. Le petit `×` de la bulle le renvoie chez lui — et il ne revient plus pendant 30 jours
   (mémorisé par le navigateur).
5. **Appui long (0,4 s) sur le personnage** : il se retourne (vue de face, effrayé) et on
   peut le déposer où l'on veut dans la page. À l'atterrissage, il râle.

## Le grand départ

Si on ne le pose pas mais qu'on le **lance** — un geste vif, relâché à toute vitesse —
il ne râle pas : il tombe, se relève, se met les poings sur les hanches et demande
« **Tu veux que je parte ?** ».

- **Oui** : une porte apparaît à côté de lui — vue de profil, comme lui : fermée ce
  n'est qu'un trait vertical avec une poignée, ouverte on voit tout le panneau. Il
  reprend sa valise, marche jusqu'à la porte, te jette un regard énervé de haut en
  bas, entre… et la claque. Il ne revient
  qu'au rechargement de la page.
- **Non** : il se calme, boude trois secondes, puis repart comme si de rien n'était.
- Personne ne répond au bout de 12 secondes : il considère que c'est « non ».

Cette scène ne se produit **qu'une fois toutes les 12 heures** (mémorisé par le
navigateur) : les autres lancers déclenchent la colère habituelle. C'est ce qui en fait
un moment, et pas une animation qu'on voit à chaque fois.

Comment le dépôt est distingué du lancer : on mesure la **vitesse du doigt juste avant
le relâchement** (les ~110 dernières millisecondes). Au-dessus de 1,2 px/ms, c'est un
jet. Ce seuil est la constante `VITESSE_JET` en haut de `mascotte.js` : si la scène se
déclenche trop souvent, on le monte ; si elle ne se déclenche jamais, on le baisse.

## Respect du visiteur

- **Il ne gêne jamais** : sa bande de promenade laisse passer tous les clics ; seuls
  le personnage, sa bulle et sa question sont cliquables.
- **Mode calme** : si la page a la classe `is-calm` sur le `<body>`, il reste
  immobile mais garde la parole — et la scène du grand départ ne se joue pas.
- **Moins d'animation** : si le visiteur a demandé « réduire les animations » dans son
  système (`prefers-reduced-motion`), aucune animation ne tourne — la bulle reste.
- **Téléphone** : il est plus petit (88 × 124 px), la porte et la question s'adaptent,
  et sa bulle reste lisible (13 px).

## Mesures

- Poids : ~70 ko brut, ~17 ko une fois compressé par le serveur.
- ~95 formes SVG dessinées à la main (le personnage a deux points de vue : profil et face),
  aucune dépendance.
