#!/bin/sh
# Generate /app/config.json at container startup from environment variables so the
# deployed homeserver can be set per-environment without rebuilding the image.
#
#   HOMESERVER_URL   full base URL of the Matrix homeserver (default: http://localhost:8008)
#   HOMESERVER_NAME  Matrix server name / homeserverList[0] (default: derived from HOMESERVER_URL host)
set -eu

HOMESERVER_URL="${HOMESERVER_URL:-http://localhost:8008}"

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

  "hashRouter": {
    "enabled": false,
    "basename": "/"
  }
}
EOF

echo "40-generate-config.sh: wrote /app/config.json (homeserver ${HOMESERVER_URL}, name ${HOMESERVER_NAME})"
