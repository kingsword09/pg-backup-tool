# 为 PostgreSQL 的 pg_dump 和 pg_restore 工具封装 TypeScript 的综合技术规范

## 第一部分：程序化数据库操作导论

### 1.1. 逻辑备份的战略角色

在现代数据库管理和开发运维（DevOps）实践中，备份与恢复策略是保障数据安全和业务连续性的基石。PostgreSQL 提供了两种主要的备份范式：物理备份和逻辑备份。物理备份通过直接复制构成数据库集群的数据文件来实现，速度快，但通常与特定的 PostgreSQL 主版本和操作系统架构紧密耦合。

相比之下，`pg_dump` 工具执行的是逻辑备份。它并不直接操作文件系统，而是作为一个“聪明的”客户端应用程序连接到数据库，将数据库的结构（模式）和内容（数据）提取为一系列 SQL 命令或一个结构化的归档文件 2。这种方法的核心优势在于其卓越的灵活性和可移植性：

- 版本独立性：由旧版本 pg_dump 创建的转储文件通常可以恢复到新版本的 PostgreSQL 服务器上，这使其成为数据库升级的关键工具。
- 跨平台与架构：逻辑备份是平台无关的，允许数据从一个操作系统（如 Linux）无缝迁移到另一个（如 Windows），或在不同硬件架构（如 x86 到 ARM）之间迁移。
- 精细化控制：与物理备份的全有或全无不同，逻辑备份（特别是与 pg_restore 结合使用时）允许对恢复过程进行精细控制，例如只恢复特定的表或模式。

因此，逻辑备份的应用场景远不止于灾难恢复。它广泛用于在不同 PostgreSQL 主版本之间进行迁移、将本地数据库迁移至云端、为开发和测试环境填充数据，以及进行选择性数据归档。

### 1.2. 封装 TypeScript 的理论依据

尽管可以直接在命令行或 Shell 脚本中调用 `pg_dump` 和 `pg_restore`，但将其封装在一个类型安全的 TypeScript 包装器中，能将简单的自动化提升为健壮、可维护的系统级组件。这种做法在 Node.js 生态中非常普遍，其价值主张体现在以下几个方面：

- 类型安全：这是最核心的优势。通过为所有命令行选项定义一个严格的 TypeScript 接口，可以将大量潜在的运行时错误（如拼写错误的标志、传递了错误类型的值）转移到编译时进行检查。这极大地提高了代码的可靠性。
- 开发者体验（DX）：一个设计良好的包装器能够提供代码自动补全和内联文档。开发者在编写代码时，可以清晰地看到每个可用选项及其用途，无需频繁查阅外部文档，从而显著提升开发效率。
- 抽象与可重用性：包装器将命令行参数的动态构建、子进程的创建与管理、标准输入/输出流的处理等底层复杂性完全封装起来。它向上层应用提供一个简洁、高级的 API，使得备份和恢复操作可以像调用任何其他函数一样简单，便于在应用的不同部分复用。
- 无缝集成：基于 Node.js 的包装器可以轻松地与其他 Node.js 库集成，例如使用 node-cron 实现定时备份任务 9，或将备份流直接推送到云存储服务（如 AWS S3）的 SDK 6，构建全自动化的数据管理工作流。

### 1.3. 本报告的核心原则

本报告旨在成为一份详尽无遗的技术蓝图，其编写遵循两大核心原则：

1. 权威性与完整性：报告内容以 PostgreSQL 17.5 的官方文档为最终依据，力求覆盖 pg_dump 和 pg_restore 的每一个可用选项，不留遗漏。
2. 实用性与可操作性：本报告不仅解释“是什么”，更注重阐述“如何做”。目标是提供一套理论上严谨、实践上可行的规范，无缝地将官方文档的知识转化为高质量、可立即投入生产的 TypeScript 代码。

## 第二部分：pg_dump API 规范

### 2.1. 功能概述与架构决策

`pg_dump` 的核心功能是创建一个数据库在某个特定时间点的“一致性快照”。即使在备份进行时有其他用户正在对数据库进行读写操作，pg_dump 也能保证备份数据的一致性。这得益于 PostgreSQL 强大的多版本并发控制（MVCC）机制 12。在内部，

