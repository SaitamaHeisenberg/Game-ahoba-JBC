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

  // Configuration
  const MAX_ATTEMPTS = 3;

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

  /** Desactive les controles (fin de partie). */
  function endGame() {
    input.disabled = true;
    guessBtn.disabled = true;
    gameOver = true;
    restartBtn.classList.remove('hidden');
  }

  /** Sequence de victoire. */
  function triggerVictory() {
    showMessage(`Bravo 🎉 C'était bien le ${secret} !`, 'success');
    endGame();
    card.classList.add('victory');
    launchConfetti();
  }

  /** Sequence de defaite. */
  function triggerDefeat() {
    showMessage(`Perdu 😢 Le nombre était ${secret}`, 'error');
    endGame();
    card.classList.add('defeat');
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

    if (result.value === secret) {
      triggerVictory();
      return;
    }

    // Dernier essai rate → defaite
    if (attempts >= MAX_ATTEMPTS) {
      triggerDefeat();
      return;
    }

    // Indice
    const remaining = MAX_ATTEMPTS - attempts;
    const hint = result.value < secret ? 'Trop petit !' : 'Trop grand !';
    showMessage(`${hint} Plus que ${remaining} essai${remaining > 1 ? 's' : ''}.`, 'warning');

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
    card.classList.remove('victory', 'defeat');
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
// MODULE 4 : JEU — LE PENDU
// ============================================

const PenduGame = (() => {
  // Elements du DOM — intro
  const introScreen = document.getElementById('pendu-intro');
  const gameScreen = document.getElementById('pendu-game');
  const nameInput = document.getElementById('pendu-name-input');
  const startBtn = document.getElementById('pendu-start-btn');
  const playerNameEl = document.getElementById('pendu-player-name');

  // Elements du DOM — jeu
  const card = document.getElementById('pendu-card');
  const wordContainer = document.getElementById('pendu-word');
  const keyboard = document.getElementById('pendu-keyboard');
  const errorsEl = document.getElementById('pendu-errors');
  const messageEl = document.getElementById('pendu-message');
  const restartBtn = document.getElementById('pendu-restart');
  const confettiContainer = document.getElementById('confetti-container');

  // Prenom du joueur
  let playerName = '';

  // Parties du pendu (dans l'ordre d'apparition)
  const BODY_PARTS = [
    'pendu-head', 'pendu-body',
    'pendu-left-arm', 'pendu-right-arm',
    'pendu-left-leg', 'pendu-right-leg'
  ];

  const MAX_ERRORS = 6;

  // Banque de mots variee avec indices fun { word, hint }
  const WORDS = [
    // --- Animaux ---
    { word: 'elephant',   hint: 'Enorme animal gris avec une trompe, il n\'oublie jamais rien' },
    { word: 'girafe',     hint: 'L\'animal au plus long cou, elle voit tout de la-haut' },
    { word: 'dauphin',    hint: 'Mammifere marin super intelligent qui adore jouer dans les vagues' },
    { word: 'papillon',   hint: 'Avant il rampait, maintenant il vole avec des ailes colorees' },
    { word: 'crocodile',  hint: 'Reptile qui sourit tout le temps mais vaut mieux pas s\'approcher' },
    { word: 'pingouin',   hint: 'Oiseau en costume noir et blanc qui ne sait pas voler' },
    { word: 'cameleon',   hint: 'Le roi du deguisement, il change de couleur comme de chemise' },
    { word: 'hamster',    hint: 'Petite boule de poils qui court dans sa roue toute la nuit' },

    // --- Nourriture ---
    { word: 'chocolat',   hint: 'Noir, au lait ou blanc, c\'est le meilleur remede a la tristesse' },
    { word: 'croissant',  hint: 'Viennoiserie doree en forme de lune, star du petit-dejeuner francais' },
    { word: 'spaghetti',  hint: 'Pates longues et fines, impossibles a manger proprement' },
    { word: 'ananas',     hint: 'Fruit tropical avec une couronne, debat eternel : sur la pizza ou pas ?' },
    { word: 'fromage',    hint: 'La France en a plus de 400 sortes, ca sent fort mais c\'est bon' },
    { word: 'omelette',   hint: 'Des oeufs battus dans la poele, simple mais delicieux' },
    { word: 'banane',     hint: 'Fruit jaune courbe, snack prefere des singes et des sportifs' },
    { word: 'baguette',   hint: 'Pain long et croustillant, symbole de la France dans le monde' },

    // --- Vie quotidienne ---
    { word: 'parapluie',  hint: 'On l\'oublie toujours quand il pleut et on le perd quand il fait beau' },
    { word: 'reveil',     hint: 'L\'objet le plus deteste le lundi matin, il sonne trop tot' },
    { word: 'chaussette', hint: 'Toujours par deux mais il en manque toujours une apres la lessive' },
    { word: 'escalier',   hint: 'Tu le prends quand l\'ascenseur est en panne, ca fait les jambes' },
    { word: 'lunettes',   hint: 'Elles t\'aident a voir clair, mais tu les cherches alors qu\'elles sont sur ta tete' },
    { word: 'sandwich',   hint: 'Repas express entre deux tranches de pain, sauveur de la pause dejeuner' },
    { word: 'valise',     hint: 'Tu la remplis avant de partir en vacances, toujours trop petite' },
    { word: 'miroir',     hint: 'Il te montre la verite chaque matin, que tu le veuilles ou non' },

    // --- Nature ---
    { word: 'volcan',     hint: 'Montagne en colere qui crache du feu et de la lave' },
    { word: 'tonnerre',   hint: 'Le gros bruit apres l\'eclair, fait peur aux chiens' },
    { word: 'avalanche',   hint: 'Enorme masse de neige qui devale la montagne a toute vitesse' },
    { word: 'cascade',    hint: 'Chute d\'eau naturelle, comme une douche geante en foret' },
    { word: 'iceberg',    hint: 'Bloc de glace flottant, 90% est cache sous l\'eau, comme tes talents' },
    { word: 'aurore',     hint: 'Lumieres magiques dans le ciel du nord, vert et violet' },
    { word: 'tornade',    hint: 'Vent qui tourne tres tres vite en forme d\'entonnoir, pas sympa du tout' },
    { word: 'oasis',      hint: 'Petit coin de paradis avec eau et palmiers en plein desert' },

    // --- Sport & loisirs ---
    { word: 'football',   hint: 'Le sport ou 22 personnes courent apres un ballon pendant 90 minutes' },
    { word: 'toboggan',   hint: 'Tu montes par l\'echelle et tu redescends en glissant, toujours fun' },
    { word: 'karate',     hint: 'Art martial japonais, on casse des planches et on crie beaucoup' },
    { word: 'trampoline', hint: 'Tu sautes dessus et tu touches presque le ciel, attention a l\'atterrissage' },
    { word: 'guitare',    hint: 'Instrument a 6 cordes, tout le monde veut en jouer autour du feu' },
    { word: 'dominos',    hint: 'Petites pieces qu\'on aligne pour les faire toutes tomber, satisfaisant !' },

    // --- Ecole & culture ---
    { word: 'dictionnaire', hint: 'Le livre qui connait tous les mots, il a reponse a tout' },
    { word: 'tableau',    hint: 'Surface verte ou blanche ou le prof ecrit des trucs importants' },
    { word: 'pyramide',   hint: 'Construction triangulaire en Egypte, les pharaons dormaient dedans' },
    { word: 'dinosaure',  hint: 'Gros lezard disparu il y a 65 millions d\'annees, le T-Rex etait le boss' },
    { word: 'astronaute', hint: 'Metier de reve : voyager dans l\'espace et flotter en apesanteur' },
    { word: 'telescope',  hint: 'Tube magique pour voir les etoiles et les planetes de tres loin' },
    { word: 'squelette',  hint: 'Tu en as un a l\'interieur de toi en ce moment, 206 os en tout' },
    { word: 'tresor',     hint: 'Coffre rempli d\'or cache par les pirates, X marque l\'endroit' },

    // --- Fun & absurde ---
    { word: 'moustache',  hint: 'Poils au-dessus de la levre, style Mario Bros ou Salvador Dali' },
    { word: 'sorciere',   hint: 'Vole sur un balai, a un chat noir et prepare des potions bizarres' },
    { word: 'fantome',    hint: 'Drap blanc qui fait "Bouh !" dans les couloirs la nuit' },
    { word: 'licorne',    hint: 'Cheval magique avec une corne, elles petent des arcs-en-ciel' },
    { word: 'zombie',     hint: 'Mort-vivant qui marche lentement et veut manger ton cerveau' },
    { word: 'vampire',    hint: 'Il dort le jour, sort la nuit et deteste l\'ail et les miroirs' },
    { word: 'robot',      hint: 'Machine qui pourrait te remplacer au travail, bip boup bip' },
    { word: 'ninja',      hint: 'Guerrier silencieux tout en noir, tu ne le vois jamais venir' },

    // --- Informatique (quelques uns gardes) ---
    { word: 'internet',   hint: 'Le truc magique qui te permet de regarder des videos de chats a 3h du mat' },
    { word: 'ordinateur', hint: 'Machine qui fait tout : travail, jeux, films, et qui plante au pire moment' },
    { word: 'clavier',    hint: 'Les boutons sur lesquels tu tapes, certains les maltraitent en jouant' },
    { word: 'souris',     hint: 'Tu la bouges sur le bureau mais elle ne mange pas de fromage' },
    { word: 'wifi',       hint: 'Quand il disparait, c\'est la panique a la maison' },
    { word: 'batterie',   hint: 'Toujours a 1% quand tu en as le plus besoin' },
    { word: 'selfie',     hint: 'Photo de toi par toi-meme, le bras tendu ou avec un baton' },
    { word: 'emoji',      hint: 'Petite image jaune qui rit, pleure ou fait un clin d\'oeil dans tes messages' }
  ];

  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

  // Elements DOM pour l'indice
  const hintEl = document.getElementById('pendu-hint');

  // Etat du jeu
  let currentEntry = null;
  let currentWord = '';
  let guessedLetters = new Set();
  let errors = 0;
  let gameOver = false;

  /** Choisit un mot aleatoire. */
  function pickWord() {
    currentEntry = WORDS[Math.floor(Math.random() * WORDS.length)];
    return currentEntry.word;
  }

  /** Affiche l'indice. */
  function renderHint() {
    hintEl.textContent = currentEntry ? currentEntry.hint : '';
  }

  /** Construit l'affichage du mot (lettres trouvees + tirets). */
  function renderWord(revealAll = false) {
    wordContainer.innerHTML = '';
    for (const char of currentWord) {
      const span = document.createElement('span');
      span.classList.add('pendu__letter');
      if (guessedLetters.has(char) || revealAll) {
        span.textContent = char;
        if (guessedLetters.has(char)) {
          span.classList.add('revealed');
        } else {
          // Lettres revelees en fin de partie (defaite)
          span.classList.add('revealed-end');
        }
      }
      wordContainer.appendChild(span);
    }
  }

  /** Construit le clavier virtuel. */
  function renderKeyboard() {
    keyboard.innerHTML = '';
    for (const letter of ALPHABET) {
      const btn = document.createElement('button');
      btn.classList.add('pendu__key');
      btn.textContent = letter;
      btn.dataset.letter = letter;
      btn.addEventListener('click', () => handleLetter(letter));
      keyboard.appendChild(btn);
    }
  }

  /** Met a jour le compteur d'erreurs. */
  function updateErrors() {
    errorsEl.textContent = errors;
    errorsEl.classList.remove('bump');
    void errorsEl.offsetWidth;
    errorsEl.classList.add('bump');
  }

  /** Revele une partie du corps. */
  function showBodyPart(index) {
    const part = document.getElementById(BODY_PARTS[index]);
    if (part) part.classList.add('visible');
  }

  /** Cache toutes les parties du corps. */
  function hideAllParts() {
    BODY_PARTS.forEach(id => {
      const part = document.getElementById(id);
      if (part) part.classList.remove('visible');
    });
  }

  /** Affiche un message. */
  function showMessage(text, type) {
    messageEl.className = 'message';
    void messageEl.offsetWidth;
    messageEl.textContent = text;
    messageEl.classList.add('visible', `message--${type}`, 'pop');
  }

  /** Cache le message. */
  function hideMessage() {
    messageEl.classList.remove('visible', 'pop');
  }

  /** Verifie si le mot est entierement trouve. */
  function isWordComplete() {
    return [...currentWord].every(c => guessedLetters.has(c));
  }

  /** Lance les confettis (reutilise le meme container). */
  function launchConfetti() {
    const colors = ['#ff6b6b', '#ff8787', '#ffa94d', '#51cf66', '#74b9ff', '#fd79a8'];
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

  /** Fin de partie. */
  function endGame() {
    gameOver = true;
    restartBtn.classList.remove('hidden');
    // Desactiver toutes les touches
    keyboard.querySelectorAll('.pendu__key').forEach(k => {
      k.style.pointerEvents = 'none';
    });
  }

  /** Victoire. */
  function triggerVictory() {
    showMessage(`Bravo ${playerName} 🎉 Le mot était « ${currentWord} » !`, 'success');
    endGame();
    card.classList.add('victory');
    launchConfetti();
  }

  /** Defaite. */
  function triggerDefeat() {
    renderWord(true);
    showMessage(`Perdu ${playerName} 😢 Le mot était « ${currentWord} »`, 'error');
    endGame();
    card.classList.add('defeat');
  }

  /**
   * Traite la selection d'une lettre.
   * @param {string} letter
   */
  function handleLetter(letter) {
    if (gameOver || guessedLetters.has(letter)) return;

    guessedLetters.add(letter);
    const keyEl = keyboard.querySelector(`[data-letter="${letter}"]`);

    if (currentWord.includes(letter)) {
      // Bonne lettre
      if (keyEl) keyEl.classList.add('pendu__key--correct');
      renderWord();
      if (isWordComplete()) {
        triggerVictory();
      }
    } else {
      // Mauvaise lettre
      if (keyEl) keyEl.classList.add('pendu__key--wrong');
      showBodyPart(errors);
      errors++;
      updateErrors();
      if (errors >= MAX_ERRORS) {
        triggerDefeat();
      }
    }
  }

  /** Reinitialise le jeu. */
  function reset() {
    currentWord = pickWord();
    guessedLetters = new Set();
    errors = 0;
    gameOver = false;
    errorsEl.textContent = '0';
    hideMessage();
    hideAllParts();
    restartBtn.classList.add('hidden');
    card.classList.remove('victory', 'defeat');
    confettiContainer.innerHTML = '';
    renderHint();
    renderWord();
    renderKeyboard();
  }

  /** Gestion du clavier physique. */
  function handleKeyPress(e) {
    // Ne reagir que si l'ecran du pendu est actif
    const screen = document.getElementById('screen-pendu');
    if (!screen.classList.contains('screen--active')) return;
    if (gameOver) return;

    const key = e.key.toLowerCase();
    if (ALPHABET.includes(key)) {
      handleLetter(key);
    }
  }

  /** Lance la partie apres saisie du prenom. */
  function startGame() {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }

    // Stocker le prenom (premiere lettre majuscule)
    playerName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    playerNameEl.textContent = `🎮 ${playerName}`;

    // Sauvegarder dans la liste des joueurs (localStorage)
    AdminPanel.savePlayer(playerName);

    // Basculer de l'intro vers le jeu
    introScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    reset();
  }

  /** Revient a l'ecran d'intro (quand on retourne au menu puis revient). */
  function showIntro() {
    introScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    nameInput.value = playerName; // pre-remplir si deja saisi
    setTimeout(() => nameInput.focus(), 350);
  }

  /** Initialise le jeu. */
  function init() {
    // Ecouteurs intro
    startBtn.addEventListener('click', startGame);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startGame();
    });

    // Ecouteurs jeu
    restartBtn.addEventListener('click', reset);
    document.addEventListener('keydown', handleKeyPress);

    // Preparer le jeu (cache)
    currentWord = pickWord();
    renderHint();
    renderWord();
    renderKeyboard();
  }

  /** Appele quand on entre dans l'ecran. */
  function onEnter() {
    // Si pas de prenom, montrer l'intro
    if (!playerName) {
      showIntro();
      return;
    }
    // Sinon reprendre ou reset
    introScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    if (gameOver) reset();
  }

  return { init, onEnter };
})();


