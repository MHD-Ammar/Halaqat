/**
 * AppModule - Root Application Module
 *
 * This is the root module of the NestJS application.
 * It imports and configures all feature modules, database, and configuration.
 */

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { envValidationSchema, typeOrmConfig } from "@/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { CirclesModule } from "./circles/circles.module";

@Module({
  imports: [
    // Configuration Module with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../.env",
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
        allowUnknown: true,
      },
    }),

    // TypeORM Database Module
    TypeOrmModule.forRootAsync(typeOrmConfig),

    // Feature Modules
    UsersModule,
    AuthModule,
    CirclesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