`pg_dump` 通常在 SERIALIZABLE 事务隔离级别下工作。对于 PostgreSQL 9.2 及以上版本，当使用并行备份（-j）时，它会利用“同步快照”功能，确保所有工作进程看到完全相同的数据集，从而避免不一致的备份。

在设计备份策略时，首要且最关键的架构决策是选择输出格式，因为它直接决定了恢复过程的能力和灵活性。

表 1: pg_dump 输出格式对比

| 格式 (Format) | -F 标志 | 默认压缩 | 恢复工具 | 支持并行转储 (-j) | 支持并行恢复 | 支持选择性恢复 |
|---------------|---------|----------|----------|-------------------|----------------|------------------|
| plain         | p       | 否       | psql     | 否                | 否             | 否               |
| custom        | c       | 是       | pg_restore | 否              | 是             | 是               |
| directory     | d       | 是       | pg_restore | 是              | 是             | 是               |
| tar           | t       | 否       | pg_restore | 否              | 否             | 是               |

基于上表的分析，对于需要程序化封装的场景，强烈推荐使用 `custom` (`-Fc`) 或 `directory` (`-Fd`) 格式作为默认选项。这两种格式提供了最大的灵活性，支持并行恢复和选择性恢复，并且默认进行压缩，非常适合自动化工作流和大型数据库的管理。

`directory` 格式是唯一支持并行转储的格式，对于备份超大型数据库而言，这是提升性能的关键特性。

### 2.2. PgDumpOptions TypeScript 接口

以下是为 `pg_dump` 工具定义的一个完整且带有 JSDoc 注释的 TypeScript 接口。它将所有命令行选项映射为类型安全的属性。

