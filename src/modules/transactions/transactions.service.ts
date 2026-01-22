import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { QueryFailedError } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { TransactionStatus } from './entities/transaction.entity';
import { TransactionsQueue } from './queue/transactions.queue';
import { TransactionsRepository } from './repositories/transactions.repository';

type CreateResult = {
  transactionId: string;
  created: boolean;
};

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repository: TransactionsRepository,
    private readonly queue: TransactionsQueue,
  ) {}

  async create(dto: CreateTransactionDto) {
    const entity = this.repository.create({
      id: randomUUID(),
      idempotencyKey: dto.idempotencyKey,
      amount: dto.amount,
      currency: dto.currency.toUpperCase(),
      description: dto.description ?? null,
      status: TransactionStatus.RECEIVED,
    });

    const createResult = await this.saveIdempotent(entity);
    const transaction = await this.repository.findById(createResult.transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found after creation');
    }

    if (createResult.created) {
      await this.queue.enqueueProcessing(
        transaction.idempotencyKey,
        transaction.id,
      );
    }

    return { transaction, created: createResult.created };
  }

  async list(query: ListTransactionsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const { data, total } = await this.repository.list(
      page,
      pageSize,
      query.status,
    );

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async getById(id: string) {
    const transaction = await this.repository.findById(id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  private async saveIdempotent(entity: ReturnType<TransactionsRepository['create']>): Promise<CreateResult> {
    try {
      const saved = await this.repository.save(entity);
      return { transactionId: saved.id, created: true };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const existing = await this.repository.findByIdempotencyKey(
          entity.idempotencyKey,
        );
        if (!existing) {
          throw error;
        }
        return { transactionId: existing.id, created: false };
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown) {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driverError = (error as QueryFailedError & { driverError?: { code?: string } }).driverError;
    return driverError?.code === '23505';
  }
}
