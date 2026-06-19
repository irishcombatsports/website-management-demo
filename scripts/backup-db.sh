#!/bin/bash
# Training Club Database Backup
# Pulls the live Railway SQLite DB down to your Mac.
# Usage: bash scripts/backup-db.sh
#
# Requires: railway CLI logged in (run `railway login` first)
# Backups saved to: scripts/backups/

set -e

BACKUP_DIR="$(dirname "$0")/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/club_$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

echo "Training Club Database Backup"
echo "━━━━━━━━━━━━━━━━━━━━━━"

# Check Railway CLI is installed and logged in
if ! command -v railway &> /dev/null; then
  echo "❌ Railway CLI not installed. Run: npm install -g @railway/cli"
  exit 1
fi

if ! railway status &> /dev/null; then
  echo "❌ Not logged in to Railway. Run: railway login"
  exit 1
fi

echo "🔗 Connecting to Railway..."
cd "$(dirname "$0")/.."

# Copy the DB file from the Railway container
railway run cp /app/backend/data/club.db /tmp/club_backup.db

echo "⬇️  Downloading..."
railway run cat /tmp/club_backup.db > "$BACKUP_FILE"

SIZE=$(wc -c < "$BACKUP_FILE" | tr -d ' ')
echo "OK Backup saved: $BACKUP_FILE ($SIZE bytes)"

# Quick summary of what's in it
echo ""
echo "📊 Contents:"
node -e "
const db = require('./backend/src/db/database');
// point to backup
const Database = require('better-sqlite3');
const backup = new Database('$BACKUP_FILE', { readonly: true });
const users = backup.prepare('SELECT COUNT(*) as c FROM users').get().c;
const members = backup.prepare(\"SELECT COUNT(*) as c FROM users WHERE role='member'\").get().c;
const memberships = backup.prepare('SELECT COUNT(*) as c FROM memberships').get().c;
console.log('  Users:', users, '(members:', members + ')');
console.log('  Memberships:', memberships);
backup.close();
" 2>/dev/null || echo "  (install better-sqlite3 locally to see summary)"

echo ""
echo "Backups kept in: scripts/backups/"
echo "To restore: cp $BACKUP_FILE backend/data/club.db"