```ts
/**
 * 定义了 PostgreSQL `pg_dump` 工具的所有可用选项。
 * 每个属性都对应一个或多个命令行标志。
 * 文档参考 PostgreSQL 17.5。
 */
export interface PgDumpOptions {
  // #region Connection Options (连接选项)
  /**
   * 指定要转储的数据库名称。如果未指定，将使用 PGDATABASE 环境变量。
   * 如果该环境变量也未设置，则使用连接的用户名。
   * @see https://www.postgresql.org/docs/current/app-pgdump.html
   */
  dbname?: string;

  /**
   * 指定运行数据库服务器的主机名。
   * @default 环境变量 PGHOST 或本地套接字。
   */
  host?: string;

  /**
   * 指定服务器监听的 TCP 端口或本地 Unix 域套接字文件扩展名。
   * @default 环境变量 PGPORT 或编译时默认值 (通常为 5432)。
   */
  port?: number;

  /**
   * 用于连接的用户名。
   * @default 环境变量 PGUSER 或当前操作系统用户。
   */
  username?: string;

  /**
   * 强制 `pg_dump` 在连接到数据库之前提示输入密码。
   * 在包装器中，这通常通过其他方式处理，例如环境变量或.pgpass 文件。
   */
  passwordPrompt?: boolean;

  /**
   * 从不发出密码提示。如果服务器需要密码认证但密码不可用，连接将失败。
   * 对于自动化脚本是首选。
   */
  noPassword?: boolean;

  /**
   * 指定用于连接的角色名称。
   */
  role?: string;
  // #endregion

  // #region Output Control Options (输出控制选项)
  /**
   * 将输出发送到指定文件。如果未指定，则发送到标准输出。
   */
  file?: string;

  /**
   * 指定输出格式。
   * 'p' (plain): 纯文本 SQL 脚本。
   * 'c' (custom): 自定义格式的归档，适用于 pg_restore。
   * 'd' (directory): 目录格式的归档，支持并行转储。
   * 't' (tar): tar 格式的归档。
   * @default 'p'
   */
  format?: "p" | "c" | "d" | "t";

  /**
   * 通过同时转储多个表来并行运行转储。
   * 此选项仅支持 'directory' 格式。
   * 需要与服务器建立 njobs + 1 个连接。
   */
  jobs?: number;

  /**
   * 指定压缩级别。0 表示不压缩，9 表示最大压缩。
   * 仅对 custom 和 directory 格式有效。
   */
  compress?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  /**
   * 以指定的字符集编码创建转储。
   * @default 数据库编码。
   */
  encoding?: string;

  /**
   * 不等待所有文件安全写入磁盘。
   * 此选项可以提高性能，但在发生操作系统崩溃时可能导致备份损坏。
   */
  noSync?: boolean;
  // #endregion

  // #region Dump Content Control (转储内容控制选项)
  /**
   * 仅转储数据，不转储模式（数据定义）。
   */
  dataOnly?: boolean;

  /**
   * 仅转储模式（数据定义），不转储数据。
   */
  schemaOnly?: boolean;

  /**
   * 在重新创建数据库对象之前，先输出清除（DROP）这些对象的命令。
   * 此选项仅对 plain 格式有意义。对于归档格式，此选项在 pg_restore 时指定。
   */
  clean?: boolean;

  /**
   * 以一个创建数据库本身的命令开始输出，并连接到该数据库。
   * 此选项仅对 plain 格式有意义。对于归档格式，此选项在 pg_restore 时指定。
   */
  create?: boolean;

  /**
   * 不输出设置对象所有权的命令。
   */
  noOwner?: boolean;

  /**
   * 防止转储访问权限（GRANT/REVOKE 命令）。
   */
  noPrivileges?: boolean; // --no-acl

  /**
   * 转储指定的部分。可以是 'pre-data', 'data', 或 'post-data'。
   * 可以多次指定以选择多个部分。
   */
  section?: Array<"pre-data" | "data" | "post-data">;

  /**
   * 防止转储表访问方法。
   */
  noTableAccessMethod?: boolean;

  /**
   * 防止转储表空间分配。
   */
  noTablespaces?: boolean;

  /**
   * 防止转储发布信息。
   */
  noPublications?: boolean;

  /**
   * 防止转储安全标签。
   */
  noSecurityLabels?: boolean;

  /**
   * 防止转储订阅信息。
   */
  noSubscriptions?: boolean;

  /**
   * 防止转储注释。
   */
  noComments?: boolean;

  /**
   * 在 `INSERT` 命令中包含列名。
   */
  columnInserts?: boolean;

  /**
   * 使用 `COPY` 而不是 `INSERT` 来转储数据，即使使用了 `columnInserts`。
   */
  copy?: boolean;

  /**
   * 在转储数据之前禁用触发器。仅对 `dataOnly` 转储有效。
   */
  disableTriggers?: boolean;

  /**
   * 在禁用触发器时指定超级用户。仅当 `disableTriggers` 为 true 时相关。
   */
  superuser?: string;

  /**
   * 启用行安全性。默认情况下，pg_dump 会设置 row_security=off。
   */
  enableRowSecurity?: boolean;

  /**
   * 转储对象标识符（OID）。除非应用明确需要，否则不推荐使用。
   */
  oids?: boolean;

  /**
   * 输出标准的 `SET SESSION AUTHORIZATION` 命令而不是 `ALTER OWNER`。
   */
  useSetSessionAuthorization?: boolean;
  // #endregion

  // #region Object Filtering Options (对象过滤选项)
  /**
   * 仅转储匹配模式的模式。可以多次指定。
   */
  schema?: string;

  /**
   * 不转储任何匹配模式的模式。可以多次指定。
   */
  excludeSchema?: string;

  /**
   * 仅转储匹配的表。可以多次指定。
   */
  table?: string;

  /**
   * 不转储任何匹配的表。可以多次指定。
   */
  excludeTable?: string;

  /**
   * 仅转储匹配的表及其子表（继承或分区）。
   */
  tableAndChildren?: string;

  /**
   * 不转储匹配的表及其子表。
   */
  excludeTableAndChildren?: string;

  /**
   * 不转储匹配表的数据。
   */
  excludeTableData?: string;

  /**
   * 仅转储匹配的扩展。
   */
  extension?: string;

  /**
   * 不转储任何匹配的扩展。
   */
  excludeExtension?: string;

  /**
   * 转储任何匹配的外部服务器上的外部数据。
   */
  includeForeignData?: string;

  /**
   * 从文件中读取过滤模式。
   */
  filter?: string;
  // #endregion

  // #region Miscellaneous (杂项)
  /**
   * 指定详细模式。
   */
  verbose?: boolean;

  /**
   * 打印版本并退出。
   */
  version?: boolean;

  /**
   * 显示帮助并退出。
   */
  help?: boolean;

  /**
   * 在运行并行转储时不使用同步快照。
   * 仅用于对 9.2 之前的服务器进行并行转储。
   */
  noSynchronizedSnapshots?: boolean;
  // #endregion
}
```

