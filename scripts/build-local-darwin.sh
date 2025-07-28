#!/bin/bash
set -e

# This script is designed to be called from build-local.mjs
# It expects platformConfig variables to be set in the environment.

echo "--- Building for macOS ---"

# Use a default version for local builds if not provided
full_version=${PG_FULL_VERSION:-"17.5.0"}
download_version=$(echo "$full_version" | awk -F. '{print $1"."$2}')

# Set up directories
root_directory=$(pwd)
build_dir="${root_directory}/node_modules/.build"
install_directory="${build_dir}/pg-tools-v-local-${id}"
source_directory="${build_dir}/postgresql-src"

echo "PG Version: $download_version"
echo "Install Dir: $install_directory"

# Clean up previous builds
rm -rf "$install_directory" "$source_directory"

# Install Dependencies
echo "--- Installing macOS dependencies ---"
brew install gettext icu4c lz4 llvm openssl readline xz zstd

# Checkout PostgreSQL Source
echo "--- Checking out PostgreSQL source ---"
branch=$(echo "$download_version" | awk -F. '{print "REL_"$1"_"$2}')
git clone --depth 1 --branch "$branch" -c advice.detachedHead=false \
  https://git.postgresql.org/git/postgresql.git "$source_directory"

# Configure Build
echo "--- Configuring build ---"
if [[ "$(uname -m)" == "arm64" ]]; then
  brew_opt_dir="/opt/homebrew/opt"
else
  brew_opt_dir="/usr/local/opt"
fi

export CPPFLAGS="-I${brew_opt_dir}/icu4c/include -I${brew_opt_dir}/openssl/include"
export LDFLAGS="-L${brew_opt_dir}/icu4c/lib -L${brew_opt_dir}/openssl/lib"
export PKG_CONFIG_PATH="${brew_opt_dir}/openssl/lib/pkgconfig:${brew_opt_dir}/icu4c/lib/pkgconfig"
export LLVM_CONFIG="${brew_opt_dir}/llvm/bin/llvm-config"

cd "$source_directory"

# Build from Source
echo "--- Building from source ---"
major_version=$(echo "$download_version" | awk -F. '{print $1}')
configure_args=(
  --prefix="$install_directory"
  --enable-integer-datetimes
  --with-openssl
  --with-zlib
  --with-readline
  --with-pgport=5432
)

if [ "$major_version" -le 16 ]; then configure_args+=(--enable-thread-safety); fi
if [ "$major_version" -ge 14 ]; then configure_args+=(--with-icu --with-lz4); else configure_args+=(--without-icu); fi
if [ "$major_version" -ge 16 ]; then configure_args+=(--with-llvm --with-zstd); fi

./configure "${configure_args[@]}"

# Build all dependencies in parallel
make -j$(sysctl -n hw.ncpu)

# Install only the components we need.
# The pg_dump install script seems to handle all client binaries.
make -C src/interfaces/libpq install
make -C src/bin/pg_dump install

# Update library paths
echo "--- Fixing library paths ---"
find "${install_directory}/bin" -type f -name "pg_*" | while read -r binary; do
  if [[ -f "$binary" ]]; then
    install_name_tool -change "${install_directory}/lib/libpq.5.dylib" \
      "@executable_path/../lib/libpq.5.dylib" "$binary" 2>/dev/null || true
  fi
done

echo "--- macOS build script finished ---"
