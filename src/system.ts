import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export type Platform = 'darwin' | 'linux' | 'win32' | 'freebsd';
export type Arch = 'x64' | 'arm64' | 'arm' | 'ppc64' | 's390x' | 'riscv64';
export type Libc = 'gnu' | 'musl';

export function getPlatform(): Platform {
  return process.platform as Platform;
}

export function getArch(): Arch {
  return process.arch as Arch;
}

async function isMusl(): Promise<boolean> {
  if (process.platform !== 'linux') {
    return false;
  }
  try {
    const { stdout } = await execAsync('ldd --version');
    return stdout.toLowerCase().includes('musl');
  } catch (e: any) {
    if (e.stderr && e.stderr.toLowerCase().includes('musl')) {
      return true;
    }
    // If ldd is not found or fails, we can try another method.
    // A common fallback is to check the node binary itself.
    try {
      const { stdout } = await execAsync(`ldd ${process.execPath}`);
      return stdout.toLowerCase().includes('musl');
    } catch {
      // If all fails, assume gnu
      return false;
    }
  }
}

export async function getLibc(): Promise<Libc> {
  return (await isMusl()) ? 'musl' : 'gnu';
}
