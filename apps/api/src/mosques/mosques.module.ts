/**
 * Mosques Module
 *
 * Module for multi-tenancy with mosque management.
 * Provides mosque lookup by invite code for registration.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MosquesService } from "./mosques.service";
import { Mosque } from "./entities/mosque.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Mosque])],
  providers: [MosquesService],
  exports: [MosquesService],
})
export class MosquesModule {}