### 2.3. 关键选项的深入分析

#### 2.3.1. 配置的层次结构

PostgreSQL 客户端工具（包括 `pg_dump`）在确定连接参数时遵循一个明确的层次结构。首先，它们会检查命令行中明确提供的标志，如 `-h`、`-p`、`-U`。如果在命令行中未找到这些标志，工具会接着查找相应的环境变量，如

`PGHOST`、`PGPORT`、`PGUSER`、`PGDATABASE` 等。最后，如果两者都未提供，则会使用编译时的默认值（例如，本地套接字连接，端口 5432）。

这种设计对 TypeScript 包装器的实现具有重要意义。一个健壮的包装器不应强制用户在其选项对象中提供所有连接参数。相反，它应该只将选项对象中明确定义的参数转换为命令行标志。对于未提供的参数，包装器应允许 `pg_dump` 子进程自然地从其运行环境中继承。这种方法提供了最大的灵活性，允许用户在全局（例如，在 Docker 容器或 CI/CD 流水线的环境变量中）配置通用凭据，同时又能为特定调用覆盖这些设置。此外，还应考虑到 `.pgpass` 文件在自动化场景中用于无密码认证的作用。

#### 2.3.2. --clean 和 --create 的幂等性问题

`--clean` (`-c`) 和 `--create` (`-C`) 选项分别用于在恢复前添加 `DROP` 语句和 `CREATE DATABASE` 语句。然而，这些选项仅对 `plain` 文本格式的转储有直接意义，因为对于归档格式，这些操作是由 `pg_restore` 在恢复时控制的。

当为 `plain` 格式使用这些选项时，它们直接影响恢复操作的幂等性。在一个已经存在的数据库上执行带有 `--create` 的脚本会失败。在一个全新的、空无一物的数据库上执行带有 `--clean` 的脚本会因为找不到要删除的对象而报告错误。因此，包装器的文档必须极其清晰地说明这一点。在设计 API 时，可以考虑提供更具表达力的方法，例如 `dumpForOverwrite(options)` 和 `dumpForInitialCreation(options)`，这些方法在内部设置正确的标志组合。这可以引导开发者更深入地思考其操作的目标状态，而不是仅仅传递模糊的布尔标志。

### 2.4. 实现蓝图

以下是一个 `executePgDump` 函数的骨架，展示了如何将 `PgDumpOptions` 对象转换为命令行参数并执行子进程。

```ts
TypeScriptimport { spawn } from 'child_process';

// 假设 PgDumpOptions 接口已定义

async function executePgDump(options: PgDumpOptions): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  const args: string =;

  // 动态构建参数列表
  if (options.host) args.push('--host', options.host);
  if (options.port) args.push('--port', String(options.port));
  if (options.username) args.push('--username', options.username);
  if (options.format) args.push('--format', options.format);
  if (options.file) args.push('--file', options.file);
  if (options.jobs) args.push('--jobs', String(options.jobs));
  if (options.dataOnly) args.push('--data-only');
  //... 为所有其他选项添加类似的逻辑...
  options.schema?.forEach(s => args.push(`--schema=${s}`));

  if (options.dbname) {
    args.push(options.dbname);
  }

  return new Promise((resolve, reject) => {
    const pgDumpProcess = spawn('pg_dump', args, {
      env: {...process.env, /* 可在此处设置 PGPASSWORD 等 */ },
    });

    let stdout = '';
    let stderr = '';

    pgDumpProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pgDumpProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pgDumpProcess.on('close', (code) => {
      if (code!== 0) {
        // 在生产代码中，应抛出一个包含 stdout, stderr 和 code 的自定义错误
        const error = new Error(`pg_dump process exited with code ${code}.\nStderr: ${stderr}`);
        reject(error);
      } else {
        resolve({ stdout, stderr, exitCode: code });
      }
    });

    pgDumpProcess.on('error', (err) => {
      reject(err);
    });
  });
}
```

