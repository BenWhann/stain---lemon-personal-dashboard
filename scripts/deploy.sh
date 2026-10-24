#!/usr/bin/env bash
# Runs on the VPS (called by GitHub Actions). Pulls the given image tag, restarts
# the stack, waits for health, and rolls back to the last good tag on failure.
#   usage: scripts/deploy.sh <image-tag>
#   SKIP_PULL=1 scripts/deploy.sh <tag>   redeploy images already on this machine
set -euo pipefail
cd "$(dirname "$0")/.."

TAG="${1:?usage: scripts/deploy.sh <image-tag>}"
[ -f .env ] || { echo "deploy: .env is missing in $(pwd). Copy .env.example and fill it in." >&2; exit 1; }

save_tag() {
  if grep -q '^IMAGE_TAG=' .env; then
    sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$1/" .env
  else
    echo "IMAGE_TAG=$1" >> .env
  fi
}

# IMAGE_TAG in the environment wins over .env, so nothing is written until the new tag is proven
up_with() {
  IMAGE_TAG="$1" docker compose up -d --remove-orphans --no-build
}

wait_healthy() {
  for _ in $(seq 1 40); do
    api="$(docker inspect -f '{{.State.Health.Status}}' lemon-stain-api 2>/dev/null || echo missing)"
    web="$(docker inspect -f '{{.State.Running}}' lemon-stain-web 2>/dev/null || echo false)"
    if [ "$api" = "healthy" ] && [ "$web" = "true" ]; then return 0; fi
    sleep 3
  done
  return 1
}

PREVIOUS="$(cat .last_good_tag 2>/dev/null || true)"

echo "deploy: backing up the database"
./scripts/backup.sh || echo "deploy: backup skipped (first deploy?)"

if [ "${SKIP_PULL:-0}" != "1" ]; then
  echo "deploy: pulling $TAG"
  IMAGE_TAG="$TAG" docker compose pull --quiet
fi

echo "deploy: starting $TAG"
if up_with "$TAG" && wait_healthy; then
  save_tag "$TAG"
  echo "$TAG" > .last_good_tag
  docker image prune -f --filter "until=168h" >/dev/null || true
  echo "deploy: $TAG is live"
  exit 0
fi

echo "deploy: $TAG failed its health check" >&2
docker compose logs --tail=60 api web >&2 || true
if [ -n "$PREVIOUS" ] && [ "$PREVIOUS" != "$TAG" ]; then
  echo "deploy: rolling back to $PREVIOUS" >&2
  up_with "$PREVIOUS"
  if wait_healthy; then
    save_tag "$PREVIOUS"
    echo "deploy: rollback to $PREVIOUS is healthy" >&2
  else
    echo "deploy: rollback to $PREVIOUS is ALSO unhealthy; check 'docker compose logs'" >&2
  fi
fi
exit 1
