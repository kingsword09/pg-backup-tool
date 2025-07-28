import { Platform, Arch, Libc } from './system.js';

type PlatformMap = {
  [P in Platform]?: {
    [A in Arch]?: string | { [L in Libc]?: string };
  };
};

export const platforms: PlatformMap = {
  darwin: {
    x64: 'macos-x64',
    arm64: 'macos-arm64',
  },
  win32: {
    x64: 'windows-x64',
  },
  freebsd: {
    x64: 'freebsd-x64',
  },
  linux: {
    x64: {
      gnu: 'linux-x64-gnu',
      musl: 'linux-x64-musl',
    },
    arm64: {
      gnu: 'linux-aarch64-gnu',
      musl: 'linux-aarch64-musl',
    },
    arm: {
      gnu: 'linux-arm-gnueabihf',
      musl: 'linux-arm-musleabihf',
    },
    ppc64: {
      gnu: 'linux-powerpc64le-gnu',
    },
    s390x: {
      gnu: 'linux-s390x-gnu',
    },
    riscv64: {
      gnu: 'linux-riscv64-gnu',
    },
  },
};
