import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { TransactionEntity } from '../../modules/transactions/entities/transaction.entity';

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;
const needsSsl = isProduction || (databaseUrl?.includes('render.com') ?? false);

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  synchronize: !isProduction,
  logging: false,
  entities: [TransactionEntity],
  migrations: ['dist/migrations/*.js'],
});
