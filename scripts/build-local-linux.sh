#!/bin/bash
set -e

# This script is designed to be called from build-local.mjs
# It expects platformConfig variables to be set in the environment.

echo "--- Building for Linux ---"

# Use a default version for local builds if not provided
full_version=${PG_FULL_VERSION:-"17.5.0"}
download_version=$(echo "$full_version" | awk -F. '{print $1"."$2}')

# Set up directories
root_directory=$(pwd)
build_dir="${root_directory}/node_modules/.build"
install_directory="${build_dir}/pg-tools-v-local-${id}"

echo "PG Version: $download_version"
echo "Install Dir: $install_directory"
echo "Platform: $platform"

# Clean up previous builds
rm -rf "$install_directory"

# Setup Docker Build
echo "--- Setting up Docker build environment ---"
docker run --privileged --rm tonistiigi/binfmt --install all

if [[ "$id" == *freebsd* ]]; then
  DOCKERFILE=dockerfiles/Dockerfile.freebsd
elif [[ "$id" == *musl* ]]; then
  DOCKERFILE=dockerfiles/Dockerfile.linux-musl
elif [[ "$id" == *arm* ]]; then
  DOCKERFILE=dockerfiles/Dockerfile.linux-arm
else
  DOCKERFILE=dockerfiles/Dockerfile.linux-gnu
fi

echo "Using Dockerfile: $DOCKERFILE"

# Build with Docker
echo "--- Building with Docker ---"
docker buildx build \
  --build-arg "POSTGRESQL_VERSION=${download_version}" \
  --build-arg "PG_MAJOR_VERSION=${download_version}" \
  --platform "$platform" \
  --tag pg-tools-build:local \
  -f "${DOCKERFILE}" .

# Extract specific artifacts
echo "--- Extracting artifacts from Docker container ---"
container_id=$(docker create --platform "$platform" pg-tools-build:local)

mkdir -p "${install_directory}/bin"
mkdir -p "${install_directory}/lib"

docker cp "${container_id}:/opt/postgresql/bin/pg_dump" "${install_directory}/bin/"
docker cp "${container_id}:/opt/postgresql/bin/pg_restore" "${install_directory}/bin/"
docker cp "${container_id}:/opt/postgresql/lib/libpq.so" "${install_directory}/lib/"
# Also copy the symlinks if they exist
docker cp "${container_id}:/opt/postgresql/lib/libpq.so.5" "${install_directory}/lib/" 2>/dev/null || true

docker rm -v "${container_id}"

echo "--- Linux build script finished ---"
