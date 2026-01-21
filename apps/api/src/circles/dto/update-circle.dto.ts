/**
 * Update Circle DTO
 *
 * Partial type of CreateCircleDto for updates.
 * Uses @nestjs/swagger PartialType for proper OpenAPI schema inheritance.
 */

import { PartialType } from "@nestjs/swagger";
import { CreateCircleDto } from "./create-circle.dto";

export class UpdateCircleDto extends PartialType(CreateCircleDto) {}
