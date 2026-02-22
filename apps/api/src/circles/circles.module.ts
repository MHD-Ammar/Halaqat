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
import { Student } from "../students/entities/student.entity";
import { User } from "../users/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Circle, User, Student])],
  controllers: [CirclesController],
  providers: [CirclesService],
  exports: [CirclesService],
})
export class CirclesModule {}
