/**
 * TypeORM Data Source Configuration
 *
 * This file is serving as the single source of truth for TypeORM CLI
 * in both development (ts-node) and production (node dist/...).
 */

import { DataSource, DataSourceOptions } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import * as dotenv from "dotenv";
import { join } from "path";

// Load environment variables from root .env if running locally
// In production/Docker, these will be provided by the environment
dotenv.config({ path: "../../.env" });

const options: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Entities and Migrations
  // Using __dirname ensures it works relative to this file's location
  // whether it is in src/ (dev) or dist/ (prod)
  entities: [join(__dirname, "**/*.entity{.ts,.js}")],
  migrations: [join(__dirname, "migrations/*{.ts,.js}")],

  // Naming strategy
  namingStrategy: new SnakeNamingStrategy(),

  // Logging
  logging: process.env.NODE_ENV === "development",
};

export default new DataSource(options);