## 第三部分：pg_restore API 规范

### 3.1. 功能概述

`pg_restore` 是与 `pg_dump` 的归档格式（custom, directory, tar）配套使用的恢复工具。它有两种核心操作模式：

1. 直接到数据库恢复：当使用 `-d` 或 `--dbname` 指定目标数据库时，`pg_restore` 会连接到该数据库并直接执行恢复操作。
2. 脚本生成：如果未指定 `-d`，`pg_restore` 会生成一个包含重建数据库所需 SQL 命令的脚本，并将其输出到标准输出或指定文件。这个输出与 `pg_dump` 的 `plain` 格式类似。

`pg_restore` 是实现高级恢复策略（如并行恢复和选择性对象恢复）的唯一途径，这使其在自动化工作流中至关重要。

### 3.2. `PgRestoreOptions` TypeScript 接口

以下是为 `pg_restore` 工具定义的完整 TypeScript 接口。

```ts
/**
 * 定义了 PostgreSQL `pg_restore` 工具的所有可用选项。
 * 每个属性都对应一个或多个命令行标志。
 * 文档参考 PostgreSQL 17.5。
 */
export interface PgRestoreOptions {
  // #region Input File (输入文件)
  /**
   * 指定要恢复的归档文件的位置。
   * 如果未指定，则从标准输入读取。
   */
  inputFile?: string;

  // #region Connection Options (连接选项)
  /**
   * 连接到此数据库并直接恢复到其中。
   */
  dbname?: string;

  /**
   * 指定运行数据库服务器的主机名。
   */
  host?: string;

  /**
   * 指定服务器监听的 TCP 端口。
   */
  port?: number;

  /**
   * 用于连接的用户名。
   */
  username?: string;

  /**
   * 强制提示输入密码。
   */
  passwordPrompt?: boolean;

  /**
   * 从不发出密码提示。
   */
  noPassword?: boolean;

  /**
   * 指定用于连接的角色名称。
   */
  role?: string;
  // #endregion

  // #region Restore Process Control (恢复过程控制选项)
  /**
   * 在恢复数据库对象之前，先清除（DROP）它们。
   */
  clean?: boolean;

  /**
   * 在恢复之前创建数据库。如果指定了 --clean，则先删除再重新创建目标数据库。
   */
  create?: boolean;

  /**
   * 如果在向数据库发送 SQL 命令时遇到错误，则退出。
   * @default 继续执行并最后报告错误计数。
   */
  exitOnError?: boolean;

  /**
   * 将恢复作为单个事务执行。这确保了要么所有命令都成功，要么不应用任何更改。
   * 此选项隐含了 --exit-on-error。不能与 --jobs 同时使用。
   */
  singleTransaction?: boolean;

  /**
   * 使用多达 number-of-jobs 个并发会话运行恢复中耗时最长的步骤。
   * 此选项可以显著减少在多处理器机器上恢复大型数据库的时间。
   * 仅支持 custom 和 directory 归档格式。
   */
  jobs?: number;

  /**
   * 仅在恢复仅数据时相关。指示 pg_restore 在恢复数据时临时禁用目标表上的触发器。
   * 需要超级用户权限。
   */
  disableTriggers?: boolean;

  /**
   * 在 --clean 模式下使用 `DROP... IF EXISTS` 命令。
   * 此选项仅在指定了 --clean 时有效。
   */
  ifExists?: boolean;

  /**
   * 输出标准的 `SET SESSION AUTHORIZATION` 命令而不是 `ALTER OWNER`。
   */
  useSetSessionAuthorization?: boolean;
  // #endregion

  // #region Output Control (输出控制选项)
  /**
   * 为生成的脚本指定输出文件，或与 -l 一起使用时为列表指定输出文件。
   * 使用 '-' 表示标准输出。
   */
  file?: string;

  /**
   * 列出归档文件的内容。其输出可用作 -L 选项的输入。
   */
  list?: boolean;

  /**
   * 仅恢复在 list-file 中列出的归档元素，并按它们在文件中出现的顺序进行恢复。
   */
  useList?: string;
  // #endregion

  // #region Object Filtering (对象过滤选项)
  /**
   * 仅恢复数据，不恢复模式（数据定义）。
   */
  dataOnly?: boolean;

  /**
   * 仅恢复模式（数据定义），不恢复数据。
   */
  schemaOnly?: boolean;

  /**
   * 仅恢复指定的部分。可以是 'pre-data', 'data', 或 'post-data'。
   */
  section?: Array<"pre-data" | "data" | "post-data">;

  /**
   * 仅恢复指定模式中的对象。可以多次指定。
   */
  schema?: string;

  /**
   * 不恢复指定模式中的对象。可以多次指定。
   */
  excludeSchema?: string;

  /**
   * 仅恢复指定表的定义和/或数据。
   * 注意：此标志不恢复表的依赖项（如索引）。
   */
  table?: string;

  /**
   * 仅恢复指定的函数。
   */
  function?: string;

  /**
   * 仅恢复指定的索引。
   */
  index?: string;

  /**
   * 仅恢复指定的触发器。
   */
  trigger?: string;

  /**
   * 要求每个模式 (-n) 和表 (-t) 限定符至少匹配备份文件中的一个模式/表。
   */
  strictNames?: boolean;

  /**
   * 从文件中读取过滤模式。
   */
  filter?: string;
  // #endregion

  // #region Object Exclusion (对象排除选项)
  /**
   * 不输出设置对象所有权的命令。
   */
  noOwner?: boolean;

  /**
   * 防止恢复访问权限（GRANT/REVOKE 命令）。
   */
  noPrivileges?: boolean; // --no-acl

  /**
   * 不输出恢复注释的命令。
   */
  noComments?: boolean;

  /**
   * 不输出恢复发布的命令。
   */
  noPublications?: boolean;

  /**
   * 不输出恢复安全标签的命令。
   */
  noSecurityLabels?: boolean;

  /**
   * 不输出恢复订阅的命令。
   */
  noSubscriptions?: boolean;

  /**
   * 不输出选择表访问方法的命令。
   */
  noTableAccessMethod?: boolean;

  /**
   * 不输出选择表空间的命令。
   */
  noTablespaces?: boolean;
  // #endregion

  // #region Miscellaneous (杂项)
  /**
   * 指定详细模式。
   */
  verbose?: boolean;

  /**
   * 打印版本并退出。
   */
  version?: boolean;

  /**
   * 显示帮助并退出。
   */
  help?: boolean;

  /**
   * 在禁用触发器时指定超级用户。
   */
  superuser?: string;

  /**
   * 启用行安全性。
   */
  enableRowSecurity?: boolean;
  // #endregion
}
```