// ============================================
// MODULE 5 : PANNEAU ADMIN
// ============================================

const AdminPanel = (() => {
  const SECRET_CODE = '259983@@';
  const STORAGE_KEY = 'lynasoft_pendu_players';

  // Elements du DOM
  const trigger = document.getElementById('admin-trigger');
  const overlay = document.getElementById('admin-overlay');
  const authScreen = document.getElementById('admin-auth');
  const dashboard = document.getElementById('admin-dashboard');
  const codeInput = document.getElementById('admin-code-input');
  const codeBtn = document.getElementById('admin-code-btn');
  const codeMsgEl = document.getElementById('admin-code-msg');
  const closeBtn = document.getElementById('admin-close');
  const closeDashBtn = document.getElementById('admin-close-dash');
  const playerList = document.getElementById('admin-player-list');
  const countEl = document.getElementById('admin-count');
  const clearBtn = document.getElementById('admin-clear-btn');

  /**
   * Sauvegarde un joueur dans localStorage.
   * @param {string} name — prenom du joueur
   */
  function savePlayer(name) {
    const players = getPlayers();
    players.push({
      name,
      date: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }

  /**
   * Recupere la liste des joueurs.
   * @returns {Array<{name: string, date: string}>}
   */
  function getPlayers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  /** Efface tous les joueurs. */
  function clearPlayers() {
    localStorage.removeItem(STORAGE_KEY);
    renderPlayerList();
  }

  /** Affiche un message dans l'ecran auth. */
  function showCodeMsg(text, type) {
    codeMsgEl.className = 'message';
    void codeMsgEl.offsetWidth;
    codeMsgEl.textContent = text;
    codeMsgEl.classList.add('visible', `message--${type}`, 'pop');
  }

  /** Ouvre le panneau admin. */
  function open() {
    // Toujours montrer l'ecran auth d'abord
    authScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
    codeInput.value = '';
    codeMsgEl.className = 'message';
    overlay.classList.remove('hidden');
    setTimeout(() => codeInput.focus(), 100);
  }

  /** Ferme le panneau admin. */
  function close() {
    overlay.classList.add('hidden');
  }

  /** Verifie le code entre. */
  function validateCode() {
    const code = codeInput.value;
    if (code === SECRET_CODE) {
      authScreen.classList.add('hidden');
      dashboard.classList.remove('hidden');
      renderPlayerList();
    } else {
      showCodeMsg('Code incorrect', 'error');
      codeInput.value = '';
      codeInput.focus();
    }
  }

  /** Formate une date ISO en format lisible. */
  function formatDate(iso) {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  }

  /** Affiche la liste des joueurs. */
  function renderPlayerList() {
    const players = getPlayers();
    countEl.textContent = `${players.length} partie${players.length > 1 ? 's' : ''} enregistr\u00e9e${players.length > 1 ? 's' : ''}`;

    if (players.length === 0) {
      playerList.innerHTML = '<li class="admin__empty">Aucun joueur pour le moment</li>';
      return;
    }

    // Afficher du plus recent au plus ancien
    const reversed = [...players].reverse();
    playerList.innerHTML = reversed.map((p, i) => `
      <li class="admin__list-item">
        <div class="admin__player-info">
          <span class="admin__player-rank">#${players.length - i}</span>
          <span class="admin__player-name">${p.name}</span>
        </div>
        <span class="admin__player-date">${formatDate(p.date)}</span>
      </li>
    `).join('');
  }

  /** Initialise les ecouteurs. */
  function init() {
    trigger.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    closeDashBtn.addEventListener('click', close);
    codeBtn.addEventListener('click', validateCode);
    codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') validateCode();
    });
    clearBtn.addEventListener('click', () => {
      clearPlayers();
    });

    // Fermer en cliquant sur le fond
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  return { init, savePlayer };
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

  PenduGame.init();
  GameRegistry.register('pendu', PenduGame);

  // Initialiser le panneau admin
  AdminPanel.init();
});
