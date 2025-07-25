# PG Backup Tools

Cross-platform PostgreSQL `pg_dump` and `pg_restore` binaries built automatically for multiple architectures.

## 🚀 Supported Platforms

### Linux
| Platform | Architecture | C Library | Description |
|----------|-------------|-----------|-------------|
| `linux-x64-gnu` | x86_64 | GNU libc | Standard Linux 64-bit |
| `linux-x64-musl` | x86_64 | musl libc | Static Linux 64-bit |
| `linux-aarch64-gnu` | ARM64 | GNU libc | ARM 64-bit (Raspberry Pi 4+) |
| `linux-aarch64-musl` | ARM64 | musl libc | Static ARM 64-bit |
| `linux-arm-gnueabihf` | ARMv7 | GNU libc | ARM 32-bit (Raspberry Pi 2/3) |
| `linux-arm-musleabihf` | ARMv7 | musl libc | Static ARM 32-bit |
| `linux-powerpc64le-gnu` | PowerPC64LE | GNU libc | IBM POWER8+ |
| `linux-s390x-gnu` | s390x | GNU libc | IBM System z |
| `linux-riscv64-gnu` | RISC-V 64 | GNU libc | RISC-V 64-bit |

### Other Platforms
| Platform | Architecture | Description |
|----------|-------------|-------------|
| `macos-arm64` | Apple Silicon | macOS M1/M2 |
| `macos-x64` | Intel x64 | macOS Intel |
| `windows-x64` | x64 | Windows 64-bit |
| `freebsd-x64` | x64 | FreeBSD 64-bit |

## 📦 Download

Get the latest binaries from the [Releases](../../releases) page. Each release includes:
- Pre-compiled `pg_dump` and `pg_restore` binaries
- All required libraries bundled
- Ready to run without PostgreSQL installation

### Platform Availability Notes

- **All platforms**: Consistently available for all supported PostgreSQL versions using Debian 12.4 base images with multi-architecture support.

## 🔧 Usage

1. Download the appropriate archive for your platform
2. Extract the binaries
3. Run directly:
   ```bash
   ./bin/pg_dump --version
   ./bin/pg_restore --version
   ```

## 🏗️ Build Process

The binaries are built and released automatically via GitHub Actions:

- **CI Builds:** Pushes and pull requests trigger test builds for core platforms
- **Extended CI:** Manual trigger with additional architectures for comprehensive testing
- **Manual Platform Tests:** Test individual platforms or all platforms on-demand
- **Releases:** Version tags (e.g., `v16.3.2`) trigger full multi-platform builds and publish to GitHub Releases

### Testing Options

| Workflow | Trigger | Platforms | Use Case |
|----------|---------|-----------|----------|
| **Continuous Integration** | Automatic (push/PR) | Core platforms | Fast feedback |
| **Extended CI** | Manual with option | Core + ARM/FreeBSD | Pre-release validation |
| **Manual Platform Test** | Manual with selection | Any single or all | Debug specific issues |
| **Release** | Git tag | All platforms | Production builds |

## 🎯 Use Cases

Perfect for:
- **Containerized environments** where you only need backup tools
- **Embedded systems** with limited storage
- **CI/CD pipelines** requiring lightweight PostgreSQL utilities
- **Cross-platform deployments** with consistent tooling
- **Air-gapped environments** with pre-built binaries

## 🔍 Version Support

This project builds PostgreSQL tools for multiple versions:
- **Latest stable**: PostgreSQL 17.x (default for CI)
- **Tagged releases**: Match PostgreSQL version tags (e.g., `v16.3.2`)
- **Custom versions**: Modify workflow for specific versions

## 🛠️ Technical Details

### Build Method
- **Linux**: Docker multi-architecture builds with QEMU emulation
- **macOS**: Native compilation on GitHub runners
- **Windows**: Pre-compiled binaries from EnterpriseDB
- **FreeBSD**: Cross-compilation on Linux

### Dependencies
- All required libraries are bundled (SSL, crypto, zlib)
- Binaries use relative paths for portability
- No PostgreSQL server installation required

### Testing
Each build includes automated tests:
- Binary execution verification
- Version string validation
- Basic functionality checks

## 📋 Requirements

### Runtime
- No PostgreSQL installation required
- Compatible with target platform's C library
- Minimal system dependencies

### Build (for contributors)
- Docker with buildx support
- GitHub Actions (automated)
- Multi-architecture emulation via QEMU

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test your changes with CI builds
4. Submit a pull request

### Adding New Platforms
See [PLATFORMS.md](PLATFORMS.md) for detailed instructions on adding support for additional platforms.

## 📄 License

This project follows PostgreSQL's licensing. The built binaries are distributed under the same terms as PostgreSQL itself.

## 🔗 Related Projects

- [PostgreSQL Official](https://www.postgresql.org/) - The main PostgreSQL project
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html) - Official pg_dump docs
- [pg_restore Documentation](https://www.postgresql.org/docs/current/app-pgrestore.html) - Official pg_restore docs