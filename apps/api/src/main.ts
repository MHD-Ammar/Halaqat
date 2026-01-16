/**
 * Halaqat API - Main Entry Point
 *
 * This is the main bootstrap file for the NestJS application.
 * The API runs on port 3001 to avoid conflicts with the web frontend.
 */

import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";

import { AppModule } from "./app.module";

/**
 * Bootstrap the NestJS application
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  // Configure port (3001 to avoid conflict with Next.js on 3000)
  const port = process.env.PORT || 3001;

  // Enable CORS for development
  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix("api");

  await app.listen(port);
  logger.log(`🚀 Halaqat API is running on: http://localhost:${port}/api`);
}

bootstrap();
