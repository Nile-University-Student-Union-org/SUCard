#!/usr/bin/env bash
# ==============================================================================
# SU Card - PostgreSQL Automated Backup Script (M13-5)
# Nightly pg_dump (custom format, compressed) with 14-day daily retention
# + weekly archives kept 8 weeks + optional off-site rclone hook
# ==============================================================================
set -euo pipefail

# Configuration with environment variable overrides
BACKUP_DIR="${BACKUP_DIR:-/srv/sucard/backups}"
WEEKLY_DIR="${BACKUP_DIR}/weekly"
DB_CONTAINER="${DB_CONTAINER:-sucard-db}"
DB_USER="${POSTGRES_USER:-sucard}"
DB_NAME="${POSTGRES_DB:-sucard}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"

DATE="$(date +%Y%m%d_%H%M%S)"
DAY_OF_WEEK="$(date +%u)" # 1 = Monday ... 7 = Sunday
DUMP_FILENAME="sucard_${DATE}.dump"
TARGET_FILE="${BACKUP_DIR}/${DUMP_FILENAME}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Ensure destination directories exist
mkdir -p "${BACKUP_DIR}" "${WEEKLY_DIR}"

log "Starting database backup for '${DB_NAME}' from container '${DB_CONTAINER}'..."

# Verify container is running
if ! docker ps --filter "name=^/${DB_CONTAINER}$" --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$" && \
   ! docker ps --filter "name=${DB_CONTAINER}" --format '{{.Names}}' | grep -q "${DB_CONTAINER}"; then
    log "ERROR: Container '${DB_CONTAINER}' is not running."
    exit 1
fi

# Prevent MSYS/Git-Bash from converting Linux container paths on Windows
export MSYS_NO_PATHCONV=1

# Run pg_dump in custom compressed format (-F c) inside container and copy out
TEMP_CONTAINER_DUMP="/tmp/backup_${DATE}.dump"
docker exec "${DB_CONTAINER}" sh -c 'pg_dump -U "$1" -d "$2" -F c -b -f "$3"' _ "${DB_USER}" "${DB_NAME}" "${TEMP_CONTAINER_DUMP}"
docker cp "${DB_CONTAINER}:${TEMP_CONTAINER_DUMP}" "${TARGET_FILE}"
docker exec "${DB_CONTAINER}" sh -c 'rm -f "$1"' _ "${TEMP_CONTAINER_DUMP}"

# Check dump file size
FILE_SIZE="$(wc -c < "${TARGET_FILE}" | tr -d ' ')"
log "Backup completed: ${TARGET_FILE} (${FILE_SIZE} bytes)"

# If Sunday (7), also store in weekly retention folder
if [ "${DAY_OF_WEEK}" -eq 7 ]; then
    WEEKLY_FILE="${WEEKLY_DIR}/sucard_weekly_${DATE}.dump"
    cp "${TARGET_FILE}" "${WEEKLY_FILE}"
    log "Weekly archive copied to: ${WEEKLY_FILE}"
fi

# Apply retention policy:
# 1. Daily backups older than 14 days
log "Applying retention policy: deleting daily dumps older than 14 days..."
find "${BACKUP_DIR}" -maxdepth 1 -type f -name "sucard_*.dump" -mtime +14 -exec rm -f {} + 2>/dev/null || true

# 2. Weekly backups older than 56 days (8 weeks)
log "Applying retention policy: deleting weekly dumps older than 56 days (8 weeks)..."
find "${WEEKLY_DIR}" -maxdepth 1 -type f -name "sucard_weekly_*.dump" -mtime +56 -exec rm -f {} + 2>/dev/null || true

# Optional off-site sync hook (e.g. Cloudflare R2 / Backblaze B2 via rclone)
if [ -n "${RCLONE_REMOTE}" ]; then
    log "Syncing backup to off-site remote '${RCLONE_REMOTE}'..."
    if command -v rclone >/dev/null 2>&1; then
        rclone copy "${TARGET_FILE}" "${RCLONE_REMOTE}"
        log "Off-site copy successful."
    else
        log "WARNING: rclone is not installed; skipped off-site sync."
    fi
else
    log "No RCLONE_REMOTE configured; off-site sync skipped."
fi

log "Backup workflow finished successfully."
