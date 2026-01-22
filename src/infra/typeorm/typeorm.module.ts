import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TransactionEntity } from '../../modules/transactions/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        const databaseUrl = config.getOrThrow<string>('DATABASE_URL');
        const needsSsl = isProduction || databaseUrl.includes('render.com');

        return {
          type: 'postgres',
          url: databaseUrl,
          ssl: needsSsl ? { rejectUnauthorized: false } : false,
          synchronize: !isProduction,
          logging: false,
          entities: [TransactionEntity],
        };
      },
    }),
  ],
})
export class AppTypeOrmModule {}
