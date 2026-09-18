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
   ========================================================================== */
(function () {
  'use strict';

  var VERSION   = '1.0.0';
  var CLE_FERME = 'cc-mascotte-ferme';   // "ne plus afficher" (30 jours)
  var JOURS     = 30;

  /* ------------------------------------------------------- le personnage -- */
  /* Vue de profil, tourne vers la droite. viewBox 110 x 155.
     Ordre de dessin = ordre d'empilement (du fond vers l'avant).            */
  var SVG = [
    '<svg class="ccm-svg" viewBox="0 0 110 155" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">',
      '<g class="ccm-body">',

        /* ombre au sol : le pose par terre */
        '<ellipse class="ccm-ombre" cx="54" cy="145" rx="32" ry="4.2"/>',

        /* valise tiree, derriere lui */
        '<g class="ccm-valise">',
          '<rect class="ccm-valise-poignee" x="30" y="88" width="5" height="14" rx="2.5"/>',
          '<rect class="ccm-valise-barre"   x="22" y="84" width="20" height="6" rx="3"/>',
          '<rect class="ccm-valise-caisse"  x="12" y="100" width="28" height="38" rx="7"/>',
          '<rect class="ccm-valise-sangle"  x="12" y="112" width="28" height="12"/>',
          '<rect class="ccm-valise-loquer"  x="21" y="115" width="9" height="4" rx="2"/>',
          '<circle class="ccm-valise-roue" cx="19" cy="140" r="3.6"/>',
          '<circle class="ccm-valise-roue" cx="33" cy="140" r="3.6"/>',
        '</g>',

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

        /* bras avant : c'est lui qui salue */
        '<g class="ccm-bras ccm-bras-av">',
          '<rect class="ccm-manche" x="66" y="70" width="8" height="26" rx="4"/>',
          '<circle class="ccm-peau" cx="70" cy="98" r="5.4"/>',
        '</g>',

      '</g>',
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
    perso.innerHTML = SVG + BULLE;

    root.appendChild(perso);
    document.body.appendChild(root);

    var bulleTxt   = perso.querySelector('.ccm-bulle-texte');
    var bulleOuvrir= perso.querySelector('.ccm-bulle-ouvrir');
    var bulleX     = perso.querySelector('.ccm-bulle-fermer');
    bulleTxt.textContent = texte;

    /* --- etats -------------------------------------------------------- */
    var ETATS = ['ccm-marche', 'ccm-repos', 'ccm-regarde', 'ccm-salue', 'ccm-parle', 'ccm-ecoute'];
    function etat(c) {
      root.classList.remove.apply(root.classList, ETATS);
      if (c) root.classList.add(c);
    }

    /* --- deplacement -------------------------------------------------- */
    var x = 0, largeur = 110, marge = 14, cible = 0, depart = 0, t0 = 0, duree = 0, raf = null, enMarche = false;
    var arret = false;                       // l'automate reprend la main

    function bornes() {
      largeur = perso.offsetWidth || 110;
      var vw = window.innerWidth;
      return { min: marge, max: Math.max(marge + 40, vw - largeur - marge) };
    }
    function poser(v) { x = v; perso.style.left = Math.round(v) + 'px'; }

    function tournerVers(sens) {              // sens 1 = droite, -1 = gauche
      if (sens < 0) perso.classList.add('ccm-vers-gauche');
      else perso.classList.remove('ccm-vers-gauche');
    }

    function marcheVers(cible2) {
      var b = bornes();
      cible = Math.min(b.max, Math.max(b.min, cible2));
      var sens = cible > x ? 1 : -1;
      tournerVers(sens);
      depart = x; t0 = 0; duree = Math.max(360, Math.abs(cible - x) / vitesse * 1000);
      enMarche = true;
      etat('ccm-marche');
      raf = requestAnimationFrame(avance);
    }

    function avance(ts) {
      if (!enMarche) return;
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / duree);
      poser(depart + (cible - depart) * p);
      if (p < 1) raf = requestAnimationFrame(avance);
      else { enMarche = false; etat('ccm-repos'); repos(); }
    }

    function stopper() {
      enMarche = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      etat('ccm-repos');
    }

    function repos() {
      if (arret) return;
      setTimeout(function () {
        if (arret) return;
        var b = bornes();
        if (Math.random() < 0.34) regarde();
        marcheVers(b.min + Math.random() * (b.max - b.min));
      }, 1300 + Math.random() * 2400);
    }

    function regarde() {
      etat('ccm-regarde');
      setTimeout(function () { if (!arret) etat('ccm-repos'); }, 1900);
    }

    /* --- le grand moment : il remarque le visiteur -------------------- */
    var dejaSalue = false;
    function saluer() {
      if (dejaSalue || arret) return;
      dejaSalue = true;
      stopper();
      setTimeout(function () {
        etat('ccm-regarde');
        setTimeout(function () {
          etat('ccm-salue');
          setTimeout(function () {
            if (arret) return;
            root.classList.add('ccm-parle');
            setTimeout(function () {
              if (arret) return;
              root.classList.remove('ccm-parle');
              repos();
            }, 17000);
          }, 1000);
        }, 1200);
      }, 420);
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

    perso.addEventListener('click', ouvrirChat);
    perso.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrirChat(); }
    });
    bulleOuvrir.addEventListener('click', function (e) { e.stopPropagation(); ouvrirChat(); });
    bulleX.addEventListener('click', function (e) { e.stopPropagation(); ranger(); });

    /* le clic sur la bulle ne doit pas etre avale par le personnage */
    perso.querySelector('.ccm-bulle').addEventListener('click', function (e) { e.stopPropagation(); });

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
      ranger: ranger,
      figer: function (v) {
        root.classList.toggle('ccm-fige', v !== false);
        if (v !== false) stopper(); else repos();
      },
      detruire: function () { arret = true; stopper(); if (obs) obs.disconnect();
        if (minuteurSalut) clearTimeout(minuteurSalut);
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
