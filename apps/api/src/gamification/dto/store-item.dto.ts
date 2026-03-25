import { StoreItemType } from '@halaqat/types';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateStoreItemDto {
  @IsString()
  name!: string;

  @IsString()
  nameAr!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @IsEnum(StoreItemType)
  type!: StoreItemType;

  @IsNumber()
  @Min(0)
  xpCost!: number;

  @IsString()
  rewardValue!: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  maxPerStudent?: number | null;

  @IsNumber()
  @IsOptional()
  stock?: number | null;

  @IsNumber()
  @IsOptional()
  @Min(1)
  minLevel?: number;
}

export class UpdateStoreItemDto extends CreateStoreItemDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
