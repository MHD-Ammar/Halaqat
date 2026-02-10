/**
 * Mosques Module
 *
 * Module for multi-tenancy with mosque management.
 * Provides mosque lookup by invite code for registration.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Mosque } from "./entities/mosque.entity";
import { MosquesController } from "./mosques.controller";
import { MosquesService } from "./mosques.service";

@Module({
  imports: [TypeOrmModule.forFeature([Mosque])],
  controllers: [MosquesController],
  providers: [MosquesService],
  exports: [MosquesService],
})
export class MosquesModule {}
