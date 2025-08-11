import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  wallet_id: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  type: TransactionType;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  amount: number;

  @Column({ type: 'date', nullable: true })
  execution_date: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  external_ref_id: string;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;
}
