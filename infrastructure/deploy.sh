#!/usr/bin/env bash
set -euo pipefail
cd /srv/lumavok
frontend_image="${1:?Frontend image digest required}"
backend_image="${2:?Backend image digest required}"
for image in "$frontend_image" "$backend_image"; do
  [[ "$image" =~ ^ghcr.io/[a-z0-9._/-]+@sha256:[0-9a-f]{64}$ ]] || exit 1
done
[[ -f api.env && -f web.env && -f compose.yml ]] || { echo 'Provision server configuration first'; exit 1; }
exec 9>.deploy.lock
flock -n 9 || { echo 'Another deployment is active'; exit 1; }
export FRONTEND_IMAGE="$frontend_image" BACKEND_IMAGE="$backend_image" API_ENV_FILE=/srv/lumavok/api.env WEB_ENV_FILE=/srv/lumavok/web.env
previous=.release.env
if [[ -f "$previous" ]]; then cp "$previous" .release.previous.env; fi
docker compose pull
docker compose up --detach --wait --wait-timeout 180
# Write the new release pointer only after health checks pass. On failure the
# previously recorded digests remain available for the operator's rollback.
umask 077
printf 'FRONTEND_IMAGE=%s\nBACKEND_IMAGE=%s\n' "$FRONTEND_IMAGE" "$BACKEND_IMAGE" > .release.env
