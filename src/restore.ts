/**
 * Defines all available options for PostgreSQL `pg_restore` tool.
 * Each property corresponds to one or more command line flags.
 * Documentation refers to PostgreSQL 17.5.
 */
export interface PgRestoreOptions {
  // #region Input File
  /**
   * Specifies the location of the archive file to be restored.
   * If not specified, reads from standard input.
   */
  inputFile?: string;

  // #region Connection Options
  /**
   * Connect to this database and restore directly into it.
   */
  dbname?: string;

  /**
   * Specifies the host name of the machine on which the database server is running.
   */
  host?: string;

  /**
   * Specifies the TCP port on which the server is listening.
   */
  port?: number;

  /**
   * Username to connect as.
   */
  username?: string;

  /**
   * Force password prompt.
   */
  passwordPrompt?: boolean;

  /**
   * Never issue a password prompt.
   */
  noPassword?: boolean;

  /**
   * Specifies the role name to use for the restore.
   */
  role?: string;
  // #endregion

  // #region Restore Process Control
  /**
   * Clean (drop) database objects before recreating them.
   */
  clean?: boolean;

  /**
   * Create the database before restoring into it. If --clean is also specified,
   * drop and recreate the target database before proceeding.
   */
  create?: boolean;

  /**
   * Exit if an error occurs while sending SQL commands to the database.
   * @default Continue and report error count at the end.
   */
  exitOnError?: boolean;

  /**
   * Execute the restore as a single transaction. This ensures that either all commands succeed,
   * or no changes are applied. Implies --exit-on-error. Cannot be used with --jobs.
   */
  singleTransaction?: boolean;

  /**
   * Run the most time-consuming steps of the restore in parallel using up to number-of-jobs
   * concurrent sessions. This option can dramatically reduce the time to restore a large database
   * on a multiprocessor machine. Only supports custom and directory archive formats.
   */
  jobs?: number;

  /**
   * Only relevant when restoring data only. Commands pg_restore to temporarily disable triggers
   * on the target tables while loading the data. Requires superuser privileges.
   */
  disableTriggers?: boolean;

  /**
   * Use `DROP... IF EXISTS` commands in --clean mode.
   * This option is only valid when --clean is also specified.
   */
  ifExists?: boolean;

  /**
   * Output standard `SET SESSION AUTHORIZATION` commands instead of `ALTER OWNER`.
   */
  useSetSessionAuthorization?: boolean;
  // #endregion

  // #region Output Control
  /**
   * Specify output file for generated script, or for the listing when used with -l.
   * Use '-' for standard output.
   */
  file?: string;

  /**
   * List the contents of the archive. The output can be used as input to the -L option.
   */
  list?: boolean;

  /**
   * Only restore archive elements that are listed in list-file, and restore them in the
   * order they appear in the file.
   */
  useList?: string;
  // #endregion

  // #region Object Filtering
  /**
   * Restore only the data, not the schema (data definitions).
   */
  dataOnly?: boolean;

  /**
   * Restore only the schema (data definitions), not the data.
   */
  schemaOnly?: boolean;

  /**
   * Only restore the named section. Can be 'pre-data', 'data', or 'post-data'.
   */
  section?: Array<'pre-data' | 'data' | 'post-data'>;

  /**
   * Only restore objects in the named schema(s). Can be specified multiple times.
   */
  schema?: string;

  /**
   * Do not restore objects in the named schema(s). Can be specified multiple times.
   */
  excludeSchema?: string;

  /**
   * Restore only the named table's definition and/or data.
   * Note: This flag does not restore table dependencies (like indexes).
   */
  table?: string;

  /**
   * Restore only the named function.
   */
  function?: string;

  /**
   * Restore only the named index.
   */
  index?: string;

  /**
   * Restore only the named trigger.
   */
  trigger?: string;

  /**
   * Require each schema (-n) and table (-t) qualifier to match at least one schema/table in the backup file.
   */
  strictNames?: boolean;

  /**
   * Read filtering patterns from a file.
   */
  filter?: string;
  // #endregion

  // #region Object Exclusion
  /**
   * Do not output commands to set object ownership.
   */
  noOwner?: boolean;

  /**
   * Prevent restoration of access privileges (GRANT/REVOKE commands).
   */
  noPrivileges?: boolean; // --no-acl

  /**
   * Do not output commands to restore comments.
   */
  noComments?: boolean;

  /**
   * Do not output commands to restore publications.
   */
  noPublications?: boolean;

  /**
   * Do not output commands to restore security labels.
   */
  noSecurityLabels?: boolean;

  /**
   * Do not output commands to restore subscriptions.
   */
  noSubscriptions?: boolean;

  /**
   * Do not output commands to select table access methods.
   */
  noTableAccessMethod?: boolean;

  /**
   * Do not output commands to select tablespaces.
   */
  noTablespaces?: boolean;
  // #endregion

  // #region Miscellaneous
  /**
   * Specify verbose mode.
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
   * Specify superuser name to use when disabling triggers.
   */
  superuser?: string;

  /**
   * Enable row security.
   */
  enableRowSecurity?: boolean;
  // #endregion
}

import { spawn } from 'node:child_process';
import { getBinPath } from './bin';
import { buildArgs } from './command';

export async function restore(
  options: PgRestoreOptions,
  pgRestorePath?: string,
) {
  const binPath = pgRestorePath || (await getBinPath('pg_restore'));
  const args = buildArgs(options);

  return new Promise<void>((resolve, reject) => {
    const child = spawn(binPath, args, { stdio: 'inherit' });

    child.on('error', reject);
    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pg_restore exited with code ${code}`));
      }
    });
  });
}
