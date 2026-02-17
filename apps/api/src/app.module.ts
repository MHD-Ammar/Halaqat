/**
 * AppModule - Root Application Module
 *
 * This is the root module of the NestJS application.
 * It imports and configures all feature modules, database, and configuration.
 */

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AnalyticsModule } from "./analytics/analytics.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { CirclesModule } from "./circles/circles.module";
import { envValidationSchema, typeOrmConfig } from "./config";
import { CurriculumModule } from "./curriculum/curriculum.module";
import { ExamsModule } from "./exams/exams.module";
import { MosquesModule } from "./mosques/mosques.module";
import { PointsModule } from "./points/points.module";
import { ProgressModule } from "./progress/progress.module";
import { RamadanModule } from "./ramadan/ramadan.module";
import { SessionsModule } from "./sessions/sessions.module";
import { StudentsModule } from "./students/students.module";
import { UsersModule } from "./users/users.module";


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
    ExamsModule,
    MosquesModule,
    RamadanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
