import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStocksAndDefaultPortfolio1700000000000
  implements MigrationInterface
{
  name = 'CreateStocksAndDefaultPortfolio1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create stocks table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "symbol" character varying(10) NOT NULL,
        "name" character varying(100) NOT NULL,
        "market" character varying(50) NOT NULL,
        "current_price" decimal(15,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_stocks_symbol" UNIQUE ("symbol"),
        CONSTRAINT "PK_stocks" PRIMARY KEY ("id")
      )
    `);

    // Create portfolios table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "portfolios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portfolios" PRIMARY KEY ("id")
      )
    `);

    // Create portfolio_stocks table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "portfolio_stocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "portfolio_id" uuid NOT NULL,
        "stock_id" uuid NOT NULL,
        "shares" decimal(15,4) NOT NULL,
        "investment_amount" decimal(15,2) NOT NULL,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portfolio_stocks" PRIMARY KEY ("id")
      )
    `);

    // Create trade_orders table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "trade_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "wallet_id" uuid NOT NULL,
        "portfolio_id" uuid NOT NULL,
        "stock_id" uuid NOT NULL,
        "type" character varying(10) NOT NULL,
        "quantity" decimal(15,4) NOT NULL,
        "price" decimal(15,2) NOT NULL,
        "execution_date" date,
        "external_ref_id" character varying(100),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trade_orders" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the seeded stocks
    await queryRunner.query(`DELETE FROM "stocks" WHERE "id" IN (
      'stock-aapl', 'stock-msft', 'stock-googl', 'stock-amzn', 'stock-tsla'
    )`);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "trade_orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "portfolio_stocks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "portfolios"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stocks"`);
  }
}
