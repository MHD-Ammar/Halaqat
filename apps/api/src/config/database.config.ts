/**
 * Database Configuration
 *
 * Provides TypeORM configuration using ConfigService.
 * Uses snake_case naming strategy for database columns.
 */

import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  useFactory: (configService: ConfigService) => ({
    type: "postgres",
    host: configService.getOrThrow<string>("DB_HOST"),
    port: configService.getOrThrow<number>("DB_PORT"),
    username: configService.getOrThrow<string>("DB_USER"),
    password: configService.getOrThrow<string>("DB_PASSWORD"),
    database: configService.getOrThrow<string>("DB_NAME"),

    // Entity configuration
    entities: [__dirname + "/../**/*.entity{.ts,.js}"],
    autoLoadEntities: true,

    // Naming strategy: converts camelCase to snake_case
    namingStrategy: new SnakeNamingStrategy(),

    // IMPORTANT: Never use synchronize in production!
    // Use migrations instead for schema changes
    synchronize: false,

    // Logging configuration
    logging: configService.get<string>("NODE_ENV") === "development",
  }),
  inject: [ConfigService],
};
