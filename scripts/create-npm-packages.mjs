import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainPackageJson = JSON.parse(await fs.readFile(path.join(__dirname, '../package.json'), 'utf-8'));

const platforms = {
  'darwin-x64': 'macos-x64',
  'darwin-arm64': 'macos-arm64',
  'linux-x64-gnu': 'linux-x64-gnu',
  'linux-x64-musl': 'linux-x64-musl',
  'linux-arm64-gnu': 'linux-aarch64-gnu',
  'linux-arm64-musl': 'linux-aarch64-musl',
  'linux-arm-gnueabihf': 'linux-arm-gnueabihf',
  'win32-x64': 'windows-x64',
  'freebsd-x64': 'freebsd-x64',
  'linux-powerpc64le-gnu': 'linux-powerpc64le-gnu',
  'linux-s390x-gnu': 'linux-s390x-gnu',
  'linux-riscv64-gnu': 'linux-riscv64-gnu',
};

const npmDir = path.join(process.cwd(), 'npm');

async function createPackage(platform, name) {
  const [os, cpu, abi] = platform.split('-');
  const pkgDir = path.join(npmDir, name);
  await fs.mkdir(pkgDir, { recursive: true });

  const finalVersion = `${mainPackageJson.version}-pg-${mainPackageJson.pgVersion}`;

  const pkgJson = {
    name: `@${mainPackageJson.author.name.toLowerCase()}/${mainPackageJson.name}-${name}`,
    version: finalVersion,
    description: `The ${name} binary for ${mainPackageJson.name}.`,
    os: [os === 'win32' ? 'win32' : os],
    cpu: [cpu],
    files: ['bin', 'lib'],
    repository: mainPackageJson.repository,
    author: mainPackageJson.author,
    license: mainPackageJson.license,
  };

  if (abi) {
    pkgJson.libc = [abi];
  }

  await fs.writeFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(pkgJson, null, 2),
  );
}

async function main() {
  await fs.rm(npmDir, { recursive: true, force: true });
  await fs.mkdir(npmDir, { recursive: true });

  for (const [platform, name] of Object.entries(platforms)) {
    await createPackage(platform, name);
  }
}

main()
  .then(() => {
    console.log('\n✅ All platform packages created in the `npm/` directory.');
    console.log('➡️  Next, run `pnpm install` to link them into your workspace.');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
