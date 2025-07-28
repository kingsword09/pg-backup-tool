/**
 * Defines all available options for PostgreSQL `pg_dump` tool.
 * Each property corresponds to one or more command line flags.
 * Documentation refers to PostgreSQL 17.5.
 */
export interface PgDumpOptions {
  // #region Connection Options
  /**
   * Specifies the name of the database to be dumped. If not specified, uses the PGDATABASE environment variable.
   * If that is not set, the user name specified for the connection is used.
   * @see https://www.postgresql.org/docs/current/app-pgdump.html
   */
  dbname?: string;

  /**
   * Specifies the host name of the machine on which the database server is running.
   * @default Environment variable PGHOST or local socket.
   */
  host?: string;

  /**
   * Specifies the TCP port or local Unix domain socket file extension on which the server is listening for connections.
   * @default Environment variable PGPORT or compilation default (usually 5432).
   */
  port?: number;

  /**
   * User name to connect as.
   * @default Environment variable PGUSER or current operating system user.
   */
  username?: string;

  /**
   * Force pg_dump to prompt for a password before connecting to a database.
   * In wrapper applications, this is typically handled through other means like environment variables or .pgpass file.
   */
  passwordPrompt?: boolean;

  /**
   * Never issue a password prompt. The connection will fail if the server requires password authentication and a password is not available.
   * This is preferred for automated scripts.
   */
  noPassword?: boolean;

  /**
   * Specifies the role name to be used for the dump.
   */
  role?: string;
  // #endregion

  // #region Output Control Options
  /**
   * Send output to the specified file. If omitted, standard output is used.
   */
  file?: string;

  /**
   * Selects the format of the output.
   * 'p' (plain): plain-text SQL script
   * 'c' (custom): custom-format archive suitable for input into pg_restore
   * 'd' (directory): directory-format archive, supports parallel dumps
   * 't' (tar): tar-format archive
   * @default 'p'
   */
  format?: 'p' | 'c' | 'd' | 't';

  /**
   * Run the dump in parallel by dumping multiple tables simultaneously.
   * This option is only supported for the directory format.
   * Requires njobs + 1 connections to the server.
   */
  jobs?: number;

  /**
   * Specifies the compression level. Zero means no compression, 9 means maximum compression.
   * Only effective for custom and directory formats.
   */
  compress?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  /**
   * Create the dump with the specified character set encoding.
   * @default database encoding
   */
  encoding?: string;

  /**
   * Do not wait for all files to be safely written to disk.
   * This option can improve performance but might lead to a corrupt backup in case of an operating system crash.
   */
  noSync?: boolean;
  // #endregion

  // #region Dump Content Control
  /**
   * Dump only the data, not the schema (data definitions).
   */
  dataOnly?: boolean;

  /**
   * Dump only the schema (data definitions), no data.
   */
  schemaOnly?: boolean;

  /**
   * Output commands to clean (drop) database objects prior to recreating them.
   * This option is only meaningful for the plain format. For archive formats, specify the option when running pg_restore.
   */
  clean?: boolean;

  /**
   * Begin the output with commands to create the database itself and connect to it.
   * This option is only meaningful for plain format. For archive formats, specify the option when running pg_restore.
   */
  create?: boolean;

  /**
   * Do not output commands to set ownership of objects.
   */
  noOwner?: boolean;

  /**
   * Prevent dumping of access privileges (GRANT/REVOKE commands).
   */
  noPrivileges?: boolean; // --no-acl

  /**
   * Dump only the named section. The section can be 'pre-data', 'data', or 'post-data'.
   * Multiple sections can be specified by providing the option multiple times.
   */
  section?: Array<'pre-data' | 'data' | 'post-data'>;

  /**
   * Do not dump table access methods.
   */
  noTableAccessMethod?: boolean;

  /**
   * Do not dump tablespace assignments.
   */
  noTablespaces?: boolean;

  /**
   * Do not dump publication information.
   */
  noPublications?: boolean;

  /**
   * Do not dump security labels.
   */
  noSecurityLabels?: boolean;

  /**
   * Do not dump subscription information.
   */
  noSubscriptions?: boolean;

  /**
   * Do not dump comments.
   */
  noComments?: boolean;

  /**
   * Include column names in INSERT commands.
   */
  columnInserts?: boolean;

  /**
   * Use COPY instead of INSERT for dumping data, even when columnInserts is used.
   */
  copy?: boolean;

  /**
   * Disable triggers before dumping data. Only valid for data-only dumps.
   */
  disableTriggers?: boolean;

  /**
   * Specify superuser to use when disabling triggers. Only relevant when disableTriggers is true.
   */
  superuser?: string;

  /**
   * Enable row security. By default, pg_dump sets row_security to off.
   */
  enableRowSecurity?: boolean;

  /**
   * Dump object identifiers (OIDs). Not recommended unless specifically required by application.
   */
  oids?: boolean;

  /**
   * Output standard SET SESSION AUTHORIZATION commands instead of ALTER OWNER commands.
   */
  useSetSessionAuthorization?: boolean;
  // #endregion

  // #region Object Filtering Options
  /**
   * Dump only schemas matching pattern. Can be specified multiple times.
   */
  schema?: string;

  /**
   * Do not dump any schemas matching pattern. Can be specified multiple times.
   */
  excludeSchema?: string;

  /**
   * Dump only tables matching pattern. Can be specified multiple times.
   */
  table?: string;

  /**
   * Do not dump any tables matching pattern. Can be specified multiple times.
   */
  excludeTable?: string;

  /**
   * Dump only the named table and its child tables (inheritance or partitioning).
   */
  tableAndChildren?: string;

  /**
   * Do not dump the named table and its child tables.
   */
  excludeTableAndChildren?: string;

  /**
   * Do not dump data for any tables matching pattern.
   */
  excludeTableData?: string;

  /**
   * Dump only the named extension.
   */
  extension?: string;

  /**
   * Do not dump any extensions matching pattern.
   */
  excludeExtension?: string;

  /**
   * Dump foreign data from servers matching pattern.
   */
  includeForeignData?: string;

  /**
   * Read filtering patterns from file.
   */
  filter?: string;
  // #endregion

  // #region Miscellaneous
  /**
   * Specifies verbose mode.
   */
  verbose?: boolean;

  /**
   * Print version and exit.
   */
  version?: boolean;

  /**
   * Show help and exit.
   */
  help?: boolean;

  /**
   * Do not use synchronized snapshots in parallel dumps.
   * Only for parallel dumps against pre-9.2 servers.
   */
  noSynchronizedSnapshots?: boolean;
  // #endregion
}

import { spawn } from 'node:child_process';
import { getBinPath } from './bin';
import { buildArgs } from './command';

export async function dump(options: PgDumpOptions, pgDumpPath?: string) {
  const binPath = pgDumpPath || (await getBinPath('pg_dump'));
  const args = buildArgs(options);

  return new Promise<void>((resolve, reject) => {
    const child = spawn(binPath, args, { stdio: 'inherit' });

    child.on('error', reject);
    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pg_dump exited with code ${code}`));
      }
    });
  });
}
