#!/bin/bash
# ============================================
# DEPLOY.SH — Script de mise a jour et deploiement
# Devine le Nombre — Lynasoft
#
# Usage:
#   ./deploy.sh                   → commit auto avec timestamp
#   ./deploy.sh "mon message"     → commit avec message personnalise
#   ./deploy.sh --version 1.2.0   → creer un tag de version
# ============================================

set -e

# --- Couleurs pour l'affichage ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# --- Se placer dans le dossier du projet ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# --- Fonctions utilitaires ---
info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERREUR]${NC} $1"; exit 1; }

header() {
  echo ""
  echo -e "${PURPLE}${BOLD}╔══════════════════════════════════════════╗${NC}"
  echo -e "${PURPLE}${BOLD}║     🚀 Lynasoft — Auto Deploy Script     ║${NC}"
  echo -e "${PURPLE}${BOLD}╚══════════════════════════════════════════╝${NC}"
  echo ""
}

# --- Affichage ---
header

# --- Verification: est-on dans un repo git ? ---
if [ ! -d ".git" ]; then
  error "Ce dossier n'est pas un depot Git. Lancez 'git init' d'abord."
fi

# --- Verification: y a-t-il des changements ? ---
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  warn "Aucun changement detecte. Rien a deployer."
  exit 0
fi

# --- Gestion des arguments ---
VERSION_TAG=""
COMMIT_MSG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version|-v)
      VERSION_TAG="$2"
      shift 2
      ;;
    *)
      COMMIT_MSG="$1"
      shift
      ;;
  esac
done

# Message par defaut avec timestamp
if [ -z "$COMMIT_MSG" ]; then
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  COMMIT_MSG="update: mise a jour du $TIMESTAMP"
fi

# --- Etape 1: Voir les changements ---
info "Fichiers modifies :"
echo ""
git status --short
echo ""

# --- Etape 2: Ajouter tous les fichiers ---
info "Ajout des fichiers au staging..."
git add -A
success "Fichiers ajoutes."

# --- Etape 3: Commit ---
info "Commit: ${BOLD}$COMMIT_MSG${NC}"
git commit -m "$COMMIT_MSG"
success "Commit cree."

# --- Etape 4: Tag de version (optionnel) ---
if [ -n "$VERSION_TAG" ]; then
  info "Creation du tag v$VERSION_TAG..."
  git tag -a "v$VERSION_TAG" -m "Version $VERSION_TAG"
  success "Tag v$VERSION_TAG cree."
fi

# --- Etape 5: Push vers GitHub ---
BRANCH=$(git branch --show-current)
info "Push sur origin/$BRANCH..."
git push origin "$BRANCH" 2>&1

if [ -n "$VERSION_TAG" ]; then
  git push origin "v$VERSION_TAG" 2>&1
fi

success "Push termine."

# --- Resume ---
echo ""
echo -e "${GREEN}${BOLD}════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✅ Deploiement reussi !${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}Branche :${NC}  $BRANCH"
echo -e "  ${CYAN}Commit  :${NC}  $COMMIT_MSG"
if [ -n "$VERSION_TAG" ]; then
  echo -e "  ${CYAN}Version :${NC}  v$VERSION_TAG"
fi
echo -e "  ${CYAN}GitHub  :${NC}  https://github.com/SaitamaHeisenberg/Game-ahoba-JBC"
echo -e "  ${CYAN}Live    :${NC}  Netlify deploie automatiquement en ~30s"
echo ""
