import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { TransactionStatus } from '../entities/transaction.entity';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { TransactionsService } from '../transactions.service';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class TransactionsProcessor implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;

  constructor(
    private readonly repository: TransactionsRepository,
    private readonly service: TransactionsService,
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TransactionsProcessor.name);
  }

  onModuleInit() {
    const redisUrl = this.config.getOrThrow<string>('REDIS_URL');
    this.worker = new Worker(
      'transactions',
      async (job) => {
        const { transactionId } = job.data as { transactionId: string };
        const transaction = await this.repository.findById(transactionId);

        if (!transaction) {
          this.logger.warn({ transactionId }, 'Transaction not found');
          return;
        }

        if (transaction.status === TransactionStatus.PROCESSED) {
          return;
        }

        await this.service.updateStatus(
          transactionId,
          TransactionStatus.PROCESSING,
        );
        await sleep(300);
        await this.service.updateStatus(
          transactionId,
          TransactionStatus.PROCESSED,
        );
      },
      {
        connection: { url: redisUrl },
      },
    );

    this.worker.on('failed', async (job) => {
      if (!job) return;
      const { transactionId } = job.data as { transactionId: string };
      await this.service.updateStatus(
        transactionId,
        TransactionStatus.FAILED,
      );
      this.logger.error({ transactionId }, 'Transaction failed');
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
