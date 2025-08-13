import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExecutionDateToTimestamp1754971447406
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update execution_date column from date to timestamp in transactions table
    await queryRunner.query(`
            ALTER TABLE transactions 
            ALTER COLUMN execution_date TYPE timestamp USING execution_date::timestamp
        `);

    // Also update execution_date column in trade_orders table if it exists
    await queryRunner.query(`
            ALTER TABLE trade_orders 
            ALTER COLUMN execution_date TYPE timestamp USING execution_date::timestamp
        `);

    console.log(
      'Successfully updated execution_date columns to timestamp type',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert execution_date column from timestamp to date in transactions table
    await queryRunner.query(`
            ALTER TABLE transactions 
            ALTER COLUMN execution_date TYPE date USING execution_date::date
        `);

    // Also revert execution_date column in trade_orders table
    await queryRunner.query(`
            ALTER TABLE trade_orders 
            ALTER COLUMN execution_date TYPE date USING execution_date::date
        `);

    console.log('Successfully reverted execution_date columns to date type');
  }
}
