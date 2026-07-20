#!/usr/bin/env bash
set -euo pipefail

EXPECTED_PROJECT_ID="1b4f2512-eb91-4cff-bf88-dc1162513275"
EXPECTED_SERVICE="web"

if [ -f "$HOME/.railway/env" ]; then
  # shellcheck disable=SC1090
  source "$HOME/.railway/env"
fi

set +e
status_output="$(railway status 2>&1)"
status_code=$?
set -e

if [ "$status_code" -ne 0 ] && ! printf '%s\n' "$status_output" | grep -q "Project ID:      $EXPECTED_PROJECT_ID"; then
  printf '%s\n' "Refusing to deploy: Railway status could not confirm the expected project."
  printf '%s\n' "$status_output"
  exit 1
fi

if ! printf '%s\n' "$status_output" | grep -q "Project ID:      $EXPECTED_PROJECT_ID"; then
  printf '%s\n' "Refusing to deploy: this folder is not linked to the Website Management System Demo Railway project."
  printf '%s\n' ""
  printf '%s\n' "Expected project ID: $EXPECTED_PROJECT_ID"
  printf '%s\n' "Current Railway status:"
  printf '%s\n' "$status_output"
  exit 1
fi

railway up --service "$EXPECTED_SERVICE" --detach --message "Deploy website management demo"
