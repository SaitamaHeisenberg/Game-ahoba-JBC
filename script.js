/* ============================================
   DEVINE LE NOMBRE — Logique du jeu
   JavaScript vanilla ES6, code propre
   ============================================ */

// --- Elements du DOM ---
const guessInput = document.getElementById('guess-input');
const guessBtn = document.getElementById('guess-btn');
const restartBtn = document.getElementById('restart-btn');
const messageEl = document.getElementById('message');
const attemptsCountEl = document.getElementById('attempts-count');
const card = document.querySelector('.card');
const confettiContainer = document.getElementById('confetti-container');

// --- Etat du jeu ---
let secretNumber = generateSecretNumber();
let attempts = 0;
let gameOver = false;

/**
 * Genere un nombre aleatoire entre 1 et 10 inclus.
 * @returns {number}
 */
function generateSecretNumber() {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Affiche un message avec le type et l'animation correspondants.
 * @param {string} text - Le texte du message
 * @param {'error'|'warning'|'success'} type - Le type de message
 */
function showMessage(text, type) {
  // Retirer les anciennes classes
  messageEl.className = 'message';

  // Forcer un reflow pour relancer l'animation
  void messageEl.offsetWidth;

  // Appliquer le nouveau message
  messageEl.textContent = text;
  messageEl.classList.add('visible', `message--${type}`, 'pop');
}

/** Cache le message avec transition. */
function hideMessage() {
  messageEl.classList.remove('visible', 'pop');
}

/**
 * Met a jour l'affichage du compteur d'essais avec animation.
 */
function updateAttemptsDisplay() {
  attemptsCountEl.textContent = attempts;
  attemptsCountEl.classList.remove('bump');
  void attemptsCountEl.offsetWidth;
  attemptsCountEl.classList.add('bump');
}

/**
 * Valide la saisie utilisateur.
 * @param {string} rawValue - La valeur brute du champ input
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
function validateInput(rawValue) {
  // Champ vide
  if (rawValue.trim() === '') {
    return { valid: false, error: 'Entre un nombre entre 1 et 10' };
  }

  const num = Number(rawValue);

  // Pas un entier valide
  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Entre un nombre entier valide' };
  }

  // Hors de la plage autorisee
  if (num < 1 || num > 10) {
    return { valid: false, error: 'Le nombre doit être entre 1 et 10' };
  }

  return { valid: true, value: num };
}

/**
 * Desactive les controles apres la victoire.
 */
function disableControls() {
  guessInput.disabled = true;
  guessBtn.disabled = true;
  gameOver = true;
}

/**
 * Declenche l'animation de confettis pour la victoire.
 */
function launchConfetti() {
  const colors = ['#6c5ce7', '#51cf66', '#ffa94d', '#ff6b6b', '#74b9ff', '#fd79a8'];
  const count = 60;

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');

    // Position horizontale aleatoire
    confetti.style.left = `${Math.random() * 100}%`;

    // Couleur aleatoire
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    // Delai et duree aleatoires
    const delay = Math.random() * 0.8;
    const duration = 1.5 + Math.random() * 1.5;
    confetti.style.animationDelay = `${delay}s`;
    confetti.style.animationDuration = `${duration}s`;

    // Taille variable
    const size = 6 + Math.random() * 6;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;

    confettiContainer.appendChild(confetti);
  }

  // Nettoyer les confettis apres l'animation
  setTimeout(() => {
    confettiContainer.innerHTML = '';
  }, 3500);
}

/**
 * Declenche la sequence de victoire (message, animation, confettis).
 */
function triggerVictory() {
  showMessage(`Bravo 🎉 C'était bien le ${secretNumber} !`, 'success');
  disableControls();

  // Animation de la carte
  card.classList.add('victory');

  // Confettis
  launchConfetti();

  // Afficher le bouton recommencer
  restartBtn.classList.remove('hidden');
}

/**
 * Traite la tentative de l'utilisateur.
 */
function handleGuess() {
  if (gameOver) return;

  const result = validateInput(guessInput.value);

  // Saisie invalide
  if (!result.valid) {
    showMessage(result.error, 'error');
    guessInput.focus();
    return;
  }

  const guess = result.value;

  // Incrementer les essais
  attempts++;
  updateAttemptsDisplay();

  // Comparer avec le nombre secret
  if (guess < secretNumber) {
    showMessage('Trop petit ! Essaie un nombre plus grand.', 'warning');
  } else if (guess > secretNumber) {
    showMessage('Trop grand ! Essaie un nombre plus petit.', 'warning');
  } else {
    triggerVictory();
    return;
  }

  // Vider le champ et redonner le focus pour le prochain essai
  guessInput.value = '';
  guessInput.focus();
}

/**
 * Reinitialise entierement le jeu.
 */
function resetGame() {
  // Nouveau nombre secret
  secretNumber = generateSecretNumber();
  attempts = 0;
  gameOver = false;

  // Reinitialiser l'interface
  attemptsCountEl.textContent = '0';
  guessInput.value = '';
  guessInput.disabled = false;
  guessBtn.disabled = false;
  hideMessage();
  restartBtn.classList.add('hidden');
  card.classList.remove('victory');
  confettiContainer.innerHTML = '';

  guessInput.focus();
}

// --- Ecouteurs d'evenements ---

// Clic sur le bouton Deviner
guessBtn.addEventListener('click', handleGuess);

// Touche Entree dans le champ de saisie
guessInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleGuess();
  }
});

// Clic sur le bouton Recommencer
restartBtn.addEventListener('click', resetGame);

// Focus initial sur le champ de saisie au chargement
guessInput.focus();
