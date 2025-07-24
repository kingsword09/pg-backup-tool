#!/bin/sh

# This script is a simple smoke test for the pg_dump and pg_restore binaries.
# It checks if the binaries are executable and can report their version.

set -e

# The version should be passed as the first argument.
EXPECTED_VERSION=$1
if [ -z "$EXPECTED_VERSION" ]; then
  echo "Usage: $0 <expected-version>"
  exit 1
fi

echo "--- Testing pg_dump ---"
./bin/pg_dump --version
ACTUAL_DUMP_VERSION=$(./bin/pg_dump --version)

if ! echo "$ACTUAL_DUMP_VERSION" | grep -q "$EXPECTED_VERSION"; then
  echo "ERROR: pg_dump version mismatch. Expected '$EXPECTED_VERSION', but got '$ACTUAL_DUMP_VERSION'."
  exit 1
fi

echo "--- Testing pg_restore ---"
./bin/pg_restore --version
ACTUAL_RESTORE_VERSION=$(./bin/pg_restore --version)

if ! echo "$ACTUAL_RESTORE_VERSION" | grep -q "$EXPECTED_VERSION"; then
  echo "ERROR: pg_restore version mismatch. Expected '$EXPECTED_VERSION', but got '$ACTUAL_RESTORE_VERSION'."
  exit 1
fi

echo "--- All tests passed! ---"