### 3.3. 关键选项的深入分析

#### 3.3.1. 选择性恢复的“陷阱”

`pg_restore` 提供了强大的选择性恢复功能，例如使用 `-t` 或 `--table` 只恢复特定的表。然而，官方文档中有一个至关重要的警告：当指定 `-t` 时，`pg_restore` “不尝试恢复所选表可能依赖的任何其他数据库对象”。这是一个常见的陷阱。开发者可能会天真地创建一个 `restoreTable(tableName)` 函数。如果这个表依赖于一个目标数据库中不存在的自定义类型，或者有一个指向不存在的表的外键，恢复过程将会失败。这意味着，一个简单地包装了 `-t` 选项的函数是危险且具有误导性的。

因此，一个专业的 TypeScript 包装器必须明确这一点。选择性恢复的主要应用场景是刷新现有数据，而不是在一个空数据库中逐块重建模式。其文档必须强调这一点，或者 API 设计本身就应该反映这一点，例如，提供一个名为 `refreshTableData(options)` 的方法，而不是一个通用的 `restore(options)` 方法，以引导用户正确使用该功能。

#### 3.3.2. 事务性与性能的权衡

`pg_restore` 提供了一对相互矛盾但又都非常有用的选项：`--single-transaction` (`-1`) 和 `--jobs` (`-j`)。前者将整个恢复过程包裹在一个事务中，保证了操作的原子性——要么全部成功，要么全部回滚，这对于关键生产环境的恢复至关重要。后者则通过并行处理来大幅提升恢复速度，对于大型数据库的数据加载非常有效。

