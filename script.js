/* ============================================
   LYNASOFT GAMES — Logique principale
   Navigation multi-jeux + Devine le Nombre
   JavaScript vanilla ES6
   ============================================ */

// ============================================
// MODULE 1 : NAVIGATION ENTRE ECRANS
// ============================================

const Nav = (() => {
  const TRANSITION_MS = 300;

  /** Map des couleurs d'accent par jeu */
  const ACCENT_COLORS = {
    'menu':         { accent: '#6c5ce7', glow: 'rgba(108, 92, 231, 0.2)' },
    'guess-number': { accent: '#6c5ce7', glow: 'rgba(108, 92, 231, 0.2)' },
    'click-speed':  { accent: '#ffa94d', glow: 'rgba(255, 169, 77, 0.2)' },
    'pfc':          { accent: '#00cec9', glow: 'rgba(0, 206, 201, 0.2)' },
    'pendu':        { accent: '#ff6b6b', glow: 'rgba(255, 107, 107, 0.2)' },
    'snake':        { accent: '#51cf66', glow: 'rgba(81, 207, 102, 0.2)' },
    'memory':       { accent: '#fd79a8', glow: 'rgba(253, 121, 168, 0.2)' },
  };

  let currentScreen = 'menu';
  let isTransitioning = false;

  /**
   * Applique la couleur d'accent dynamique au body.
   * @param {string} gameId — identifiant du jeu ou 'menu'
   */
  function applyAccentColor(gameId) {
    const colors = ACCENT_COLORS[gameId] || ACCENT_COLORS['menu'];
    document.documentElement.style.setProperty('--accent', colors.accent);
    document.documentElement.style.setProperty('--accent-glow', colors.glow);
  }

  /**
   * Navigue vers un ecran (menu ou jeu).
   * @param {string} targetId — 'menu' ou identifiant du jeu
   */
  function goTo(targetId) {
    if (isTransitioning || targetId === currentScreen) return;
    isTransitioning = true;

    const screenId = targetId === 'menu' ? 'screen-menu' : `screen-${targetId}`;
    const currentEl = document.getElementById(
      currentScreen === 'menu' ? 'screen-menu' : `screen-${currentScreen}`
    );
    const targetEl = document.getElementById(screenId);

    if (!targetEl) {
      isTransitioning = false;
      return;
    }

    // Appliquer la couleur d'accent
    applyAccentColor(targetId);

    // Animer la sortie de l'ecran actuel
    currentEl.classList.add('screen--leaving');
    currentEl.classList.remove('screen--active');

    setTimeout(() => {
      currentEl.classList.remove('screen--leaving');

      // Animer l'entree du nouvel ecran
      targetEl.classList.add('screen--active');
      currentScreen = targetId;
      isTransitioning = false;

      // Callback quand on entre dans un jeu
      if (targetId !== 'menu') {
        GameRegistry.onEnter(targetId);
      }
    }, TRANSITION_MS);
  }

  /** Initialise la navigation : ecoute les clics sur [data-navigate] */
  function init() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-navigate]');
      if (btn) {
        goTo(btn.dataset.navigate);
      }
    });
  }

  return { init, goTo };
})();


// ============================================
// MODULE 2 : REGISTRE DE JEUX
// ============================================

const GameRegistry = (() => {
  /** @type {Object<string, { onEnter: Function }>} */
  const games = {};

  /**
   * Enregistre un jeu dans le registre.
   * @param {string} id — identifiant unique du jeu
   * @param {object} handler — objet avec une methode onEnter()
   */
  function register(id, handler) {
    games[id] = handler;
  }

  /**
   * Appele quand on entre dans un jeu.
   * @param {string} id — identifiant du jeu
   */
  function onEnter(id) {
    if (games[id] && typeof games[id].onEnter === 'function') {
      games[id].onEnter();
    }
  }

  return { register, onEnter };
})();


// ============================================
// MODULE 3 : JEU — DEVINE LE NOMBRE
// ============================================

