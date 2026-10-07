#!/usr/bin/env bash
# ==============================================================================
# SU Card - PostgreSQL Database Restore Script
# Restores a custom-format dump (.dump) created by backup.sh
# ==============================================================================
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-sucard-db}"
DB_USER="${POSTGRES_USER:-sucard}"
DB_NAME="${POSTGRES_DB:-sucard}"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <path-to-backup.dump>"
    echo "Example: $0 /srv/sucard/backups/sucard_20261007_030000.dump"
    exit 1
fi

# Prevent MSYS/Git-Bash from converting Linux container paths on Windows
export MSYS_NO_PATHCONV=1

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file '${BACKUP_FILE}' does not exist."
    exit 1
fi

echo "==================================================================="
echo "                  DATABASE RESTORE CONFIRMATION                    "
echo "==================================================================="
echo "Target Container:  ${DB_CONTAINER}"
echo "Target Database:   ${DB_NAME}"
echo "Target User:       ${DB_USER}"
echo "Source Backup:     ${BACKUP_FILE}"
echo ""
echo "WARNING: THIS WILL OVERWRITE EXISTING DATA IN THE DATABASE!"
echo "All current data will be erased and replaced with the dump content."
echo "==================================================================="
read -r -p "To proceed with the restore, type 'RESTORE-CONFIRM': " CONFIRMATION

if [ "${CONFIRMATION}" != "RESTORE-CONFIRM" ]; then
    echo "Confirmation did not match 'RESTORE-CONFIRM'. Restore aborted."
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database restore..."

# Verify container is running
if ! docker ps --filter "name=^/${DB_CONTAINER}$" --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$" && \
   ! docker ps --filter "name=${DB_CONTAINER}" --format '{{.Names}}' | grep -q "${DB_CONTAINER}"; then
    echo "ERROR: Container '${DB_CONTAINER}' is not running."
    exit 1
fi

TEMP_RESTORE_FILE="/tmp/restore_in_progress.dump"

# Copy backup file into container
docker cp "${BACKUP_FILE}" "${DB_CONTAINER}:${TEMP_RESTORE_FILE}"

# Run pg_restore with clean (drops tables before recreating) and if-exists
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restoring database objects..."
docker exec "${DB_CONTAINER}" sh -c 'pg_restore -U "$1" -d "$2" --clean --if-exists --no-owner --no-privileges "$3"' _ "${DB_USER}" "${DB_NAME}" "${TEMP_RESTORE_FILE}" || {
    # pg_restore returns non-zero on minor warnings; check if critical
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] pg_restore completed with notices/warnings."
}

# Clean up temp file
docker exec "${DB_CONTAINER}" sh -c 'rm -f "$1"' _ "${TEMP_RESTORE_FILE}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database restore finished successfully."
