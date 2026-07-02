#!/usr/bin/env bash
set -euo pipefail

EXPECTED_PROJECT_ID="1b4f2512-eb91-4cff-bf88-dc1162513275"
EXPECTED_SERVICE="web"

if [ -f "$HOME/.railway/env" ]; then
  # shellcheck disable=SC1090
  source "$HOME/.railway/env"
fi

status_output="$(railway status)"

if ! printf '%s\n' "$status_output" | grep -q "Project ID:      $EXPECTED_PROJECT_ID"; then
  printf '%s\n' "Refusing to deploy: this folder is not linked to the Website Management System Demo Railway project."
  printf '%s\n' ""
  printf '%s\n' "Expected project ID: $EXPECTED_PROJECT_ID"
  printf '%s\n' "Current Railway status:"
  printf '%s\n' "$status_output"
  exit 1
fi

railway up --service "$EXPECTED_SERVICE" --detach --message "Deploy website management demo"
