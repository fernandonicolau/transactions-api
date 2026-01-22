import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class TransactionsQueue implements OnModuleDestroy {
  private readonly queue: Queue;

  constructor(config: ConfigService) {
    const redisUrl = config.getOrThrow<string>('REDIS_URL');
    this.queue = new Queue('transactions', {
      connection: { url: redisUrl },
    });
  }

  async enqueueProcessing(idempotencyKey: string, transactionId: string) {
    await this.queue.add(
      'process',
      { transactionId },
      {
        jobId: idempotencyKey,
        attempts: 3,
        backoff: { type: 'exponential', delay: 500 },
      },
    );
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
