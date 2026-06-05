import { DataSource } from "typeorm";
import { GenericContainer, StartedTestContainer } from "testcontainers";

let container: StartedTestContainer | null = null;
let dataSource: DataSource | null = null;

function buildDataSource(opts: {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}): DataSource {
  return new DataSource({
    type: "postgres",
    host: opts.host,
    port: opts.port,
    username: opts.username,
    password: opts.password,
    database: opts.database,
    synchronize: false,
    migrationsRun: false,
    entities: ["src/**/*.entity.ts", "dist/**/*.entity.js"],
    migrations: ["src/migrations/*.ts", "dist/migrations/*.js"],
  });
}

export async function setupTestDb(): Promise<DataSource> {
  if (dataSource?.isInitialized) {
    return dataSource;
  }

  if (process.env.CI) {
    dataSource = buildDataSource({
      host: process.env.TEST_DB_HOST ?? "localhost",
      port: Number(process.env.TEST_DB_PORT ?? "5432"),
      username: process.env.TEST_DB_USER ?? "postgres",
      password: process.env.TEST_DB_PASSWORD ?? "test",
      database: process.env.TEST_DB_NAME ?? "halaqat_test",
    });
  } else {
    container = await new GenericContainer("postgres:16-alpine")
      .withEnvironment({
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "test",
        POSTGRES_DB: "halaqat_test",
      })
      .withExposedPorts(5432)
      .start();

    dataSource = buildDataSource({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      username: "postgres",
      password: "test",
      database: "halaqat_test",
    });
  }

  await dataSource.initialize();
  await dataSource.runMigrations();
  return dataSource;
}

export async function truncateAll(ds: DataSource): Promise<void> {
  const tableNames = ds.entityMetadatas.map((m) => `"${m.tableName}"`);
  if (tableNames.length === 0) return;

  await ds.query(`TRUNCATE ${tableNames.join(", ")} RESTART IDENTITY CASCADE;`);
}

export async function teardownTestDb(): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
  dataSource = null;

  if (container) {
    await container.stop();
  }
  container = null;
}

