/**
 * AppModule - Root Application Module
 *
 * This is the root module of the NestJS application.
 * It imports and configures all feature modules, database, and configuration.
 */

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AnalyticsModule } from "./analytics/analytics.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { CirclesModule } from "./circles/circles.module";
import { envValidationSchema, typeOrmConfig } from "./config";
import { CurriculumModule } from "./curriculum/curriculum.module";
import { DailyChallengeModule } from "./daily-challenge/daily-challenge.module";
import { ExamsModule } from "./exams/exams.module";
import { GamificationModule } from "./gamification/gamification.module";
import { MosquesModule } from "./mosques/mosques.module";
import { MushafModule } from "./mushaf/mushaf.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PointsModule } from "./points/points.module";
import { ProgressModule } from "./progress/progress.module";
import { SessionsModule } from "./sessions/sessions.module";
import { StudentPortalModule } from "./student-portal/student-portal.module";
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
    ScheduleModule.forRoot(),

    // Feature Modules
    UsersModule,
    AuthModule,
    CirclesModule,
    StudentsModule,
    StudentPortalModule,
    CurriculumModule,
    SessionsModule,
    PointsModule,
    ProgressModule,
    AnalyticsModule,
    ExamsModule,
    MosquesModule,
    DailyChallengeModule,
    GamificationModule,
    NotificationsModule,
    MushafModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
