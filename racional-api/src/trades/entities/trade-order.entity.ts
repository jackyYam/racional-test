import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { Stock } from '../../stocks/entities/stock.entity';

export enum TradeOrderType {
  BUY = 'BUY',
  SELL = 'SELL',
}

@Entity('trade_orders')
export class TradeOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  wallet_id: string;

  @Column({ type: 'uuid', nullable: false })
  portfolio_id: string;

  @Column({ type: 'uuid', nullable: false })
  stock_id: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
  })
  type: TradeOrderType;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: false,
  })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  price: number;

  @Column({ type: 'date', nullable: true })
  execution_date: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  external_ref_id: string;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Wallet, (wallet) => wallet.tradeOrders)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.id)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @ManyToOne(() => Stock, (stock) => stock.id)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;
}
