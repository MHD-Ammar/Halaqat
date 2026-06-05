/**
 * Halaqat API - Main Entry Point
 *
 * This is the main bootstrap file for the NestJS application.
 * The API runs on port 3001 to avoid conflicts with the web frontend.
 */

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { ValidationDomainException } from "./common/errors";
import { AllExceptionsFilter } from "./common/filters";

/**
 * Bootstrap the NestJS application
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  // Configure port (3001 to avoid conflict with Next.js on 3000)
  const port = process.env.PORT || 3001;

  // Global exception filter — produces { code, message, messageAr, details, requestId }
  app.useGlobalFilters(new AllExceptionsFilter());

  // Strict global validation pipe — whitelist + transform + domain error shape
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,               // strip unknown properties
      forbidNonWhitelisted: true,    // throw 422 if unknown properties present
      transform: true,               // auto-transform payloads to DTO instances
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) =>
        new ValidationDomainException("VALIDATION_ERROR", {
          message: "Validation failed",
          details: errors.map((e) => ({
            property: e.property,
            constraints: e.constraints,
          })),
        }),
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: ["http://localhost:3000", process.env.FRONTEND_URL || ""],
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix("api");

  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle("Halaqat API")
    .setDescription("Quran Circle Management System - REST API Documentation")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .addTag("Auth", "Authentication endpoints")
    .addTag("Users", "User management")
    .addTag("Circles", "Quran circles management")
    .addTag("Students", "Student management")
    .addTag("Sessions", "Daily session management")
    .addTag("Progress", "Recitation progress tracking")
    .addTag("Points", "Gamification points system")
    .addTag("Curriculum", "Quran curriculum data")
    .addTag("Analytics", "Statistics and analytics")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`🚀 Halaqat API is running on: http://localhost:${port}/api`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  logger.log(`✅ Server restarted at ${new Date().toISOString()}`);
}

bootstrap();
