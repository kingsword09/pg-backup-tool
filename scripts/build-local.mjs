import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function getBuildMatrix() {
  const releaseYmlPath = path.join(
    rootDir,
    '.github',
    'workflows',
    'release.yml',
  );
  const file = await fs.readFile(releaseYmlPath, 'utf8');
  const data = YAML.parse(file);
  return data.jobs.build_and_publish.strategy.matrix.include;
}

function getCurrentPlatformId() {
  const { platform, arch } = process;
  const platformMap = {
    'darwin-x64': 'macos-x64',
    'darwin-arm64': 'macos-arm64',
    'linux-x64': 'linux-x64-gnu',
    'linux-arm64': 'linux-aarch64-gnu',
    'win32-x64': 'windows-x64',
  };
  // A more robust solution might detect libc on linux
  return platformMap[`${platform}-${arch}`];
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    child.on('error', reject);
  });
}

async function main() {
  const platformId = getCurrentPlatformId();
  if (!platformId) {
    throw new Error(
      `Unsupported platform for local build: ${process.platform}-${process.arch}`,
    );
  }

  console.log(`Starting local build for platform: ${platformId}`);

  const matrix = await getBuildMatrix();
  const platformConfig = matrix.find((p) => p.id === platformId);

  if (!platformConfig) {
    throw new Error(
      `Could not find build configuration for platform: ${platformId}`,
    );
  }

  const buildScriptName = `build-local-${process.platform}.sh`;
  const buildScriptPath = path.join(rootDir, 'scripts', buildScriptName);

  // We need platform-specific build scripts because the steps in build.yml are different
  if (process.platform === 'darwin' || process.platform === 'linux') {
    await runCommand('bash', [buildScriptPath], {
      env: { ...process.env, ...platformConfig },
    });
  } else if (process.platform === 'win32') {
    // Similar logic for windows would go here
    console.log('Windows local build not yet implemented in this script.');
  }

  console.log('Build finished. Copying artifacts...');

  const artifactDirName = `pg-tools-v-local-${platformId}`;
  const installDir = path.join(
    rootDir,
    'node_modules',
    '.build',
    artifactDirName,
  );
  const targetDir = path.join(rootDir, 'npm', platformId);

  // Ensure target directory exists, but do not clean it, to preserve package.json
  await fs.mkdir(targetDir, { recursive: true });

  // Copy bin and lib folders
  await fs.cp(path.join(installDir, 'bin'), path.join(targetDir, 'bin'), {
    recursive: true,
  });
  await fs.cp(path.join(installDir, 'lib'), path.join(targetDir, 'lib'), {
    recursive: true,
  });

  console.log(`Binaries and libraries copied to ${targetDir}`);
  console.log('Local build complete. You can now run tests.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
