/**
 * TypeORM CLI Data Source Configuration
 *
 * This file is used by the TypeORM CLI for running migrations.
 * It reads environment variables from the root .env file.
 */

import "dotenv/config";
import { DataSource, DataSourceOptions } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

// Load environment variables from root .env
import * as dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

const options: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Entity and migration paths (relative to this file location)
  entities: ["src/**/*.entity{.ts,.js}"],
  migrations: ["src/migrations/*{.ts,.js}"],

  // Naming strategy
  namingStrategy: new SnakeNamingStrategy(),

  // Logging
  logging: process.env.NODE_ENV === "development",
};

export default new DataSource(options);
