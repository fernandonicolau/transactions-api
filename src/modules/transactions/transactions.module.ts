import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsQueue } from './queue/transactions.queue';
import { TransactionsProcessor } from './queue/transactions.processor';
import { TransactionsRepository } from './repositories/transactions.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity])],
  controllers: [TransactionsController],
  providers: [
    TransactionsRepository,
    TransactionsService,
    TransactionsQueue,
    TransactionsProcessor,
  ],
})
export class TransactionsModule {}
