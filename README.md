# PG Backup Tools

[![npm version](https://badge.fury.io/js/pg-backup-tool.svg)](https://badge.fury.io/js/pg-backup-tool)
[![CI](https://github.com/kingsword09/pg-backup-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/kingsword09/pg-backup-tool/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

Cross-platform PostgreSQL `pg_dump` and `pg_restore` binaries built automatically for multiple architectures. Use as standalone binaries or integrate into your Node.js applications with full TypeScript support.

## ✨ Features

- 🚀 **Zero Dependencies**: No PostgreSQL installation required
- 🌍 **Cross-Platform**: Supports Linux, macOS, Windows, and FreeBSD
- 🏗️ **Multiple Architectures**: x64, ARM64, ARM, PowerPC, s390x, RISC-V
- 📦 **Node.js Integration**: Full TypeScript API with comprehensive options
- 🔧 **Production Ready**: Automated builds and testing across all platforms
- 📋 **Complete Toolset**: Both `pg_dump` and `pg_restore` included

## 🚀 Supported Platforms

### Linux

| Platform                | Architecture | C Library | Description                   |
| ----------------------- | ------------ | --------- | ----------------------------- |
| `linux-x64-gnu`         | x86_64       | GNU libc  | Standard Linux 64-bit         |
| `linux-x64-musl`        | x86_64       | musl libc | Static Linux 64-bit           |
| `linux-aarch64-gnu`     | ARM64        | GNU libc  | ARM 64-bit (Raspberry Pi 4+)  |
| `linux-aarch64-musl`    | ARM64        | musl libc | Static ARM 64-bit             |
| `linux-arm-gnueabihf`   | ARMv7        | GNU libc  | ARM 32-bit (Raspberry Pi 2/3) |
| `linux-arm-musleabihf`  | ARMv7        | musl libc | Static ARM 32-bit             |
| `linux-powerpc64le-gnu` | PowerPC64LE  | GNU libc  | IBM POWER8+                   |
| `linux-s390x-gnu`       | s390x        | GNU libc  | IBM System z                  |
| `linux-riscv64-gnu`     | RISC-V 64    | GNU libc  | RISC-V 64-bit                 |

### Other Platforms

| Platform      | Architecture  | Description    |
| ------------- | ------------- | -------------- |
| `macos-arm64` | Apple Silicon | macOS M1/M2    |
| `macos-x64`   | Intel x64     | macOS Intel    |
| `windows-x64` | x64           | Windows 64-bit |
| `freebsd-x64` | x64           | FreeBSD 64-bit |

## 📦 Download

Get the latest binaries from the [Releases](../../releases) page. Each release includes:

- Pre-compiled `pg_dump` and `pg_restore` binaries
- All required libraries bundled
- Ready to run without PostgreSQL installation

### Platform Availability Notes

- **All platforms**: Consistently available for all supported PostgreSQL versions using Debian 12.4 base images with multi-architecture support.

## 🔧 Usage

### As Pre-built Binaries

1. Download the appropriate archive for your platform
2. Extract the binaries
3. Run directly:
   ```bash
   ./bin/pg_dump --version
   ./bin/pg_restore --version
   ```

### As Node.js Package

Install the package in your Node.js project:

```bash
npm install pg-backup-tool
# or
pnpm add pg-backup-tool
# or
yarn add pg-backup-tool
```

Use in your code:

```javascript
import { dump, restore } from 'pg-backup-tool';

// Basic database dump
await dump({
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  dbname: 'mydb',
  file: 'backup.sql',
});

// Advanced dump with custom format and compression
await dump({
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  dbname: 'mydb',
  file: 'backup.dump',
  format: 'c', // custom format
  compress: 9, // maximum compression
  verbose: true, // verbose output
  jobs: 4, // parallel jobs (directory format only)
});

// Restore database
await restore({
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  dbname: 'mydb',
  file: 'backup.sql',
});

// Restore with options
await restore({
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  dbname: 'mydb',
  file: 'backup.dump',
  clean: true, // drop existing objects
  create: true, // create database
  verbose: true, // verbose output
});
```

#### TypeScript Support

The package includes full TypeScript definitions with detailed JSDoc comments for all options:

```typescript
import { dump, restore, PgDumpOptions, PgRestoreOptions } from 'pg-backup-tool';

const dumpOptions: PgDumpOptions = {
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  dbname: 'mydb',
  file: 'backup.sql',
  schemaOnly: true, // Only dump schema, not data
  table: 'users', // Only dump specific table
};

await dump(dumpOptions);
```

## 🏗️ Build Process

The binaries are built and released automatically via GitHub Actions:

- **CI Builds:** Pushes and pull requests trigger test builds for core platforms
- **Extended CI:** Manual trigger with additional architectures for comprehensive testing
- **Manual Platform Tests:** Test individual platforms or all platforms on-demand
- **Releases:** Version tags (e.g., `v16.3.2`) trigger full multi-platform builds and publish to GitHub Releases

### Testing Options

| Workflow                   | Trigger               | Platforms          | Use Case               |
| -------------------------- | --------------------- | ------------------ | ---------------------- |
| **Continuous Integration** | Automatic (push/PR)   | Core platforms     | Fast feedback          |
| **Extended CI**            | Manual with option    | Core + ARM/FreeBSD | Pre-release validation |
| **Manual Platform Test**   | Manual with selection | Any single or all  | Debug specific issues  |
| **Release**                | Git tag               | All platforms      | Production builds      |

## 🎯 Use Cases

Perfect for:

- **Containerized environments** where you only need backup tools
- **Embedded systems** with limited storage
- **CI/CD pipelines** requiring lightweight PostgreSQL utilities
- **Cross-platform deployments** with consistent tooling
- **Air-gapped environments** with pre-built binaries

## 🔍 Version Support

This project currently builds PostgreSQL 17.5.0 tools:

- **Current version**: PostgreSQL 17.5.0 (as specified in package.json)
- **Node.js compatibility**: Node.js 20+
- **Platform binaries**: All platforms use the same PostgreSQL version for consistency

### Version Information

Check the current PostgreSQL version:

```bash
# Using the binaries directly
./bin/pg_dump --version
./bin/pg_restore --version

# Using the Node.js API
import { dump } from 'pg-backup-tool';
await dump({ version: true });
```

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

## 🔧 Troubleshooting

### Common Issues

#### "Could not find optional dependency" Error

If you see an error like:

```
Could not find optional dependency @kingsword/pg-backup-tool-macos-arm64
```

**Solutions:**

1. **Reinstall dependencies**: `pnpm install` or `npm install`
2. **Check platform support**: Ensure your platform is in the supported list above
3. **Manual installation**: Install the specific platform package:
   ```bash
   pnpm add @kingsword/pg-backup-tool-macos-arm64
   ```

#### Binary Not Found

If binaries are not found during execution:

1. **Verify installation**: Check that the platform-specific package is installed
2. **Check permissions**: Ensure binaries have execute permissions
3. **Platform mismatch**: Verify you're using the correct platform package

#### Build Issues

For local development build issues:

1. **Docker requirements**: Ensure Docker is running and buildx is available
2. **Platform emulation**: Some platforms require QEMU for cross-compilation
3. **Clean build**: Run `pnpm run clean` and rebuild

### Getting Help

1. **Check existing issues**: [GitHub Issues](https://github.com/kingsword09/pg-backup-tool/issues)
2. **Create new issue**: Include platform, Node.js version, and error details
3. **Enable verbose logging**: Use `verbose: true` in dump/restore options

## 💻 Development

### Prerequisites

- Node.js 20+
- pnpm (recommended package manager)
- Docker (for building platform-specific binaries)

### Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/kingsword09/pg-backup-tool.git
   cd pg-backup-tool
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Build the TypeScript code**

   ```bash
   pnpm run build
   ```

4. **Run local tests**
   ```bash
   pnpm run test:local
   ```

### Development Scripts

| Script                     | Description                                |
| -------------------------- | ------------------------------------------ |
| `pnpm run build`           | Compile TypeScript to JavaScript           |
| `pnpm run build:local`     | Build local platform binaries using Docker |
| `pnpm run test:local`      | Test pg_dump and pg_restore functionality  |
| `pnpm run dev`             | Watch mode for TypeScript compilation      |
| `pnpm run lint`            | Run code linting with oxlint               |
| `pnpm run format`          | Format code with Prettier                  |
| `pnpm run clean`           | Clean build artifacts                      |
| `pnpm run create-packages` | Generate platform-specific npm packages    |

### Local Development Workflow

1. **Make changes** to TypeScript source files in `src/`

2. **Build and test** your changes:

   ```bash
   pnpm run build
   pnpm run test:local
   ```

3. **Check code quality**:

   ```bash
   pnpm run lint
   pnpm run format
   ```

4. **Test with local binaries** (optional):
   ```bash
   pnpm run build:local  # Builds binaries for your platform
   pnpm run test:local   # Tests with locally built binaries
   ```

### Project Structure

```
├── src/                    # TypeScript source code
│   ├── bin.ts             # Binary path resolution
│   ├── command.ts         # Command line argument building
│   ├── dump.ts            # pg_dump wrapper
│   ├── restore.ts         # pg_restore wrapper
│   ├── system.ts          # Platform detection
│   └── index.ts           # Main exports
├── scripts/               # Build and utility scripts
│   ├── build-local.mjs    # Local binary building
│   ├── test-local.mjs     # Local testing
│   └── create-npm-packages.mjs  # Package generation
├── dockerfiles/           # Docker build configurations
├── .github/workflows/     # CI/CD workflows
└── npm/                   # Generated platform packages
```

### Testing

The project includes several levels of testing:

- **Unit Tests**: TypeScript compilation and type checking
- **Integration Tests**: `pnpm run test:local` - tests actual binary execution
- **CI Tests**: Automated testing across multiple platforms
- **Manual Tests**: Platform-specific testing via GitHub Actions

### Building Platform Binaries

To build binaries for your current platform:

```bash
pnpm run build:local
```

This will:

1. Detect your platform (macOS, Linux, etc.)
2. Use Docker to build PostgreSQL binaries
3. Package them in the `npm/` directory
4. Make them available for local testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the development workflow above
4. Test your changes with CI builds
5. Submit a pull request

### Code Quality Standards

- **TypeScript**: All code must pass type checking
- **Linting**: Code must pass oxlint checks
- **Formatting**: Code must be formatted with Prettier
- **Testing**: Changes must pass local and CI tests

### Adding New Platforms

See [PLATFORMS.md](PLATFORMS.md) for detailed instructions on adding support for additional platforms.

## 📄 License

This project follows PostgreSQL's licensing. The built binaries are distributed under the same terms as PostgreSQL itself.

## 🔗 Related Projects

- [PostgreSQL Official](https://www.postgresql.org/) - The main PostgreSQL project
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html) - Official pg_dump docs
- [pg_restore Documentation](https://www.postgresql.org/docs/current/app-pgrestore.html) - Official pg_restore docs