关键在于，这两个选项是互斥的。开发者必须在原子性（安全）和性能（速度）之间做出选择。
TypeScript 包装器应在类型层面强制执行此约束。`PgRestoreOptions` 接口可以使用 TypeScript 的判别联合类型（discriminated union）或在实现中添加验证逻辑，以防止用户同时设置 `singleTransaction: true` 和 `jobs > 1`。文档必须清晰地解释这一权衡：对于需要保证数据完整性的生产恢复，应选择原子性；对于在受控环境中（如搭建测试服务器）进行大规模数据加载，可以选择性能，因为失败后可以简单地从头重试。此外，`--transaction-size` 选项提供了一个中间方案，它将恢复过程分解为一系列较小的事务，兼顾了部分性能和事务安全性，应作为此权衡的一个潜在解决方案进行介绍。

### 3.4. 实现蓝图

`executePgRestore` 的实现与 `executePgDump` 类似，但需要特别注意输入文件的处理方式，它可能是命令行上的最后一个参数，也可能通过标准输入流提供。

```ts
import { spawn } from 'child_process';
import * as fs from 'fs';

// 假设 PgRestoreOptions 接口已定义

async function executePgRestore(options: PgRestoreOptions): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  // 验证互斥选项
  if (options.singleTransaction && options.jobs && options.jobs > 1) {
    throw new Error("Cannot use 'singleTransaction' and 'jobs > 1' simultaneously.");
  }

  const args: string =;

  // 动态构建参数列表
  if (options.dbname) args.push('--dbname', options.dbname);
  if (options.clean) args.push('--clean');
  if (options.create) args.push('--create');
  if (options.jobs) args.push('--jobs', String(options.jobs));
  if (options.singleTransaction) args.push('--single-transaction');
  //... 为所有其他选项添加类似的逻辑...
  options.table?.forEach(t => args.push(`--table=${t}`));

  // 输入文件作为最后一个参数
  if (options.inputFile) {
    args.push(options.inputFile);
  }

  return new Promise((resolve, reject) => {
    const pgRestoreProcess = spawn('pg_restore', args, {
      env: {...process.env, /* PGPASSWORD 等 */ },
    });

    let stdout = '';
    let stderr = '';

    // 如果 inputFile 未指定，则需要处理 stdin
    if (!options.inputFile) {
      // 示例：从一个可读流（如文件流或网络流）管道输入
      // const inputStream = fs.createReadStream('backup.dump');
      // inputStream.pipe(pgRestoreProcess.stdin);
    }

    pgRestoreProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pgRestoreProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pgRestoreProcess.on('close', (code) => {
      // 在生产代码中，应检查 stderr 中是否有 pg_restore 的错误计数
      if (code!== 0) {
        const error = new Error(`pg_restore process exited with code ${code}.\nStderr: ${stderr}`);
        reject(error);
      } else {
        resolve({ stdout, stderr, exitCode: code });
      }
    });

    pgRestoreProcess.on('error', (err) => {
      reject(err);
    });
  });
}
```

## 第四部分：综合与高级实现模式

### 4.1. 统一配置与连接管理

为了提供一个更优雅、更面向对象的 API，可以创建一个统一的 `PostgresBackupClient` 类。这个类在其构造函数中接收连接选项，并遵循前面讨论的配置层次结构（构造函数参数 > 环境变量 > 默认值）。这样，备份和恢复操作就可以作为该类的方法来调用，共享同一套连接配置。

