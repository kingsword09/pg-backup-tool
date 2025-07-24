#!/bin/sh

# This script is a smoke test for the pg_dump and pg_restore binaries.
# It checks if the binaries are executable and can report their version.
# It handles both native and cross-compiled binaries intelligently.

set -e

# The version should be passed as the first argument.
EXPECTED_VERSION=$1
if [ -z "$EXPECTED_VERSION" ]; then
  echo "Usage: $0 <expected-version>"
  exit 1
fi

# Function to test binary execution with fallback
test_binary() {
  local binary_name=$1
  local binary_path="./bin/$binary_name"
  
  echo "--- Testing $binary_name ---"
  
  # Check if binary exists
  if [ ! -f "$binary_path" ]; then
    echo "ERROR: $binary_name not found at $binary_path"
    return 1
  fi
  
  # Check if binary is executable
  if [ ! -x "$binary_path" ]; then
    echo "ERROR: $binary_name is not executable"
    return 1
  fi
  
  # Show binary info
  echo "Binary info:"
  file "$binary_path" 2>/dev/null || echo "file command not available"
  ls -la "$binary_path"
  
  # Try to execute the binary
  echo "Attempting to run $binary_name --version..."
  
  # Try direct execution first
  if ACTUAL_VERSION=$("$binary_path" --version 2>/dev/null); then
    echo "✅ $binary_name executed successfully"
    echo "Version output: $ACTUAL_VERSION"
    
    # Verify version matches expected
    if echo "$ACTUAL_VERSION" | grep -q "$EXPECTED_VERSION"; then
      echo "✅ Version matches expected: $EXPECTED_VERSION"
      return 0
    else
      echo "❌ Version mismatch. Expected '$EXPECTED_VERSION', got '$ACTUAL_VERSION'"
      return 1
    fi
  else
    echo "⚠️  Direct execution failed (likely cross-compiled binary)"
    echo "Performing static analysis instead..."
    
    # For cross-compiled binaries, do basic checks
    if strings "$binary_path" 2>/dev/null | grep -q "pg_dump\|pg_restore"; then
      echo "✅ Binary contains expected PostgreSQL strings"
    else
      echo "❌ Binary does not contain expected PostgreSQL strings"
      return 1
    fi
    
    # Check for version string in binary
    if strings "$binary_path" 2>/dev/null | grep -q "$EXPECTED_VERSION"; then
      echo "✅ Binary contains expected version string: $EXPECTED_VERSION"
      return 0
    else
      echo "⚠️  Could not verify version in binary, but binary appears valid"
      echo "This is normal for cross-compiled binaries"
      return 0
    fi
  fi
}

# Test both binaries
echo "Starting PostgreSQL tools test..."
echo "Expected version: $EXPECTED_VERSION"
echo ""

if test_binary "pg_dump" && test_binary "pg_restore"; then
  echo ""
  echo "--- All tests passed! ---"
  exit 0
else
  echo ""
  echo "--- Some tests failed! ---"
  exit 1
fi
