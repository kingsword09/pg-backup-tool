import { createWriteStream, promises as fs } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';
import { platforms } from './platforms';
import { getPlatform, getArch, getLibc } from './system';

const binDir = join(__dirname, '..', 'bin');

async function getPkgName(): Promise<string> {
  const platform = getPlatform();
  const arch = getArch();

  const platformInfo = platforms[platform]?.[arch];

  if (!platformInfo) {
    throw new Error(`Unsupported platform: ${platform}-${arch}`);
  }

  if (typeof platformInfo === 'string') {
    return platformInfo;
  }

  // It's a Linux platform with libc variants
  const libc = await getLibc();
  const pkgName = platformInfo[libc];

  if (!pkgName) {
    throw new Error(
      `Unsupported platform: ${platform}-${arch} with ${libc} libc`,
    );
  }

  return pkgName;
}

async function getLatestTag(): Promise<string> {
  const res = await fetch(
    'https://api.github.com/repos/kingsword09/pg-backup-tool/releases/latest',
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    },
  );
  const release = (await res.json()) as { tag_name: string };
  return release.tag_name;
}

async function downloadBinaries() {
  const pkgName = await getPkgName();
  await fs.mkdir(binDir, { recursive: true });
  const tag = await getLatestTag();
  const url = `https://github.com/kingsword09/pg-backup-tool/releases/download/${tag}/${pkgName}.tar.gz`;

  console.log(`Downloading binaries from ${url}`);

  const response = await fetch(url);
  if (!response.body) {
    throw new Error(`Failed to download from ${url}`);
  }
  const tarballPath = join(binDir, `${pkgName}.tar.gz`);
  await pipeline(
    Readable.fromWeb(response.body as any),
    createWriteStream(tarballPath),
  );

  console.log(`Extracting...`);
  await new Promise<void>((resolve, reject) => {
    const tar = spawn('tar', ['-xzf', tarballPath, '-C', binDir]);
    tar.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`tar exited with code ${code}`));
      }
    });
  });

  await fs.unlink(tarballPath);
  console.log('Download and extraction complete.');
}

export async function getBinPath(
  binName: 'pg_dump' | 'pg_restore',
): Promise<string> {
  const binPath = join(binDir, binName);
  try {
    await fs.access(binPath);
  } catch {
    await downloadBinaries();
  }
  try {
    await fs.access(binPath);
    return binPath;
  } catch {
    throw new Error(`Failed to find ${binName} binary after download.`);
  }
}