const GuessNumberGame = (() => {
  // Elements du DOM
  const card = document.getElementById('guess-card');
  const input = document.getElementById('guess-input');
  const guessBtn = document.getElementById('guess-btn');
  const restartBtn = document.getElementById('restart-btn');
  const messageEl = document.getElementById('message');
  const attemptsEl = document.getElementById('attempts-count');
  const confettiContainer = document.getElementById('confetti-container');

  // Etat du jeu
  let secret = 0;
  let attempts = 0;
  let gameOver = false;

  /** Genere un nombre aleatoire entre 1 et 10. */
  function generateSecret() {
    return Math.floor(Math.random() * 10) + 1;
  }

  /**
   * Affiche un message avec type et animation.
   * @param {string} text
   * @param {'error'|'warning'|'success'} type
   */
  function showMessage(text, type) {
    messageEl.className = 'message';
    void messageEl.offsetWidth; // force reflow
    messageEl.textContent = text;
    messageEl.classList.add('visible', `message--${type}`, 'pop');
  }

  /** Cache le message. */
  function hideMessage() {
    messageEl.classList.remove('visible', 'pop');
  }

  /** Met a jour le compteur avec animation. */
  function updateAttempts() {
    attemptsEl.textContent = attempts;
    attemptsEl.classList.remove('bump');
    void attemptsEl.offsetWidth;
    attemptsEl.classList.add('bump');
  }

  /**
   * Valide la saisie de l'utilisateur.
   * @param {string} raw
   * @returns {{ ok: boolean, value?: number, error?: string }}
   */
  function validate(raw) {
    if (raw.trim() === '') {
      return { ok: false, error: 'Entre un nombre entre 1 et 10' };
    }
    const n = Number(raw);
    if (!Number.isInteger(n)) {
      return { ok: false, error: 'Entre un nombre entier valide' };
    }
    if (n < 1 || n > 10) {
      return { ok: false, error: 'Le nombre doit être entre 1 et 10' };
    }
    return { ok: true, value: n };
  }

  /** Lance les confettis de victoire. */
  function launchConfetti() {
    const colors = ['#6c5ce7', '#51cf66', '#ffa94d', '#ff6b6b', '#74b9ff', '#fd79a8'];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div');
      el.classList.add('confetti');
      el.style.left = `${Math.random() * 100}%`;
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.animationDelay = `${Math.random() * 0.8}s`;
      el.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
      const size = 6 + Math.random() * 6;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      confettiContainer.appendChild(el);
    }
    setTimeout(() => { confettiContainer.innerHTML = ''; }, 3500);
  }

  /** Sequence de victoire. */
  function triggerVictory() {
    showMessage(`Bravo 🎉 C'était bien le ${secret} !`, 'success');
    input.disabled = true;
    guessBtn.disabled = true;
    gameOver = true;
    card.classList.add('victory');
    launchConfetti();
    restartBtn.classList.remove('hidden');
  }

  /** Traite une tentative. */
  function handleGuess() {
    if (gameOver) return;

    const result = validate(input.value);
    if (!result.ok) {
      showMessage(result.error, 'error');
      input.focus();
      return;
    }

    attempts++;
    updateAttempts();

    if (result.value < secret) {
      showMessage('Trop petit ! Essaie un nombre plus grand.', 'warning');
    } else if (result.value > secret) {
      showMessage('Trop grand ! Essaie un nombre plus petit.', 'warning');
    } else {
      triggerVictory();
      return;
    }

    input.value = '';
    input.focus();
  }

  /** Reinitialise le jeu. */
  function reset() {
    secret = generateSecret();
    attempts = 0;
    gameOver = false;
    attemptsEl.textContent = '0';
    input.value = '';
    input.disabled = false;
    guessBtn.disabled = false;
    hideMessage();
    restartBtn.classList.add('hidden');
    card.classList.remove('victory');
    confettiContainer.innerHTML = '';
    input.focus();
  }

  /** Initialise les ecouteurs et le premier jeu. */
  function init() {
    guessBtn.addEventListener('click', handleGuess);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleGuess();
    });
    restartBtn.addEventListener('click', reset);
    secret = generateSecret();
  }

  /** Appele quand on entre dans l'ecran du jeu. */
  function onEnter() {
    // Reset si la partie precedente est finie
    if (gameOver) reset();
    // Focus sur l'input apres la transition
    setTimeout(() => input.focus(), 350);
  }

  return { init, onEnter };
})();


// ============================================
// INITIALISATION GLOBALE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialiser la navigation
  Nav.init();

  // Initialiser et enregistrer les jeux
  GuessNumberGame.init();
  GameRegistry.register('guess-number', GuessNumberGame);

  // --- Pour ajouter un futur jeu : ---
  // 1. Creer le <section id="screen-xxx"> dans index.html
  // 2. Creer un module JS similaire a GuessNumberGame
  // 3. L'enregistrer ici :
  //    MonJeu.init();
  //    GameRegistry.register('xxx', MonJeu);
  // 4. Ajouter la carte dans le menu avec data-navigate="xxx"
  // 5. Retirer game-card--locked et changer le badge
});
