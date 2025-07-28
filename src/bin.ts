import { createRequire } from 'node:module';
import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import { getPlatform, getArch, getLibc } from './system';

const require = createRequire(import.meta.url);
const mainPackageJson = require('../package.json');

async function getOptionalDependencyName(): Promise<string> {
  const platform = getPlatform();
  const arch = getArch();
  let suffix = '';

  if (platform === 'linux') {
    const libc = await getLibc();
    suffix = `${platform}-${arch}-${libc}`;
    // Fallback for platforms not in the matrix
    if (suffix === 'linux-arm64-gnu') suffix = 'linux-aarch64-gnu';
    if (suffix === 'linux-arm-gnu') suffix = 'linux-arm-gnueabihf';
  } else {
    suffix = `${platform}-${arch}`;
  }

  const platformMap: Record<string, string> = {
    'darwin-x64': 'macos-x64',
    'darwin-arm64': 'macos-arm64',
    'linux-x64-gnu': 'linux-x64-gnu',
    'linux-x64-musl': 'linux-x64-musl',
    'linux-aarch64-gnu': 'linux-aarch64-gnu',
    'linux-aarch64-musl': 'linux-aarch64-musl',
    'linux-arm-gnueabihf': 'linux-arm-gnueabihf',
    'win32-x64': 'windows-x64',
    'freebsd-x64': 'freebsd-x64',
    'linux-powerpc64le-gnu': 'linux-powerpc64le-gnu',
    'linux-s390x-gnu': 'linux-s390x-gnu',
    'linux-riscv64-gnu': 'linux-riscv64-gnu',
  };

  const pkgSuffix = platformMap[suffix];

  if (!pkgSuffix) {
    throw new Error(`Unsupported platform: ${suffix}`);
  }

  return `@${mainPackageJson.author.name.toLowerCase()}/${mainPackageJson.name}-${pkgSuffix}`;
}

export async function getBinPath(
  binName: 'pg_dump' | 'pg_restore',
): Promise<string> {
  const pkgName = await getOptionalDependencyName();
  try {
    const pkgJsonPath = require.resolve(`${pkgName}/package.json`);
    const pkgDir = join(pkgJsonPath, '..');
    const binPath = join(pkgDir, 'bin', binName);
    await fs.access(binPath);
    return binPath;
  } catch {
    console.error(
      `Could not find optional dependency ${pkgName}. Please ensure it is installed.`,
    );
    console.error(
      'This might happen if you are on an unsupported platform or if the installation failed.',
    );
    throw new Error(
      `Failed to locate binary ${binName} from package ${pkgName}.`,
    );
  }
}
