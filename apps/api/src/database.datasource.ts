/**
 * TypeORM Data Source Configuration
 *
 * This file is serving as the single source of truth for TypeORM CLI
 * in both development (ts-node) and production (node dist/...).
 */

import { join } from "path";

import * as dotenv from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

import { RecitationMistake, StudentMushafState } from "./mushaf";

// Load environment variables from root .env if running locally
// In production/Docker, these will be provided by the environment
dotenv.config({ path: "../../.env" });

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const options: DataSourceOptions = {
  type: "postgres",
  host: requiredEnv("DB_HOST"),
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: requiredEnv("DB_USER"),
  password: requiredEnv("DB_PASSWORD"),
  database: requiredEnv("DB_NAME"),

  // Entities and Migrations
  // Using __dirname ensures it works relative to this file's location
  // whether it is in src/ (dev) or dist/ (prod)
  entities: [
    RecitationMistake,
    StudentMushafState,
    join(__dirname, "**/*.entity{.ts,.js}"),
  ],
  migrations: [join(__dirname, "migrations/*{.ts,.js}")],

  // Naming strategy
  namingStrategy: new SnakeNamingStrategy(),

  // Logging
  logging: process.env.NODE_ENV === "development",
};

export default new DataSource(options);
