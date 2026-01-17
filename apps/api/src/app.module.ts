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
import { StudentsModule } from "./students/students.module";
import { CurriculumModule } from "./curriculum/curriculum.module";
import { SessionsModule } from "./sessions/sessions.module";
import { PointsModule } from "./points/points.module";
import { ProgressModule } from "./progress/progress.module";
import { AnalyticsModule } from "./analytics/analytics.module";

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
    StudentsModule,
    CurriculumModule,
    SessionsModule,
    PointsModule,
    ProgressModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

