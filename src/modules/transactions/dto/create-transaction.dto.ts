import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  idempotencyKey: string;

  @Matches(/^[0-9]+(\.[0-9]{1,2})?$/)
  amount: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  currency: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
