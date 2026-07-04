#!/bin/sh
# Generate /app/config.json at container startup from environment variables so the
# deployed homeserver can be set per-environment without rebuilding the image.
#
#   HOMESERVER_URL       full base URL of the Matrix homeserver (default: http://localhost:8008)
#   HOMESERVER_NAME      Matrix server name / homeserverList[0] (default: derived from HOMESERVER_URL host)
#   MEDIA_REDACTION_URL  AIPulse image-redaction endpoint, e.g. https://app.example.com/api/matrix/upload-media
#                        (default: empty — image uploads are refused until configured)
#   LOGOUT_REDIRECT_URL  IdP end-session URL the browser is sent to after logout, so the
#                        Keycloak SSO session is terminated too, e.g.
#                        https://kc.example.com/realms/aipulse/protocol/openid-connect/logout?client_id=synapse&post_logout_redirect_uri=https%3A%2F%2Fchat.example.com%2F
#                        (default: empty — logout just reloads the page)
set -eu

HOMESERVER_URL="${HOMESERVER_URL:-http://localhost:8008}"
MEDIA_REDACTION_URL="${MEDIA_REDACTION_URL:-}"
LOGOUT_REDIRECT_URL="${LOGOUT_REDIRECT_URL:-}"

# Derive the server name from the URL host (strip scheme) when not provided.
if [ -z "${HOMESERVER_NAME:-}" ]; then
  HOMESERVER_NAME="$(printf '%s' "$HOMESERVER_URL" | sed -e 's#^[a-zA-Z][a-zA-Z0-9+.-]*://##' -e 's#/.*$##')"
fi

cat > /app/config.json <<EOF
{
  "defaultHomeserver": 0,
  "homeserverList": ["${HOMESERVER_NAME}"],
  "homeserverBaseUrl": "${HOMESERVER_URL}",
  "allowCustomHomeservers": false,

  "aipulse": {
    "mediaRedactionUrl": "${MEDIA_REDACTION_URL}",
    "logoutRedirectUrl": "${LOGOUT_REDIRECT_URL}"
  },

  "hashRouter": {
    "enabled": false,
    "basename": "/"
  }
}
EOF

echo "40-generate-config.sh: wrote /app/config.json (homeserver ${HOMESERVER_URL}, name ${HOMESERVER_NAME}, media redaction ${MEDIA_REDACTION_URL:-<unset>}, logout redirect ${LOGOUT_REDIRECT_URL:-<unset>})"
