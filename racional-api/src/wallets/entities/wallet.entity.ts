import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { TradeOrder } from '../../trades/entities/trade-order.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
    default: 0.0,
  })
  balance: number;

  @Column({ type: 'varchar', length: 3, nullable: false, default: 'USD' })
  currency: string;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.wallet)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];

  @OneToMany(() => TradeOrder, (tradeOrder) => tradeOrder.wallet)
  tradeOrders: TradeOrder[];
}
