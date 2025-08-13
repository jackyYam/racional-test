import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedStocks1754970835620 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if stocks already exist to avoid duplicates
    const existingStocks = await queryRunner.query(
      `SELECT COUNT(*) as count FROM stocks`,
    );

    if (existingStocks[0].count > 0) {
      console.log('Stocks already seeded, skipping...');
      return;
    }

    // Insert seed stock data
    await queryRunner.query(`
            INSERT INTO stocks (symbol, name, market, current_price, created_at, updated_at) VALUES
            ('AAPL', 'Apple Inc.', 'NASDAQ', 150.00, NOW(), NOW()),
            ('MSFT', 'Microsoft Corporation', 'NASDAQ', 300.00, NOW(), NOW()),
            ('GOOGL', 'Alphabet Inc.', 'NASDAQ', 120.00, NOW(), NOW()),
            ('AMZN', 'Amazon.com Inc.', 'NASDAQ', 130.00, NOW(), NOW()),
            ('TSLA', 'Tesla Inc.', 'NASDAQ', 200.00, NOW(), NOW())
        `);

    console.log('Successfully seeded 5 stocks');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the seeded stocks
    await queryRunner.query(`
            DELETE FROM stocks WHERE symbol IN (
                'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'
            )
        `);

    console.log('Successfully removed seeded stocks');
  }
}
