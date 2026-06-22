#!/usr/bin/env bash
#
# Deploy do app "Respiração 4-7-8" para produção.
# Sobe o index.html pro S3 e invalida o cache do CloudFront.
#
# Uso:
#   ./deploy.sh
#
set -euo pipefail

# --- Config (ver memória respire-deploy) ---
PROFILE="default"
BUCKET="respire-umdiabonito-combr"
DISTRIBUTION_ID="E19N0NDBE4DX7J"
FILE="index.html"
SITE="https://respire.umdiabonito.com.br"

# Rodar sempre a partir da pasta do script
cd "$(dirname "$0")"

if [[ ! -f "$FILE" ]]; then
  echo "❌ Não encontrei $FILE nesta pasta. Abortando."
  exit 1
fi

echo "📦 Subindo $FILE para s3://$BUCKET ..."
aws s3 cp "$FILE" "s3://$BUCKET/$FILE" \
  --content-type "text/html; charset=utf-8" \
  --profile "$PROFILE"

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
