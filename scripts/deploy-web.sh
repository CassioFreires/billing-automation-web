#!/usr/bin/env bash
# =============================================================================
# deploy-web.sh — builda o frontend (Adimplo) e publica no EC2.
#
# Filosofia: NÃO se builda em produção e NÃO se versiona artefato.
#   1. Builda o dist AQUI (com RAM sobrando).
#   2. Empacota e envia por SSH.
#   3. No EC2, esvazia o CONTEÚDO da pasta e extrai a nova (o Caddy serve /srv,
#      que é um bind-mount de ./frontend/dist — pega os arquivos novos na hora,
#      sem precisar reiniciar nada).
#
# ⚠️ NUNCA fazer `rm -rf` no PRÓPRIO diretório do bind-mount (ex.: rm -rf
#    frontend/dist && mkdir). Isso troca o inode da pasta, e o container em
#    execução continua preso no inode antigo (deletado) → passa a ver /srv
#    vazio e o site cai em 404 até recriar o container. Por isso limpamos só o
#    CONTEÚDO (find -mindepth 1 -delete), mantendo a pasta/inode original.
#
# Uso (no PC, pelo Git Bash):
#   ./scripts/deploy-web.sh
#
# Config (uma vez): copie scripts/deploy-web.env.example para scripts/deploy-web.env
# e preencha EC2_KEY / EC2_HOST. O .env NÃO é versionado.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---- Carrega config local (se existir) --------------------------------------
[ -f "$SCRIPT_DIR/deploy-web.env" ] && . "$SCRIPT_DIR/deploy-web.env"

EC2_KEY="${EC2_KEY:-}"                                            # caminho da chave .pem
EC2_HOST="${EC2_HOST:-}"                                          # ex.: ec2-user@54.207.x.x
EC2_PATH="${EC2_PATH:-~/billing-automation-api/frontend/dist}"   # destino do dist no EC2

# ---- Log helpers ------------------------------------------------------------
if [ -t 1 ]; then C_G=$'\033[32m'; C_Y=$'\033[33m'; C_R=$'\033[31m'; C_B=$'\033[1m'; C_0=$'\033[0m'
else C_G=; C_Y=; C_R=; C_B=; C_0=; fi
log()  { echo "${C_B}▶ $*${C_0}"; }
ok()   { echo "${C_G}✔ $*${C_0}"; }
die()  { echo "${C_R}✖ $*${C_0}" >&2; exit 1; }

# ---- Validação --------------------------------------------------------------
if [ -z "$EC2_KEY" ] || [ -z "$EC2_HOST" ]; then
  die "Falta configurar EC2_KEY e EC2_HOST.
     Copie: cp scripts/deploy-web.env.example scripts/deploy-web.env
     E preencha o caminho da chave .pem e o usuario@ip do EC2."
fi
[ -f "$EC2_KEY" ] || die "Chave nao encontrada em: $EC2_KEY"
command -v tar >/dev/null || die "tar nao encontrado no PATH."
command -v scp >/dev/null || die "scp nao encontrado no PATH (instale o OpenSSH / use o Git Bash)."

cd "$REPO_ROOT"
TARBALL="/tmp/adimplo-dist-$$.tar.gz"
trap 'rm -f "$TARBALL"' EXIT

# Aceita a chave do host na 1a conexão sem travar num prompt interativo
# (ainda protege contra troca de chave depois — accept-new, não "no").
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)

# ---- 1) Build ---------------------------------------------------------------
log "Buildando o frontend (npm run build)…"
npm run build

[ -d dist ] || die "Pasta dist/ nao foi gerada. Build falhou?"

# ---- 2) Empacota ------------------------------------------------------------
log "Empacotando dist…"
tar -czf "$TARBALL" -C dist .

# ---- 3) Envia e publica -----------------------------------------------------
log "Enviando para $EC2_HOST…"
scp "${SSH_OPTS[@]}" -i "$EC2_KEY" "$TARBALL" "$EC2_HOST:/tmp/adimplo-dist.tar.gz"

log "Publicando no EC2 (esvazia o conteúdo e extrai a nova)…"
# IMPORTANTE: `find -mindepth 1 -delete` apaga o CONTEÚDO mas preserva a pasta
# (mesmo inode), então o bind-mount do Caddy continua válido — sem 404, sem
# recriar container. NÃO trocar por `rm -rf $EC2_PATH` (ver comentário no topo).
ssh "${SSH_OPTS[@]}" -i "$EC2_KEY" "$EC2_HOST" "\
  mkdir -p $EC2_PATH && \
  find $EC2_PATH -mindepth 1 -delete && \
  tar -xzf /tmp/adimplo-dist.tar.gz -C $EC2_PATH && \
  rm -f /tmp/adimplo-dist.tar.gz"

ok "Frontend publicado → https://useadimplo.com.br"
echo "  (se acabou de configurar o DNS/Caddy, aguarde o certificado na 1a vez)"
