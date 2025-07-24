# PG Backup Tools

This repository contains a GitHub Actions workflow to build the `pg_dump` and `pg_restore` binaries for various platforms and architectures.

## Usage

The binaries are built and released automatically via GitHub Actions.

- **CI Builds:** Pushes and pull requests to the `main` branch will trigger a test build for primary platforms.
- **Releases:** Pushing a version tag (e.g., `v16.3.2`) will trigger a full release, building all target platforms and publishing them to a new GitHub Release.
