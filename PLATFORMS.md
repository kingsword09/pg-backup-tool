# Platform Development Guide

Technical documentation for maintaining and extending platform support in the PG Backup Tools project.

## Current Platform Matrix

This document provides technical details for developers working on platform support. For user-facing platform information, see [README.md](README.md).

### Linux Platforms

#### GNU libc Targets

- `linux-x64-gnu` - Standard x86_64 Linux
- `linux-aarch64-gnu` - ARM64 Linux
- `linux-arm-gnueabihf` - ARMv7 Linux with hard float
- `linux-powerpc64le-gnu` - PowerPC 64-bit Little Endian
- `linux-s390x-gnu` - IBM System z
- `linux-riscv64-gnu` - RISC-V 64-bit

#### musl libc Targets (Static Linking)

- `linux-x64-musl` - x86_64 with musl
- `linux-aarch64-musl` - ARM64 with musl
- `linux-arm-musleabihf` - ARMv7 with musl and hard float

#### Other Platforms

- `macos-arm64` - Apple Silicon (native build)
- `macos-x64` - Intel macOS (native build)
- `windows-x64` - Windows (pre-compiled binaries)
- `freebsd-x64` - FreeBSD (cross-compiled)

## Build Matrix

The release workflow builds all platforms, while the CI workflow tests a subset of key platforms for faster feedback.

### Release Builds

All platforms listed above are built for each release.

### CI Builds (for testing)

- linux-x64-gnu
- linux-x64-musl
- linux-aarch64-gnu
- macos-arm64
- windows-x64

## Architecture Support

### Docker Multi-Architecture

Linux builds use Docker with buildx for cross-compilation:

- Supports emulation via QEMU for non-native architectures
- Uses architecture-specific base images when available
- Automatically detects and copies required shared libraries

### Native Builds

- macOS: Built natively on GitHub-hosted runners
- Windows: Uses pre-compiled PostgreSQL binaries from EnterpriseDB

## Notes

1. **Android**: Not currently supported due to complexity of cross-compilation setup
2. **FreeBSD**: Cross-compiled on Linux (simplified approach)
3. **Static vs Dynamic**: musl builds are more static, GNU builds are dynamically linked
4. **Library Dependencies**: All required libraries are bundled in the release packages

## Testing

Each build includes a smoke test that verifies:

- Binaries are executable
- Version information is correct
- Basic functionality works

## Adding New Platforms

To add a new platform:

1. Add entry to the release matrix in `.github/workflows/release.yml`
2. Create appropriate Dockerfile if needed
3. Update build logic in `.github/workflows/build.yml`
4. Test the new platform in CI if desired
