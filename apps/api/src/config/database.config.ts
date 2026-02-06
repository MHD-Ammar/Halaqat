/**
 * Database Configuration
 *
 * Provides TypeORM configuration using ConfigService.
 * Uses snake_case naming strategy for database columns.
 */

import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { join } from "path";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  useFactory: (configService: ConfigService) => {
    // Determine environment inside factory for better testability
    const isProduction = configService.get<string>("NODE_ENV") === "production";

    return {
      type: "postgres",
      host: configService.getOrThrow<string>("DB_HOST"),
      port: configService.getOrThrow<number>("DB_PORT"),
      username: configService.getOrThrow<string>("DB_USER"),
      password: configService.getOrThrow<string>("DB_PASSWORD"),
      database: configService.getOrThrow<string>("DB_NAME"),

      // Entity configuration
      // We need to go up one level ('..') from 'config' to 'src' (or 'dist' in prod)
      entities: [
        join(
          __dirname,
          "..", 
          "**", 
          isProduction ? "*.entity.js" : "*.entity.ts"
        ),
      ],
      autoLoadEntities: true,

      // Migrations configuration
      migrations: [
        join(
          __dirname, 
          "..", 
          "migrations", 
          isProduction ? "*.js" : "*.ts"
        ),
      ],

      // Naming strategy: converts camelCase to snake_case
      namingStrategy: new SnakeNamingStrategy(),

      // IMPORTANT: Never use synchronize in production!
      // Use migrations instead for schema changes
      synchronize: false,

      // Logging configuration
      logging: !isProduction,
    };
  },
  inject: [ConfigService],
};
