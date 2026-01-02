#!/usr/bin/env bash
set -euo pipefail

STATUS="${1:-}"
PROJECT_ID="${PROJECT_ID:-painelswim}"
ID_TENANT="${ID_TENANT:-TENANT_001}"
ID_BRANCH="${ID_BRANCH:-BRANCH_001}"

if [ -z "${STATUS}" ]; then
  echo "Uso: $0 <active|past_due|canceled|unknown> [ID_TENANT] [ID_BRANCH]"
  echo "Exemplo: $0 past_due TENANT_001 BRANCH_001"
  exit 1
fi

case "${STATUS}" in
  active|past_due|canceled|unknown) ;;
  *)
    echo "Status invalido: ${STATUS}"
    exit 1
    ;;
esac

if command -v gcloud >/dev/null 2>&1; then
  ACCESS_TOKEN="$(gcloud auth print-access-token)"
else
  echo "gcloud nao encontrado. Instale o Google Cloud SDK ou exporte ACCESS_TOKEN manualmente."
  exit 1
fi

if [ "${2:-}" != "" ]; then
  ID_TENANT="${2}"
fi

if [ "${3:-}" != "" ]; then
  ID_BRANCH="${3}"
fi

BASE="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents"

curl -sS -X PATCH \
  "${BASE}/tenants/${ID_TENANT}/branches/${ID_BRANCH}?updateMask.fieldPaths=billingStatus" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"fields\":{\"billingStatus\":{\"stringValue\":\"${STATUS}\"}}}"

echo
echo "billingStatus atualizado para '${STATUS}' em ${ID_TENANT}/${ID_BRANCH}."
