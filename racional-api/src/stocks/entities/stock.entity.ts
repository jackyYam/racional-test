import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PortfolioStock } from '../../portfolios/entities/portfolio-stock.entity';
import { TradeOrder } from '../../trades/entities/trade-order.entity';

@Entity('stocks')
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: false })
  symbol: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  market: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  current_price: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => PortfolioStock, (portfolioStock) => portfolioStock.stock)
  portfolioStocks: PortfolioStock[];

  @OneToMany(() => TradeOrder, (tradeOrder) => tradeOrder.stock)
  tradeOrders: TradeOrder[];
}