```ts
interface ConnectionOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string; // 实际实现中应更安全地处理
}

class PostgresBackupClient {
  private connectionOptions: ConnectionOptions;

  constructor(options: ConnectionOptions = {}) {
    this.connectionOptions = options;
  }

  public dump(
    options: Omit<PgDumpOptions, keyof ConnectionOptions>
  ): Promise<any> {
    const fullOptions = { ...this.connectionOptions, ...options };
    // 调用 executePgDump(fullOptions)
    return Promise.resolve(); // 示例
  }

  public restore(
    options: Omit<PgRestoreOptions, keyof ConnectionOptions>
  ): Promise<any> {
    const fullOptions = { ...this.connectionOptions, ...options };
    // 调用 executePgRestore(fullOptions)
    return Promise.resolve(); // 示例
  }
}
```

### 4.2. 健壮的错误处理与进程通信

一个专业的包装器不应仅仅在进程退出码非零时抛出错误。它应该对 `stderr` 进行解析，以提供结构化的、可操作的错误信息。`pg_restore` 在完成时会打印一个错误计数，而 `pg_dump` 和 `pg_restore` 都会在 `stderr` 中输出以 "FATAL:"、"ERROR:" 或 "WARNING:" 开头的消息。
包装器的执行函数应该捕获并解析这些输出，返回一个包含详细信息的丰富结果对象，或者抛出一个包含这些结构化信息的自定义错误类。例如：

```ts
interface ProcessResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  parsedErrors: string;
  parsedWarnings: string;
}
```

这种方法将模糊的 `stderr` 字符串转化为可供程序判断和记录的清晰信号，极大地增强了包装器的可靠性。

### 4.3. 使用 Node.js 流管理 I/O

对于大型数据库，将整个备份文件写入磁盘再进行处理是低效且耗费资源的。Node.js 的流（Streams）为此提供了完美的解决方案。

- 转储到流：`pg_dump` 的 `stdout` 是一个可读流。可以将其直接通过管道（pipe）连接到另一个可写流，例如 `zlib.createGzip()` 进行即时压缩，或者一个用于上传到云存储（如 AWS S3）的流。这避免了在本地创建巨大的中间文件。
- 从流恢复：反之，可以从网络（例如，从 S3 下载）获取一个可读流，并将其直接管道连接到 `pg_restore` 进程的 `stdin`。这对于在磁盘空间受限的环境（如 AWS Lambda）中执行恢复操作至关重要。

```ts
// 概念性示例：从 pg_dump 流式传输到 gzip 文件
import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { createGzip } from "zlib";

const dumpProcess = spawn("pg_dump", ["-Fc", "mydb"]);
const gzip = createGzip();
const output = createWriteStream("mydb.dump.gz");

dumpProcess.stdout.pipe(gzip).pipe(output);
```

### 4.4. 版本控制与兼容性

PostgreSQL 的工具版本与服务器版本之间的兼容性是一个需要注意的问题 20。基本规则是：

- `pg_dump` 的版本应与其要连接的数据库服务器的版本相匹配。
- 使用较新版本的 `pg_dump` 备份较旧版本的服务器通常是安全的。
- 使用较旧版本的 `pg_dump` 备份较新版本的服务器可能会失败，因为它可能不理解新的系统目录结构或特性。
- 由 `pg_dump` 创建的转储文件通常可以恢复到较新版本的 PostgreSQL 服务器上。

一个高级的包装器可以增加主动的版本检查功能。在执行操作前，它可以运行 `pg_dump --version` 获取本地工具版本，并连接到数据库执行 `SELECT version();` 获取服务器版本。通过比较主版本号，如果发现不匹配，可以向用户发出警告。这种前瞻性的检查可以防止许多难以诊断的运行时问题，为包装器增加了巨大的价值。虽然存在如 `--ignore-version` 这样的旧标志，但最佳实践始终是保持工具和服务器版本的对齐。
