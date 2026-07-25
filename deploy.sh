#!/usr/bin/env bash
#
# Deploy do app "Respiração 4-7-8" (PWA) para produção.
# Sobe os arquivos pro S3 e invalida o cache do CloudFront.
#
# Uso:
#   ./deploy.sh
#
set -euo pipefail

# --- Config (ver memória respire-deploy) ---
PROFILE="default"
BUCKET="respire-umdiabonito-combr"
DISTRIBUTION_ID="E19N0NDBE4DX7J"
SITE="https://respire.umdiabonito.com.br"

# Arquivos que nunca podem ficar presos em cache: o HTML e, principalmente,
# o service worker (um sw.js velho no cache do navegador trava as atualizações).
NO_CACHE="no-cache, must-revalidate"
# Ícones mudam raramente
ASSET_CACHE="public, max-age=86400"

# Rodar sempre a partir da pasta do script
cd "$(dirname "$0")"

for f in index.html sw.js manifest.webmanifest favicon.ico; do
  if [[ ! -f "$f" ]]; then
    echo "❌ Não encontrei $f nesta pasta. Abortando."
    exit 1
  fi
done

upload() { # upload <arquivo> <content-type> <cache-control>
  echo "  → $1"
  aws s3 cp "$1" "s3://$BUCKET/$1" \
    --content-type "$2" \
    --cache-control "$3" \
    --profile "$PROFILE" \
    --only-show-errors
}

echo "📦 Subindo arquivos para s3://$BUCKET ..."
upload index.html          "text/html; charset=utf-8"    "$NO_CACHE"
upload sw.js               "text/javascript; charset=utf-8" "$NO_CACHE"
upload manifest.webmanifest "application/manifest+json"   "$NO_CACHE"
upload favicon.ico         "image/x-icon"                "$ASSET_CACHE"

echo "  → icons/"
aws s3 sync icons "s3://$BUCKET/icons" \
  --content-type "image/png" \
  --cache-control "$ASSET_CACHE" \
  --delete \
  --profile "$PROFILE" \
  --only-show-errors

echo "🧹 Invalidando cache do CloudFront ($DISTRIBUTION_ID) ..."
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --profile "$PROFILE" \
  --query 'Invalidation.{Id:Id,Status:Status}' \
  --output table

echo ""
echo "✅ Deploy enviado. A invalidação leva ~1-2 min."
echo "   Depois disso, dê um reload forçado no navegador:"
echo "   $SITE"
echo "   (quem já tem o app instalado recebe a versão nova sozinho na próxima abertura)"
