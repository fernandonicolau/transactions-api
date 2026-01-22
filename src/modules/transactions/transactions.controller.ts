import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { TransactionsService } from './transactions.service';

@Controller('v1/transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Post()
  async create(
    @Body() dto: CreateTransactionDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { transaction, created } = await this.service.create(dto);
    res.status(created ? 201 : 200);
    return transaction;
  }

  @Get()
  async list(@Query() query: ListTransactionsDto) {
    return this.service.list(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
  }
}
