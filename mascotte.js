/* ============================================================================
   MASCOTTE — LE PETIT VOYAGEUR  ·  ColisConnect
   ----------------------------------------------------------------------------
   100 % local : aucune image, aucune librairie, aucun appel réseau.
   Le personnage est dessine en SVG (pieces separees) et anime en CSS ;
   son comportement (marcher, s'arreter, regarder, saluer, parler) est un
   petit automate en JavaScript.

   UTILISATION
     <script src="mascotte.js" defer></script>
     CCMascotte.mount({
       salutation : 'Bonjour ! Vous cherchez quelque chose ?',
       delai      : 7000,      // ms avant qu'il remarque le visiteur
       vitesse    : 46,        // pixels / seconde
       onChat     : function () { ouvrirMonAssistant(); }
     });

   API : CCMascotte.mount(opts) | CCMascotte.relancer() | CCMascotte.ranger()
         CCMascotte.enrager() | CCMascotte.poser()
   ========================================================================== */
(function () {
  'use strict';

  var VERSION = '2.1.0';
  var CLE_FERME = 'cc-mascotte-ferme';   // "ne plus afficher" (30 jours)
  var JOURS     = 30;

  /* ---------------------------------------------------- la vue de FACE --- */
  /* Quand on l'attrape (appui long) pour le deplacer, il se retourne : vue
     de face, quatre membres visibles, bouche ronde "hooo". Memes couleurs
     et meme viewBox que la vue de profil.                                    */
  var FACE = [
    '<g class="ccm-face-corps">',
      '<ellipse class="ccm-ombre ccmf-ombre" cx="55" cy="146" rx="27" ry="3.8"/>',
      '<g class="ccmf-corps">',
      '<g class="ccmf-tremble">',

        /* jambes pendantes : la claire devant, l'autre derriere */
        '<g class="ccmf-jambe ccmf-jambe-g">',
          '<rect class="ccm-pantalon" x="43" y="92" width="10" height="38" rx="5"/>',
          '<rect class="ccm-chaussure" x="40.5" y="127" width="15" height="8.5" rx="4.2"/>',
        '</g>',
        '<g class="ccmf-jambe ccmf-jambe-d ccmf-derriere">',
          '<rect class="ccm-pantalon" x="57" y="92" width="10" height="38" rx="5"/>',
          '<rect class="ccm-chaussure" x="55" y="126" width="15" height="8.5" rx="4.2"/>',
        '</g>',

        /* sac a dos qui depasse des deux epaules */
        '<rect class="ccm-sac-caisse" x="41" y="48" width="28" height="18" rx="8"/>',

        /* torse et bretelles */
        '<g class="ccmf-torse">',
          '<rect class="ccm-veste" x="39" y="58" width="32" height="42" rx="14"/>',
          '<rect class="ccm-zippe" x="53.5" y="62" width="3" height="34" rx="1.5"/>',
        '</g>',
        '<rect class="ccm-sac-bretelle" x="43" y="58" width="5" height="30" rx="2.5" transform="rotate(13 45.5 60)"/>',
        '<rect class="ccm-sac-bretelle" x="62" y="58" width="5" height="30" rx="2.5" transform="rotate(-13 64.5 60)"/>',

        /* bras arriere : leve, il appelle au secours */
        '<g transform="rotate(-72 71.5 62)">',
          '<g class="ccmf-bras ccmf-bras-d ccmf-sombre">',
            '<rect class="ccm-manche" x="67" y="60" width="9" height="28" rx="4.5"/>',
            '<circle class="ccm-peau" cx="71.5" cy="88" r="5.2"/>',
          '</g>',
        '</g>',

        /* tete de face, effrayee */
        '<g class="ccmf-tete">',
          '<circle class="ccm-cou" cx="55" cy="57" r="8"/>',
          '<circle class="ccm-oreille" cx="35" cy="43" r="4.8"/>',
          '<circle class="ccm-oreille" cx="75" cy="43" r="4.8"/>',
          '<circle class="ccm-peau" cx="55" cy="40" r="20"/>',
          '<path class="ccm-casquette" d="M35,38 A20,20 0 0 1 75,38 Z"/>',
          '<rect class="ccm-casquette-bande" x="35" y="33.5" width="40" height="4.6" rx="2.3"/>',
          '<path class="ccm-casquette-visiere" d="M31,37.5 Q55,31 79,37.5 Q55,41.5 31,37.5 Z"/>',
          '<ellipse class="ccm-joue" cx="40" cy="51.5" rx="3.8" ry="2.4"/>',
          '<ellipse class="ccm-joue" cx="70" cy="51.5" rx="3.8" ry="2.4"/>',
          '<path class="ccm-sourcil" d="M40.5,42.5 q5,-3.2 9.8,-1.2"/>',
          '<path class="ccm-sourcil" d="M59.7,41.3 q4.8,-2 9.8,1.2"/>',
          '<ellipse class="ccm-oeil" cx="45.6" cy="46.6" rx="3.8" ry="4.6"/>',
          '<ellipse class="ccm-oeil" cx="64.4" cy="46.6" rx="3.8" ry="4.6"/>',
          '<circle class="ccm-pupille" cx="46.3" cy="44.7" r="1.4"/>',
          '<circle class="ccm-pupille" cx="65.1" cy="44.7" r="1.4"/>',
          '<rect class="ccm-paupiere" x="41.6" y="41.8" width="8" height="9.6" rx="1.2"/>',
          '<rect class="ccm-paupiere" x="60.4" y="41.8" width="8" height="9.6" rx="1.2"/>',
          '<ellipse class="ccmf-bouche-ronde" cx="55" cy="53.6" rx="4.6" ry="5.4"/>',
          '<ellipse class="ccmf-bouche-fond" cx="55" cy="55" rx="2.7" ry="3.1"/>',
        '</g>',

        /* bras avant : il serre la valise contre lui */
        '<g class="ccmf-bras ccmf-bras-g">',
          '<rect class="ccm-manche" x="34" y="60" width="9" height="28" rx="4.5"/>',
          '<circle class="ccm-peau" cx="38.5" cy="88" r="5.2"/>',
        '</g>',
        '<g class="ccmf-valise">',
          '<rect class="ccm-valise-poignee" x="35.5" y="87" width="6" height="13" rx="3"/>',
          '<rect class="ccm-valise-barre" x="24" y="95" width="24" height="6" rx="3"/>',
          '<rect class="ccm-valise-caisse" x="18" y="101" width="27" height="36" rx="7"/>',
          '<rect class="ccm-valise-sangle" x="18" y="113" width="27" height="11"/>',
          '<rect class="ccm-valise-loquer" x="27" y="116" width="9" height="4" rx="2"/>',
          '<circle class="ccm-valise-roue" cx="24" cy="138" r="3.4"/>',
          '<circle class="ccm-valise-roue" cx="39" cy="138" r="3.4"/>',
        '</g>',

        /* gouttes de sueur */
        '<circle class="ccmf-goutte ccmf-goutte-1" cx="80" cy="28" r="2.6"/>',
        '<circle class="ccmf-goutte ccmf-goutte-2" cx="86" cy="38" r="2.2"/>',
        '<circle class="ccmf-goutte ccmf-goutte-3" cx="76" cy="18" r="2"/>',

        /* ondes du "hooo" */
        '<path class="ccmf-arc ccmf-arc-1" d="M63,47 q5,6 .6,15"/>',
        '<path class="ccmf-arc ccmf-arc-2" d="M47,47 q-5,6 -.6,15"/>',

      '</g>',
      '</g>',
    '</g>'
  ].join('');

  /* ------------------------------------------------------- le personnage -- */
  /* Vue de profil, tourne vers la droite. viewBox 110 x 155.
     Ordre de dessin = ordre d'empilement (du fond vers l'avant).            */
  var SVG = [
    '<svg class="ccm-svg" viewBox="0 0 110 155" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">',
      '<g class="ccm-body">',

        /* ombre au sol : le pose par terre */
        '<ellipse class="ccm-ombre" cx="54" cy="145" rx="32" ry="4.2"/>',

        /* valise tiree, derriere lui.
           L'ancre sert a l'immobiliser au sol quand il part la rechercher. */
        '<g class="ccm-valise-ancre"><g class="ccm-valise">',
          '<rect class="ccm-valise-poignee" x="30" y="88" width="5" height="14" rx="2.5"/>',
          '<rect class="ccm-valise-barre"   x="22" y="84" width="20" height="6" rx="3"/>',
          '<rect class="ccm-valise-caisse"  x="12" y="100" width="28" height="38" rx="7"/>',
          '<rect class="ccm-valise-sangle"  x="12" y="112" width="28" height="12"/>',
          '<rect class="ccm-valise-loquer"  x="21" y="115" width="9" height="4" rx="2"/>',
          '<circle class="ccm-valise-roue" cx="19" cy="140" r="3.6"/>',
          '<circle class="ccm-valise-roue" cx="33" cy="140" r="3.6"/>',
        '</g></g>',

        /* bras arriere : il tient la valise */
        '<g transform="rotate(25 52 68)"><g class="ccm-bras ccm-bras-ar">',
          '<rect class="ccm-manche" x="48" y="68" width="8" height="26" rx="4"/>',
          '<circle class="ccm-peau" cx="52" cy="96" r="5.4"/>',
        '</g></g>',

        /* jambe arriere */
        '<g class="ccm-jambe ccm-jambe-ar">',
          '<rect class="ccm-pantalon" x="52" y="96" width="9" height="38" rx="4.5"/>',
          '<rect class="ccm-chaussure" x="50" y="134" width="13" height="8" rx="4"/>',
        '</g>',

        /* torse */
        '<g class="ccm-torse">',
          '<rect class="ccm-veste" x="45" y="60" width="33" height="40" rx="13"/>',
          '<rect class="ccm-zippe" x="60" y="64" width="3" height="32" rx="1.5"/>',
        '</g>',

        /* sac a dos (porte sur le dos, avec bretelle sur la poitrine) */
        '<g class="ccm-sac">',
          '<rect class="ccm-sac-caisse"    x="36" y="68" width="14" height="25" rx="6.5"/>',
          '<rect class="ccm-sac-poche"     x="38.5" y="77" width="9" height="9" rx="4"/>',
          '<rect class="ccm-sac-bretelle"  x="46" y="64" width="5" height="30" rx="2.5" transform="rotate(20 48 66)"/>',
        '</g>',

        /* jambe avant */
        '<g class="ccm-jambe ccm-jambe-av">',
          '<rect class="ccm-pantalon" x="62" y="96" width="9" height="38" rx="4.5"/>',
          '<rect class="ccm-chaussure" x="60" y="134" width="13" height="8" rx="4"/>',
        '</g>',

        /* tete */
        '<g class="ccm-tete">',
          '<circle class="ccm-cou"   cx="62" cy="56" r="7"/>',
          '<circle class="ccm-peau"  cx="62" cy="40" r="20"/>',
          '<circle class="ccm-peau ccm-oreille" cx="51" cy="43" r="4.6"/>',
          '<path class="ccm-cheveux" d="M43,34 q3,-9 12,-11 q-1,6 -2,7 q-6,1 -10,4 Z"/>',
          '<path class="ccm-casquette" d="M42,38 A20,20 0 0 1 82,38 Z"/>',
          '<rect class="ccm-casquette-bande" x="42" y="34" width="40" height="4.5" rx="2.2"/>',
          '<path class="ccm-casquette-visiere" d="M80,35.5 L97,40 Q92,44.5 78,42 Z"/>',
          '<ellipse class="ccm-joue" cx="57" cy="48" rx="3.6" ry="2.3"/>',
          '<path class="ccm-sourcil" d="M66,34.5 q4.5,-2 8.5,0.4"/>',
          '<ellipse class="ccm-oeil" cx="70" cy="41.5" rx="2.7" ry="3.1"/>',
          '<circle class="ccm-pupille" cx="71" cy="40.4" r="1"/>',
          '<rect class="ccm-paupiere" x="66.6" y="37.6" width="6.8" height="7.4" rx="1"/>',
          '<path class="ccm-bouche" d="M66,49.5 q5,4.4 10,-1.2"/>',
        '</g>',

        /* petites fumees de colere : invisibles d'habitude */
        '<g class="ccm-vapeur">',
          '<circle cx="28" cy="30" r="3.6"/><circle cx="19" cy="23" r="3"/><circle cx="11" cy="31" r="2.5"/>',
        '</g>',

        /* bras avant : c'est lui qui salue */
        '<g class="ccm-bras ccm-bras-av">',
          '<rect class="ccm-manche" x="66" y="70" width="8" height="26" rx="4"/>',
          '<circle class="ccm-peau" cx="70" cy="98" r="5.4"/>',
        '</g>',

      '</g>',

      FACE,

    '</svg>'
  ].join('');

  /* --------------------------------------------------------------- bulle -- */
  var BULLE = [
    '<div class="ccm-bulle" role="dialog" aria-label="Message du guide">',
      '<button class="ccm-bulle-fermer" type="button" aria-label="Ne plus afficher ce guide">&times;</button>',
      '<p class="ccm-bulle-texte"></p>',
      '<button class="ccm-bulle-ouvrir" type="button">Discuter avec moi</button>',
    '</div>'
  ].join('');

  /* bulle de colere : une etoile qui crache des symboles, jamais de vrais mots */
  var COLERE = [
    '<div class="ccm-colere" role="status">',
      '<svg class="ccm-colere-fond" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">',
        '<path class="ccm-colere-etoile" d="' + etoile(50, 50, 50, 33, 13) + '"/>',
      '</svg>',
      '<span class="ccm-colere-txt">&amp;@#%*! &sect;%?&amp;! #@*!&amp;%</span>',
    '</div>'
  ].join('');

  /* dessine une etoile : sert de fond a la bulle de colere */
  function etoile(cx, cy, rExterne, rInterne, pointes) {
    var sommets = [], total = pointes * 2, i, angle, rayon;
    for (i = 0; i < total; i++) {
      angle = (Math.PI * 2 * i / total) - Math.PI / 2;
      rayon = (i % 2 === 0) ? rExterne : rInterne;
      sommets.push((cx + rayon * Math.cos(angle)).toFixed(1) + ',' + (cy + rayon * Math.sin(angle)).toFixed(1));
    }
    return 'M' + sommets.join(' L') + ' Z';
  }

  /* ---------------------------------------------------------------- style -- */
  var CSS = [
    /* le rail : toute la largeur, en bas de l'ecran, transparent aux clics */
    '.ccm-root{position:fixed;left:0;right:0;bottom:0;height:196px;pointer-events:none;z-index:60}',
    '.ccm-perso{position:absolute;bottom:8px;left:0;width:110px;height:155px;pointer-events:auto;cursor:pointer;',
      'opacity:0;transform:translateY(10px);transition:opacity .6s ease,transform .6s ease}',
    '.ccm-root.ccm-pret .ccm-perso{opacity:1;transform:translateY(0)}',
    '.ccm-perso.ccm-parti{opacity:0;transform:translateY(16px);pointer-events:none}',
    '.ccm-perso:focus-visible .ccm-svg{outline:2px solid var(--primary,#13ecc8);outline-offset:4px;border-radius:8px}',
    '.ccm-svg{width:100%;height:100%;display:block;overflow:visible;transform-origin:50% 100%;transition:transform .2s ease}',
    '.ccm-perso.ccm-vers-gauche .ccm-svg{transform:scaleX(-1)}',

    /* couleurs (reprend les jetons du site, avec repli sur la charte) */
    '.ccm-svg .ccm-peau{fill:#f6c9a4}',
    '.ccm-svg .ccm-cou{fill:#e3ae86}',
    '.ccm-svg .ccm-oreille{fill:#f0bd97}',
    '.ccm-svg .ccm-cheveux{fill:#3a2c26}',
    '.ccm-svg .ccm-casquette{fill:#0f9c86}',
    '.ccm-svg .ccm-casquette-bande{fill:var(--primary,#13ecc8)}',
    '.ccm-svg .ccm-casquette-visiere{fill:#0b7a68}',
    '.ccm-svg .ccm-oeil{fill:#1d2b32}',
    '.ccm-svg .ccm-ombre{fill:#000000;opacity:.3}',
    '.ccm-svg .ccm-pupille{fill:#ffffff}',
    '.ccm-svg .ccm-joue{fill:#f2a288;opacity:.55}',
    '.ccm-svg .ccm-sourcil{fill:none;stroke:#3a2c26;stroke-width:1.7;stroke-linecap:round}',
    '.ccm-svg .ccm-bouche{fill:none;stroke:#a4553c;stroke-width:2;stroke-linecap:round}',
    '.ccm-svg .ccm-veste{fill:#0e6b5e}',
    '.ccm-svg .ccm-zippe{fill:#0a544a}',
    '.ccm-svg .ccm-manche{fill:#128a76}',
    '.ccm-svg .ccm-bras-ar .ccm-manche{fill:#0b5449}',
    '.ccm-svg .ccm-pantalon{fill:#17495a}',
    '.ccm-svg .ccm-jambe-ar .ccm-pantalon{fill:#123743}',
    '.ccm-svg .ccm-chaussure{fill:#e9eef1}',
    '.ccm-svg .ccm-jambe-ar .ccm-chaussure{fill:#c9d3d8}',
    '.ccm-svg .ccm-sac-caisse{fill:#f0b429}',
    '.ccm-svg .ccm-sac-poche{fill:#d29a1f}',
    '.ccm-svg .ccm-sac-bretelle{fill:#c8951f}',
    '.ccm-svg .ccm-valise-caisse{fill:#0b6b5c}',
    '.ccm-svg .ccm-valise-sangle{fill:#0a574b}',
    '.ccm-svg .ccm-valise-loquer{fill:#f0b429}',
    '.ccm-svg .ccm-valise-barre{fill:#5b6a70}',
    '.ccm-svg .ccm-valise-poignee{fill:#93a1a6}',
    '.ccm-svg .ccm-valise-roue{fill:#22313a}',

    /* pivots des membres */
    '.ccm-svg .ccm-body,.ccm-svg .ccm-jambe,.ccm-svg .ccm-bras,.ccm-svg .ccm-tete,',
      '.ccm-svg .ccm-torse,.ccm-svg .ccm-sac,.ccm-svg .ccm-valise{transform-box:fill-box}',
    '.ccm-svg .ccm-body{transform-origin:50% 100%}',
    '.ccm-svg .ccm-jambe{transform-origin:50% 4%}',
    '.ccm-svg .ccm-bras{transform-origin:50% 2%}',
    '.ccm-svg .ccm-tete{transform-origin:50% 92%}',
    '.ccm-svg .ccm-torse{transform-origin:50% 100%}',
    '.ccm-svg .ccm-sac{transform-origin:50% 6%}',
    '.ccm-svg .ccm-valise{transform-origin:88% 4%}',

    /* clignement des yeux : toujours actif, c'est ce qui le rend vivant */
    '.ccm-svg .ccm-paupiere{fill:#f6c9a4;transform-box:fill-box;transform-origin:50% 0;',
      'transform:scaleY(0);animation:ccmCligne 5s ease-in-out infinite}',

    /* etats */
    '.ccm-root.ccm-marche .ccm-jambe-av{animation:ccmPasAv .58s ease-in-out infinite}',
    '.ccm-root.ccm-marche .ccm-jambe-ar{animation:ccmPasAr .58s ease-in-out infinite}',
    '.ccm-root.ccm-marche .ccm-bras-av{animation:ccmBrasAv .58s ease-in-out infinite}',
    '.ccm-root.ccm-marche .ccm-bras-ar{animation:ccmBrasAr .58s ease-in-out infinite}',
    '.ccm-root.ccm-marche .ccm-body{animation:ccmFlotte 1.16s ease-in-out infinite}',
    '.ccm-root.ccm-marche .ccm-valise{animation:ccmValise .58s ease-in-out infinite}',
    '.ccm-root.ccm-repos .ccm-body{animation:ccmRespire 3.6s ease-in-out infinite}',
    '.ccm-root.ccm-repos .ccm-tete{animation:ccmBalance 6.4s ease-in-out infinite}',
    '.ccm-root.ccm-regarde .ccm-tete{animation:ccmRegarde 1.9s ease-in-out}',
    '.ccm-root.ccm-salue .ccm-bras-av{animation:ccmSalut 1.8s ease-in-out}',
    '.ccm-root.ccm-ecoute .ccm-tete{animation:ccmEcoute 2.6s ease-in-out infinite}',
    '.ccm-root.ccm-fige .ccm-perso *{animation:none !important;transition:none !important}',
    '.ccm-root.ccm-fige .ccm-paupiere{transform:scaleY(0)}',

    /* bulle */
    '.ccm-bulle{position:absolute;left:50%;bottom:calc(100% - 4px);transform:translate(-50%,8px);',
      'width:max-content;max-width:min(76vw,280px);background:#0b1116;color:#eef7f5;',
      'border:1px solid rgba(19,236,200,.32);border-radius:16px;padding:12px 34px 12px 14px;',
      'font:500 13.5px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left;',
      'box-shadow:0 12px 34px rgba(0,0,0,.5);opacity:0;pointer-events:none;',
      'transition:opacity .35s ease,transform .35s ease}',
    '.ccm-root.ccm-parle .ccm-bulle{opacity:1;transform:translate(-50%,0);pointer-events:auto}',
    '.ccm-bulle:after{content:"";position:absolute;left:50%;bottom:-7px;width:12px;height:12px;',
      'background:#0b1116;border-right:1px solid rgba(19,236,200,.32);',
      'border-bottom:1px solid rgba(19,236,200,.32);transform:translateX(-50%) rotate(45deg)}',
    '.ccm-bulle-texte{margin:0 0 9px;display:block}',
    '.ccm-bulle-ouvrir{background:var(--primary,#13ecc8);color:#04201c;border:0;border-radius:999px;',
      'padding:6px 14px;font:700 12.5px/1 inherit;cursor:pointer}',
    '.ccm-bulle-ouvrir:hover{filter:brightness(1.08)}',
    '.ccm-bulle-fermer{position:absolute;top:3px;right:5px;background:none;border:0;color:#eef7f5;',
      'opacity:.5;font-size:17px;line-height:1;cursor:pointer;padding:4px}',
    '.ccm-bulle-fermer:hover{opacity:1}',

    /* --- colere : il rougit, il fume, il jette sa valise --- */
    '.ccm-svg .ccm-tete .ccm-peau,.ccm-svg .ccm-tete .ccm-oreille{transition:fill .25s ease}',
    '.ccm-svg .ccm-vapeur{opacity:0;transition:opacity .3s ease;transform-box:fill-box;transform-origin:50% 100%}',
    '.ccm-svg .ccm-vapeur circle{fill:#ff9c86}',
    '.ccm-root.ccm-enerve .ccm-tete .ccm-peau{fill:#e2564a}',
    '.ccm-root.ccm-enerve .ccm-tete .ccm-oreille{fill:#d9453a}',
    '.ccm-root.ccm-enerve .ccm-joue{fill:#d1604f;opacity:.8}',
    '.ccm-root.ccm-enerve .ccm-sourcil{stroke:#7d1a12}',
    '.ccm-root.ccm-enerve .ccm-bouche{stroke:#8d1f16;stroke-width:2.6}',
    '.ccm-root.ccm-enerve .ccm-tete{animation:ccmFurie .46s ease-in-out infinite}',
    '.ccm-root.ccm-enerve .ccm-body{animation:ccmTremble .13s linear infinite}',
    '.ccm-root.ccm-enerve .ccm-vapeur{opacity:.95;animation:ccmVapeur 1.3s ease-in-out infinite}',
    '.ccm-root.ccm-jette .ccm-valise,.ccm-root.ccm-reprise .ccm-valise{transform-origin:50% 55%}',
    '.ccm-root.ccm-jette .ccm-valise{animation:ccmJet 1.15s cubic-bezier(.25,.1,.55,1) forwards}',
    '.ccm-root.ccm-jette .ccm-bras-av{animation:ccmLance 1.15s ease-out}',
    '.ccm-root.ccm-jette .ccm-bras-ar{animation:ccmLanceAr .9s ease-out}',
    '.ccm-root.ccm-jette .ccm-sac{animation:ccmSacSecoue .9s ease-out}',
    '.ccm-root.ccm-reprise .ccm-valise{animation:ccmReprend .48s ease-out forwards}',
    '.ccm-colere{position:absolute;left:50%;bottom:calc(100% - 2px);transform:translate(-50%,10px) scale(.88);',
      'opacity:0;pointer-events:none;padding:15px 22px;width:max-content;max-width:min(78vw,300px);',
      'transition:opacity .22s ease,transform .22s ease;z-index:3}',
    '.ccm-root.ccm-crie .ccm-colere{opacity:1;transform:translate(-50%,0) scale(1)}',
    '.ccm-colere-fond{position:absolute;left:0;top:0;width:100%;height:100%;display:block}',
    '.ccm-colere-etoile{fill:#2b0f0c;stroke:#ff5f49;stroke-width:2.5;stroke-linejoin:round;vector-effect:non-scaling-stroke}',
    '.ccm-colere-txt{position:relative;display:block;font:800 15px/1.15 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;',
      'color:#ff9c86;letter-spacing:.6px;white-space:nowrap;text-align:center}',
    /* --- il reflechit un instant --- */
    '.ccm-root.ccm-reflechit .ccm-tete{animation:ccmReflechit 2.6s ease-in-out}',
    '.ccm-root.ccm-reflechit .ccm-body{animation:ccmRespire 3.2s ease-in-out infinite}',
    /* --- il s'est pose dans son coin : il vit au ralenti --- */
    '.ccm-root.ccm-pose .ccm-body{animation:ccmRespire 4.4s ease-in-out infinite}',
    '.ccm-root.ccm-pose .ccm-tete{animation:ccmBalance 7.5s ease-in-out infinite}',

    /* --- on l'attrape : il flotte, effraye, vue de FACE ------------------ */
    '.ccm-svg .ccm-face-corps{opacity:0;pointer-events:none;transition:opacity .16s ease}',
    '.ccm-root.ccm-flotte .ccm-svg .ccm-face-corps{opacity:1}',
    '.ccm-svg .ccm-body{transition:opacity .16s ease}',
    '.ccm-root.ccm-flotte .ccm-svg .ccm-body{opacity:0}',
    '.ccm-svg .ccmf-derriere .ccm-pantalon{fill:#123743}',
    '.ccm-svg .ccmf-derriere .ccm-chaussure{fill:#c9d3d8}',
    '.ccm-svg .ccmf-sombre .ccm-manche{fill:#0b5449}',
    '.ccm-svg .ccmf-bouche-ronde{fill:#8d1f16}',
    '.ccm-svg .ccmf-bouche-fond{fill:#5a0d08}',
    '.ccm-svg .ccmf-goutte{fill:#8fd8ea;opacity:.9}',
    '.ccm-svg .ccmf-arc{fill:none;stroke:#bfeee6;stroke-width:1.6;opacity:0}',
    '.ccm-svg .ccmf-jambe,.ccm-svg .ccmf-bras,.ccm-svg .ccmf-tete,.ccm-svg .ccmf-valise,',
    '.ccm-svg .ccmf-ombre,.ccm-svg .ccmf-bouche-ronde,.ccm-svg .ccmf-goutte,.ccm-svg .ccmf-arc{transform-box:fill-box}',
    '.ccm-svg .ccmf-jambe{transform-origin:50% 3%}',
    '.ccm-svg .ccmf-bras{transform-origin:50% 5%}',
    '.ccm-svg .ccmf-tete{transform-origin:50% 92%}',
    '.ccm-svg .ccmf-valise{transform-origin:88% 2%}',
    '.ccm-svg .ccmf-ombre,.ccm-svg .ccmf-bouche-ronde,.ccm-svg .ccmf-goutte,.ccm-svg .ccmf-arc{transform-origin:50% 50%}',
    '.ccm-root.ccm-flotte .ccmf-corps{animation:ccmFuitFlotte 1.5s ease-in-out infinite}',
    '.ccm-root.ccm-flotte .ccmf-tremble{animation:ccmFuitTremble .1s linear infinite}',
    '.ccm-root.ccm-flotte .ccmf-tete{animation:ccmFuitTete 1.05s ease-in-out infinite}',
    '.ccm-root.ccm-flotte .ccmf-bras-d{animation:ccmFuitBras .42s ease-in-out infinite alternate}',
    '.ccm-root.ccm-flotte .ccmf-jambe-g{animation:ccmFuitJambe .62s ease-in-out infinite alternate}',
    '.ccm-root.ccm-flotte .ccmf-jambe-d{animation:ccmFuitJambeB .58s ease-in-out infinite alternate}',
    '.ccm-root.ccm-flotte .ccmf-valise{animation:ccmFuitValise .74s ease-in-out infinite alternate}',
    '.ccm-root.ccm-flotte .ccmf-ombre{animation:ccmFuitOmbre 1.5s ease-in-out infinite}',
    '.ccm-root.ccm-flotte .ccmf-bouche-ronde{animation:ccmFuitBouche .66s ease-in-out infinite}',
    '.ccm-root.ccm-flotte .ccmf-goutte{animation:ccmFuitGoutte 1.3s ease-in-out infinite}',
    '.ccm-root.ccm-flotte .ccmf-goutte-2{animation-delay:.45s}',
    '.ccm-root.ccm-flotte .ccmf-goutte-3{animation-delay:.9s}',
    '.ccm-root.ccm-flotte .ccmf-arc{animation:ccmFuitArc 1.05s ease-out infinite}',
    '.ccm-root.ccm-flotte .ccmf-arc-2{animation-delay:.4s}',

    /* --- on le tient, puis on le depose ou l'on veut dans la page -------- */
    '.ccm-perso{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}',
    '.ccm-perso.ccm-saisi{cursor:grabbing}',
    '.ccm-perso.ccm-libre{position:fixed;bottom:auto}',
    '.ccm-perso.ccm-bulle-bas .ccm-bulle{top:calc(100% - 6px);bottom:auto;transform:translate(-50%,-8px)}',
    '.ccm-root.ccm-parle .ccm-perso.ccm-bulle-bas .ccm-bulle{transform:translate(-50%,0)}',
    '.ccm-perso.ccm-bulle-bas .ccm-bulle:after{top:-7px;bottom:auto;transform:translateX(-50%) rotate(225deg)}',
    '.ccm-perso.ccm-bulle-bas .ccm-colere{top:calc(100% - 4px);bottom:auto}',

    /* --- les mouvements de la vue de face ------------------------------- */
    '@keyframes ccmFuitFlotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}',
    '@keyframes ccmFuitTremble{0%,100%{transform:translate(.9px,0)}50%{transform:translate(-.9px,0)}}',
    '@keyframes ccmFuitTete{0%,100%{transform:rotate(-4.5deg)}50%{transform:rotate(4.5deg)}}',
    '@keyframes ccmFuitBras{0%{transform:rotate(-6deg)}100%{transform:rotate(9deg)}}',
    '@keyframes ccmFuitJambe{0%{transform:rotate(-13deg)}100%{transform:rotate(11deg)}}',
    '@keyframes ccmFuitJambeB{0%{transform:rotate(11deg)}100%{transform:rotate(-13deg)}}',
    '@keyframes ccmFuitValise{0%{transform:rotate(-2.5deg)}100%{transform:rotate(2.5deg)}}',
    '@keyframes ccmFuitOmbre{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(.76);opacity:.15}}',
    '@keyframes ccmFuitBouche{0%,100%{transform:scale(1,1)}50%{transform:scale(1.14,1.26)}}',
    '@keyframes ccmFuitGoutte{0%{transform:translate(0,0) scale(.5);opacity:0}30%{opacity:.9}100%{transform:translate(5px,-22px) scale(1);opacity:0}}',
    '@keyframes ccmFuitArc{0%{transform:scale(.4);opacity:.85}100%{transform:scale(1.6);opacity:0}}',

    /* petits ecrans */
    '@media (max-width:620px){.ccm-root{height:152px}.ccm-perso{width:88px;height:124px;bottom:6px}}',
    '@media (max-width:620px){.ccm-bulle{font-size:13px;max-width:70vw}}',

    /* mode calme du navigateur = personnage immobile */
    '@media (prefers-reduced-motion:reduce){.ccm-root .ccm-svg *{animation:none !important}}',

    /* animations */
    '@keyframes ccmPasAv{0%,100%{transform:rotate(15deg)}50%{transform:rotate(-17deg)}}',
    '@keyframes ccmPasAr{0%,100%{transform:rotate(-15deg)}50%{transform:rotate(17deg)}}',
    '@keyframes ccmBrasAv{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(16deg)}}',
    '@keyframes ccmBrasAr{0%,100%{transform:rotate(14deg)}50%{transform:rotate(-14deg)}}',
    '@keyframes ccmFlotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.4px)}}',
    '@keyframes ccmValise{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.5deg)}}',
    '@keyframes ccmRespire{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-1px) scaleY(1.012)}}',
    '@keyframes ccmBalance{0%,100%{transform:rotate(0)}30%{transform:rotate(-2deg)}70%{transform:rotate(2deg)}}',
    '@keyframes ccmRegarde{0%{transform:rotate(0)}22%{transform:rotate(-13deg)}46%{transform:rotate(-13deg)}',
      '70%{transform:rotate(9deg)}86%{transform:rotate(9deg)}100%{transform:rotate(0)}}',
    '@keyframes ccmSalut{0%{transform:rotate(-8deg)}16%{transform:rotate(-128deg)}28%{transform:rotate(-106deg)}',
      '40%{transform:rotate(-128deg)}52%{transform:rotate(-106deg)}64%{transform:rotate(-128deg)}',
      '80%{transform:rotate(-132deg)}100%{transform:rotate(-8deg)}}',
    '@keyframes ccmEcoute{0%,100%{transform:rotate(0)}45%{transform:rotate(-6deg)}75%{transform:rotate(2deg)}}',
    '@keyframes ccmFurie{0%,100%{transform:rotate(-3.5deg)}50%{transform:rotate(3.5deg)}}',
    '@keyframes ccmTremble{0%,100%{transform:translate(0,0)}25%{transform:translate(-.9px,0)}75%{transform:translate(.9px,0)}}',
    '@keyframes ccmVapeur{0%{transform:translate(0,0) scale(.6);opacity:.5}55%{opacity:.95}100%{transform:translate(4px,-12px) scale(1.2);opacity:0}}',
    '@keyframes ccmJet{0%{transform:translate(0,0) rotate(0)}14%{transform:translate(-9px,-13px) rotate(-18deg)}',
      '34%{transform:translate(74px,-66px) rotate(170deg)}56%{transform:translate(142px,-24px) rotate(302deg)}',
      '74%{transform:translate(170px,-2px) rotate(396deg)}84%{transform:translate(170px,-15px) rotate(436deg)}',
      '93%{transform:translate(170px,0) rotate(452deg)}100%{transform:translate(170px,0) rotate(450deg)}}',
    '@keyframes ccmLance{0%{transform:rotate(0)}12%{transform:rotate(54deg)}26%{transform:rotate(-104deg)}',
      '42%{transform:rotate(-118deg)}70%{transform:rotate(-58deg)}100%{transform:rotate(0)}}',
    '@keyframes ccmLanceAr{0%{transform:rotate(0)}14%{transform:rotate(36deg)}30%{transform:rotate(-70deg)}',
      '60%{transform:rotate(-36deg)}100%{transform:rotate(0)}}',
    '@keyframes ccmSacSecoue{0%{transform:rotate(0)}18%{transform:rotate(-9deg)}34%{transform:rotate(7deg)}52%{transform:rotate(-5deg)}100%{transform:rotate(0)}}',
    '@keyframes ccmReprend{0%{transform:translate(170px,0) rotate(450deg)}100%{transform:translate(0,0) rotate(360deg)}}',
    '@keyframes ccmReflechit{0%{transform:rotate(0)}18%{transform:rotate(9deg)}58%{transform:rotate(9deg)}84%{transform:rotate(2deg)}100%{transform:rotate(0)}}',
    '@keyframes ccmCligne{0%,92%,100%{transform:scaleY(0)}94.5%,96.5%{transform:scaleY(1)}}'
  ].join('');

  /* ---------------------------------------------------------------- outils -- */
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function injecterCss() {
    if (document.getElementById('ccm-style')) return;
    var s = document.createElement('style');
    s.id = 'ccm-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function estFerme() {
    try {
      var t = localStorage.getItem(CLE_FERME);
      if (!t) return false;
      if (Date.now() - parseInt(t, 10) > JOURS * 864e5) return false;
      return true;
    } catch (e) { return false; }
  }

  function marquerFerme() {
    try { localStorage.setItem(CLE_FERME, String(Date.now())); } catch (e) {}
  }

  function oublierFermeture() {
    try { localStorage.removeItem(CLE_FERME); } catch (e) {}
  }

  /* ------------------------------------------------------------- la vie ---- */
  function demarrer(o) {
    if (estFerme()) return null;

    injecterCss();

    var delai   = typeof o.delai === 'number' ? o.delai : 7000;
    var vitesse = typeof o.vitesse === 'number' ? o.vitesse : 46;
    var texte   = o.salutation || 'Bonjour ! Vous cherchez quelque chose ? Je peux vous aider.';
    var calme   = !!o.calme || document.body.classList.contains('is-calm');

    var root  = document.createElement('div');
    root.className = 'ccm-root' + (calme ? ' ccm-fige' : '');

    var perso = document.createElement('div');
    perso.className = 'ccm-perso';
    perso.setAttribute('role', 'button');
    perso.setAttribute('tabindex', '0');
    perso.setAttribute('aria-label', 'Le petit voyageur ColisConnect : demander de l\u2019aide');
    perso.innerHTML = SVG + BULLE + COLERE;
    ancre = perso.querySelector('.ccm-valise-ancre');
    colere = perso.querySelector('.ccm-colere');

    root.appendChild(perso);
    document.body.appendChild(root);

    var bulleTxt   = perso.querySelector('.ccm-bulle-texte');
    var bulleOuvrir= perso.querySelector('.ccm-bulle-ouvrir');
    var bulleX     = perso.querySelector('.ccm-bulle-fermer');
    bulleTxt.textContent = texte;

    /* --- etats -------------------------------------------------------- */
    var ETATS = ['ccm-marche','ccm-repos','ccm-regarde','ccm-reflechit','ccm-salue','ccm-parle','ccm-ecoute','ccm-pose'];
    function etat(c) {
      root.classList.remove.apply(root.classList, ETATS);
      if (c) root.classList.add(c);
    }

    /* --- deplacement -------------------------------------------------- */
    var x = 0, largeur = 110, marge = 14, cible = 0, depart = 0, t0 = 0, duree = 0, raf = null, enMarche = false;
    var arret = false;                       // l'automate reprend la main
    var occupe = false;                      // une scene est en cours (salut, colere...)
    var pose   = false;
    var detache = false;                     // on l'a depose quelque part : il reste la                      // il s'est pose dans son coin : fini de marcher
    var minuteurRepos = null, minuteurPose = null;
    var ancre, colere, compense = false, xRef = 0;

    function bornes() {
      largeur = perso.offsetWidth || 110;
      var vw = window.innerWidth;
      return { min: marge, max: Math.max(marge + 40, vw - largeur - marge) };
    }
    function poser(v) { x = v; perso.style.left = Math.round(v) + 'px'; }

    /* quand il part rechercher sa valise, elle doit rester posee au sol :
       on compense son deplacement a l'ecran, en tenant compte du miroir. */
    function majAncre() {
      if (!ancre) return;
      var l = largeur || 110;
      var facteur = perso.classList.contains('ccm-vers-gauche') ? 1 : -1;
      ancre.style.transform = 'translateX(' + (facteur * (x - xRef) * (110 / l)).toFixed(2) + 'px)';
    }

    /* une bulle large ne doit jamais sortir de l'ecran */
    function cadrerBulle(el) {
      if (!el) return;
      var vw = window.innerWidth, g = 8, w = el.offsetWidth;
      if (!w) return;
      var gauche = x + (perso.offsetWidth || 110) / 2 - w / 2;
      var dx = 0;
      if (gauche < g) dx = g - gauche;
      else if (gauche + w > vw - g) dx = (vw - g) - (gauche + w);
      el.style.marginLeft = dx ? Math.round(dx) + 'px' : '';
      /* colle en haut de l'ecran : la bulle passe sous le personnage */
      perso.classList.toggle('ccm-bulle-bas', perso.getBoundingClientRect().top < 150);
    }

    /* il la ramasse : elle revient doucement dans sa main */
    function lacherAncre() {
      compense = false;
      if (!ancre) return;
      ancre.style.transition = 'transform .48s ease-out';
      ancre.style.transform = 'translateX(0px)';
      setTimeout(function () {
        if (!ancre) return;
        ancre.style.transition = '';
        ancre.style.transform = '';
      }, 520);
    }

    function tournerVers(sens) {              // sens 1 = droite, -1 = gauche
      if (sens < 0) perso.classList.add('ccm-vers-gauche');
      else perso.classList.remove('ccm-vers-gauche');
    }

    function marcheVers(cible2, rapidite) {
      var b = bornes();
      cible = Math.min(b.max, Math.max(b.min, cible2));
      var sens = cible > x ? 1 : -1;
      tournerVers(sens);
      depart = x; t0 = 0; duree = Math.max(360, Math.abs(cible - x) / (vitesse * (rapidite || 1)) * 1000);
      enMarche = true;
      etat('ccm-marche');
      raf = requestAnimationFrame(avance);
    }

    function avance(ts) {
      if (!enMarche) return;
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / duree);
      poser(depart + (cible - depart) * p);
      if (compense) majAncre();
      if (p < 1) raf = requestAnimationFrame(avance);
      else { enMarche = false; etat('ccm-repos'); repos(); }
    }

    function stopper() {
      enMarche = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      if (compense) {
        compense = false;
        if (ancre) { ancre.style.transition = ''; ancre.style.transform = ''; }
      }
      etat('ccm-repos');
    }

    function libre() { return !arret && !occupe && !pose; }

    /* un vrai personnage fait parfois... rien. C'est ce qui le rend vivant. */
    function repos() {
      if (!libre()) return;
      if (minuteurRepos) clearTimeout(minuteurRepos);
      minuteurRepos = setTimeout(function () {
        if (!libre()) return;
        var b = bornes(), r = Math.random();
        if (detache) {                              // depose dans la page : il reste ou on l'a mis
          if (r < 0.5) regarde(); else reflechit();
          return;
        }
        if (r < 0.22) regarde();                                    // il regarde autour de lui
        else if (r < 0.36) reflechit();                             // il reflechit un instant
        else marcheVers(b.min + Math.random() * (b.max - b.min));    // il repart
      }, 900 + Math.random() * 4200);
    }

    function regarde() {
      etat('ccm-regarde');
      setTimeout(function () {
        if (!libre()) return;
        etat('ccm-repos');
        repos();
      }, 1900);
    }

    function reflechit() {
      etat('ccm-reflechit');
      setTimeout(function () {
        if (!libre()) return;
        etat('ccm-repos');
        repos();
      }, 2600);
    }

    /* --- le grand moment : il remarque le visiteur -------------------- */
    var dejaSalue = false;
    function saluer() {
      if (arret || dejaSalue) return;
      if (occupe) { minuteurSalut = setTimeout(saluer, 6000); return; }   // occupe : on reprend plus tard
      dejaSalue = true; occupe = true;
      stopper();
      setTimeout(function () {
        etat('ccm-regarde');
        setTimeout(function () {
          etat('ccm-salue');
          setTimeout(function () {
            if (arret) return;
            root.classList.add('ccm-parle');
            cadrerBulle(perso.querySelector('.ccm-bulle'));
            setTimeout(function () {
              if (arret) return;
              root.classList.remove('ccm-parle');
              occupe = false;
              repos();
              /* il vit encore un peu, puis il va se poser dans son coin */
              minuteurPose = setTimeout(sePoser, 45000);
            }, 17000);
          }, 1000);
        }, 1200);
      }, 420);
    }

    /* --- la grosse colere : il jette sa valise ------------------------ */
    function dureeVers(c) { return Math.max(360, Math.abs(c - x) / vitesse * 1000); }

    function finColere() {
      root.classList.remove('ccm-enerve', 'ccm-crie');
      occupe = false;
      etat('ccm-repos');
      if (!dejaSalue && !arret) minuteurSalut = setTimeout(saluer, 4000);
      repos();
    }

    function enrager() {
      if (arret || occupe || pose) return false;
      occupe = true;
      if (minuteurSalut) clearTimeout(minuteurSalut);
      if (minuteurRepos) clearTimeout(minuteurRepos);
      if (minuteurPose) clearTimeout(minuteurPose);
      stopper();
      root.classList.remove('ccm-parle');

      var b = bornes();
      var sens = (x < (b.min + b.max) / 2) ? 1 : -1;      // il se tourne vers le plus grand espace
      tournerVers(sens);
      var dist = Math.round(170 * ((perso.offsetWidth || 110) / 110));
      var atterrit = Math.min(b.max, Math.max(b.min, x + sens * dist));
      var dMarche = dureeVers(atterrit);
      var immobile = reduit || root.classList.contains('ccm-fige');   // mode calme : pas de jet

      etat('ccm-enerve');
      setTimeout(function () {
        if (arret) return;
        if (!immobile) root.classList.add('ccm-jette');               // il lance la valise
        setTimeout(function () {
          if (arret) return;
          root.classList.add('ccm-crie');
          cadrerBulle(colere);                             // la bulle "@&%#*!"
          setTimeout(function () {
            if (arret) return;
            root.classList.remove('ccm-crie');
            if (immobile) { finColere(); return; }
            etat('ccm-repos');
            xRef = x; compense = true;
            if (ancre) ancre.style.transition = 'none';
            marcheVers(atterrit);                                    // il va la rechercher
            setTimeout(function () {
              if (arret) return;
              lacherAncre();
              root.classList.add('ccm-reprise');                      // il la ramasse
              setTimeout(function () {
                if (arret) return;
                root.classList.remove('ccm-reprise', 'ccm-jette');
                finColere();
              }, 500);
            }, dMarche + 320);
          }, 2700);
        }, immobile ? 300 : 1150);
      }, 650);
      return true;
    }

    /* --- apres un moment, il va se poser dans son coin ---------------- */
    function sePoser() {
      if (arret || occupe || pose || detache) return;
      pose = true;
      var b = bornes();
      if (Math.abs(x - b.min) < 12) { stopper(); etat('ccm-pose'); return; }
      var d = dureeVers(b.min) / 2;      // il presse le pas pour rejoindre son coin
      etat('ccm-repos');
      marcheVers(b.min, 2);
      setTimeout(function () {
        if (arret) return;
        stopper();
        etat('ccm-pose');
      }, d + 320);
    }

    /* --- interactions ------------------------------------------------- */
    function ouvrirChat() {
      root.classList.remove('ccm-parle');
      stopper();                 // on l'arrete avant de poser l'etat d'ecoute
      etat('ccm-ecoute');        // il incline la tete : il ecoute
      if (typeof o.onChat === 'function') o.onChat();
    }

    function ranger() {
      arret = true;
      stopper();
      marquerFerme();
      root.classList.remove('ccm-parle', 'ccm-ecoute');
      perso.classList.add('ccm-parti');
      setTimeout(function () { if (root.parentNode) root.parentNode.removeChild(root); }, 700);
    }

    perso.addEventListener('click', auClic);
    perso.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrirChat(); }
    });
    bulleOuvrir.addEventListener('click', function (e) { e.stopPropagation(); ouvrirChat(); });
    bulleX.addEventListener('click', function (e) { e.stopPropagation(); ranger(); });

    /* le clic sur la bulle ne doit pas etre avale par le personnage */
    perso.querySelector('.ccm-bulle').addEventListener('click', function (e) { e.stopPropagation(); });

    /* --- appui long : on l'attrape, il flotte (vue de face, effraye) et on
           le depose ou l'on veut dans la page. A l'atterrissage, il rale. -- */
    var saisi = false, timerAppui = null, clicJuste = false;   // (detache vit plus haut)
    var appuiX = 0, appuiY = 0, decX = 0, decY = 0;

    function dansLaFenetre(v, a, b) { return v < a ? a : (v > b ? b : v); }

    function saisir(px, py, idPointeur) {
      if (arret) return false;
      arret = true;                            // fige la scene en cours : on le tient
      saisi = true; occupe = true; pose = false; compense = false;
      if (minuteurSalut) clearTimeout(minuteurSalut);
      if (minuteurRepos) clearTimeout(minuteurRepos);
      if (minuteurPose)  clearTimeout(minuteurPose);
      stopper();
      root.classList.remove('ccm-parle', 'ccm-salue');
      var r = perso.getBoundingClientRect();
      decX = px - r.left;
      decY = py - r.top;
      perso.classList.add('ccm-libre', 'ccm-saisi');
      perso.style.left = Math.round(r.left) + 'px';
      perso.style.top  = Math.round(r.top)  + 'px';
      x = r.left;
      detache = true;
      perso.classList.remove('ccm-vers-gauche');        // vue de face : plus de miroir
      root.classList.add('ccm-flotte');                 // il flotte, effraye
      etat('');
      if (ancre && ancre.style) ancre.style.transform = '';
      try { if (perso.setPointerCapture && idPointeur != null) perso.setPointerCapture(idPointeur); }
      catch (err) {}
      return true;
    }

    function suivre(px, py) {
      var l = perso.offsetWidth || 110, h = perso.offsetHeight || 155;
      var nl = dansLaFenetre(px - decX, 2, Math.max(2, window.innerWidth  - l - 2));
      var nt = dansLaFenetre(py - decY, 2, Math.max(2, window.innerHeight - h - 2));
      perso.style.left = Math.round(nl) + 'px';
      perso.style.top  = Math.round(nt) + 'px';
      x = nl;
    }

    function relacher() {
      if (!saisi) return false;
      arret = false;                           // les scenes peuvent reprendre
      saisi = false; occupe = false;
      perso.classList.remove('ccm-saisi');
      root.classList.remove('ccm-flotte');
      clicJuste = true;                                        // ce clic n'ouvre pas le chat
      setTimeout(function () { clicJuste = false; }, 480);
      enrager();                                           // il n'aime pas du tout etre attrape
      return true;
    }

    function choper(px, py) {
      var l = perso.offsetWidth || 110, h = perso.offsetHeight || 155;
      if (!saisir(px, py, null)) return false;
      decX = l / 2; decY = h / 2;                              // il se centre sur le doigt
      suivre(px, py);
      return true;
    }

    function placer(px, py) { if (!choper(px, py)) return false; return relacher(); }

    function annulerAppui() { if (timerAppui) { clearTimeout(timerAppui); timerAppui = null; } }
    function auClic() { if (clicJuste || saisi) return; ouvrirChat(); }

    perso.addEventListener('pointerdown', function (e) {
      if (arret) return;
      if (e.button && e.button !== 0) return;                  // bouton droit : on laisse passer
      appuiX = e.clientX; appuiY = e.clientY; clicJuste = false;
      annulerAppui();
      timerAppui = setTimeout(function () {                    // appui long = 0,42 s
        timerAppui = null;
        saisir(appuiX, appuiY, e.pointerId);
      }, 420);
    });

    perso.addEventListener('pointermove', function (e) {
      if (!timerAppui) return;
      if (Math.abs(e.clientX - appuiX) > 10 || Math.abs(e.clientY - appuiY) > 10) annulerAppui();
    });

    perso.addEventListener('pointerup', annulerAppui);
    perso.addEventListener('pointercancel', annulerAppui);
    perso.addEventListener('contextmenu', function (e) { if (saisi) e.preventDefault(); });

    document.addEventListener('pointermove', function (e) { if (saisi) suivre(e.clientX, e.clientY); });
    document.addEventListener('pointerup', function () { if (saisi) relacher(); });
    document.addEventListener('pointercancel', function () { if (saisi) relacher(); });

    /* --- mise en route ------------------------------------------------ */
    var minuteurSalut = null;
    function lancer() {
      var b = bornes();
      poser(b.max - 10);
      tournerVers(-1);
      root.classList.add('ccm-pret');
      etat('ccm-repos');
      if (reduit || root.classList.contains('ccm-fige')) {
        setTimeout(saluer, Math.min(delai, 4000));   // mode calme : il salue, sans marcher
        return;
      }
      setTimeout(function () {
        if (arret) return;
        etat('ccm-repos');
        marcheVers(b.min + (b.max - b.min) * 0.45);
        minuteurSalut = setTimeout(saluer, delai);
      }, 900);
    }

    /* on ne marche pas dans un onglet cache ; on reprend au retour */
    document.addEventListener('visibilitychange', function () {
      if (arret) return;
      if (document.hidden) stopper();
      else if (!dejaSalue) repos();
    });

    /* mode calme du site : on fige tout, immediatement */
    var obs = null;
    if (window.MutationObserver) {
      obs = new MutationObserver(function () {
        var fige = document.body.classList.contains('is-calm');
        root.classList.toggle('ccm-fige', fige);
        if (fige) stopper();
      });
      obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    lancer();

    return {
      racine: root,
      saluer: saluer,
      enrager: enrager,
      poser: sePoser,
      choper: choper,
      relacher: relacher,
      placer: placer,
      ranger: ranger,
      figer: function (v) {
        root.classList.toggle('ccm-fige', v !== false);
        if (v !== false) stopper(); else repos();
      },
      detruire: function () { arret = true; occupe = true; stopper(); if (obs) obs.disconnect();
        if (minuteurSalut) clearTimeout(minuteurSalut);
        if (minuteurRepos) clearTimeout(minuteurRepos);
        if (minuteurPose) clearTimeout(minuteurPose);
        if (root.parentNode) root.parentNode.removeChild(root); }
    };
  }

  /* ---------------------------------------------------------------- API ---- */
  var courant = null;

  window.CCMascotte = {
    version: VERSION,
    mount: function (opts) {
      if (courant) courant.detruire();
      courant = demarrer(opts || {});
      return courant;
    },
    relancer: function (opts) {
      oublierFermeture();
      if (courant) courant.detruire();
      courant = demarrer(opts || {});
      return courant;
    },
    ranger: function () { if (courant) courant.ranger(); },
    enrager: function () { return courant ? courant.enrager() : false; },
    poser: function () { if (courant) courant.poser(); },
    choper: function (x, y) { return courant ? courant.choper(x, y) : false; },
    relacher: function () { return courant ? courant.relacher() : false; },
    placer: function (x, y) { return courant ? courant.placer(x, y) : false; },
    monte: function () { return !!courant; }
  };

  function autoMonte() {
    /* si la page a deja configure le personnage, on ne l'ecrase pas */
    if (courant) return;
    if (document.body && !estFerme()) window.CCMascotte.mount({});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMonte);
  else autoMonte();
})();
