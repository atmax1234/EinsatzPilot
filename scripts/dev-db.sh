#!/usr/bin/env bash

set -euo pipefail

CONTAINER_NAME="${EP_DB_CONTAINER_NAME:-einsatzpilot-postgres}"
IMAGE="${EP_DB_IMAGE:-docker.io/library/postgres:16-alpine}"
HOST_PORT="${EP_DB_PORT:-5432}"
DB_NAME="${EP_DB_NAME:-einsatzpilot}"
DB_USER="${EP_DB_USER:-postgres}"
DB_PASSWORD="${EP_DB_PASSWORD:-postgres}"
VOLUME_NAME="${EP_DB_VOLUME_NAME:-einsatzpilot-postgres-data}"

container_exists() {
  podman container exists "$CONTAINER_NAME"
}

container_is_running() {
  [[ "$(podman inspect -f '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null || true)" == "true" ]]
}

wait_until_ready() {
  local attempt

  for attempt in $(seq 1 30); do
    if podman exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
      echo "Postgres is ready on localhost:${HOST_PORT}."
      echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${HOST_PORT}/${DB_NAME}"
      return 0
    fi

    sleep 1
  done

  echo "Postgres did not become ready in time." >&2
  podman logs "$CONTAINER_NAME" >&2 || true
  exit 1
}

start_container() {
  if container_exists; then
    if container_is_running; then
      echo "Container ${CONTAINER_NAME} is already running."
    else
      podman start "$CONTAINER_NAME" >/dev/null
      echo "Started existing container ${CONTAINER_NAME}."
    fi
  else
    podman run -d \
      --name "$CONTAINER_NAME" \
      -e "POSTGRES_DB=${DB_NAME}" \
      -e "POSTGRES_USER=${DB_USER}" \
      -e "POSTGRES_PASSWORD=${DB_PASSWORD}" \
      -p "${HOST_PORT}:5432" \
      -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
      "$IMAGE" >/dev/null
    echo "Created container ${CONTAINER_NAME} from ${IMAGE}."
  fi

  wait_until_ready
}

stop_container() {
  if ! container_exists; then
    echo "Container ${CONTAINER_NAME} does not exist."
    return 0
  fi

  if ! container_is_running; then
    echo "Container ${CONTAINER_NAME} is already stopped."
    return 0
  fi

  podman stop "$CONTAINER_NAME" >/dev/null
  echo "Stopped container ${CONTAINER_NAME}."
}

show_status() {
  if ! container_exists; then
    echo "Container ${CONTAINER_NAME} does not exist."
    return 0
  fi

  podman ps -a --filter "name=^${CONTAINER_NAME}$" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

  if container_is_running; then
    podman exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME"
  fi
}

show_logs() {
  if ! container_exists; then
    echo "Container ${CONTAINER_NAME} does not exist."
    return 0
  fi

  podman logs "$CONTAINER_NAME"
}

case "${1:-}" in
  up)
    start_container
    ;;
  down)
    stop_container
    ;;
  status)
    show_status
    ;;
  logs)
    show_logs
    ;;
  *)
    echo "Usage: $0 {up|down|status|logs}" >&2
    exit 1
    ;;
esac
