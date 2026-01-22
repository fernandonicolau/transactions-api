import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity, TransactionStatus } from '../entities/transaction.entity';

@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repository: Repository<TransactionEntity>,
  ) {}

  create(data: Partial<TransactionEntity>) {
    return this.repository.create(data);
  }

  save(entity: TransactionEntity) {
    return this.repository.save(entity);
  }

  findByIdempotencyKey(idempotencyKey: string) {
    return this.repository.findOne({ where: { idempotencyKey } });
  }

  findById(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  async list(
    page: number,
    pageSize: number,
    status?: TransactionStatus,
  ) {
    const query = this.repository.createQueryBuilder('transaction');

    if (status) {
      query.where('transaction.status = :status', { status });
    }

    query.orderBy('transaction.created_at', 'DESC');
    query.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async updateStatus(id: string, status: TransactionStatus) {
    await this.repository.update({ id }, { status });
  }
}
