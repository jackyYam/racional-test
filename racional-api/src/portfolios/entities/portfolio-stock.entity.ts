import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Stock } from '../../stocks/entities/stock.entity';

@Entity('portfolio_stocks')
export class PortfolioStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  portfolio_id: string;

  @Column({ type: 'uuid', nullable: false })
  stock_id: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: false,
  })
  shares: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  investment_amount: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    default: 0,
  })
  sell_amount: number;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Portfolio, (portfolio) => portfolio.portfolioStocks)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @ManyToOne(() => Stock, (stock) => stock.portfolioStocks)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;
}
