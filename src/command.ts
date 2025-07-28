import { PgDumpOptions } from './dump.js';
import { PgRestoreOptions } from './restore.js';

type Options = PgDumpOptions | PgRestoreOptions;

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function buildArgs(options: Options): string[] {
  const args: string[] = [];

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null) {
      continue;
    }

    const flag = `--${toKebabCase(key)}`;

    if (typeof value === 'boolean') {
      if (value) {
        args.push(flag);
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        args.push(`${flag}=${item}`);
      }
    } else {
      args.push(`${flag}=${String(value)}`);
    }
  }

  return args;
}
