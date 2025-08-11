import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { PortfolioStock } from '../../portfolios/entities/portfolio-stock.entity';

@Entity('stocks')
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, nullable: false, unique: true })
  symbol: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
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

  // Relationships
  @OneToMany(() => PortfolioStock, (portfolioStock) => portfolioStock.stock)
  portfolioStocks: PortfolioStock[];
}
