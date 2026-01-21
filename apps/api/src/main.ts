/**
 * Halaqat API - Main Entry Point
 *
 * This is the main bootstrap file for the NestJS application.
 * The API runs on port 3001 to avoid conflicts with the web frontend.
 */

import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

import { AppModule } from "./app.module";

/**
 * Bootstrap the NestJS application
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  // Configure port (3001 to avoid conflict with Next.js on 3000)
  const port = process.env.PORT || 3001;

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  // Enable CORS for development
  app.enableCors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
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
}

bootstrap();
