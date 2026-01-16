/**
 * AppModule - Root Application Module
 *
 * This is the root module of the NestJS application.
 * It imports and configures all feature modules.
 */

import { Module } from "@nestjs/common";

// Importing from shared types package to verify linkage
import { UserRole } from "@halaqat/types";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

// Log available roles to verify types package is working
console.log("Available User Roles:", Object.values(UserRole));

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
