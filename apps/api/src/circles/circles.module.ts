/**
 * Circles Module
 *
 * Module for managing study circles (Halaqat).
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CirclesController } from "./circles.controller";
import { CirclesService } from "./circles.service";
import { Circle } from "./entities/circle.entity";
import { User } from "../users/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Circle, User])],
  controllers: [CirclesController],
  providers: [CirclesService],
  exports: [CirclesService],
})
export class CirclesModule {}
