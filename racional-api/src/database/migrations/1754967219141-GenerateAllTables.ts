import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerateAllTables1754967219141 implements MigrationInterface {
    name = 'GenerateAllTables1754967219141'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "trade_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "wallet_id" uuid NOT NULL, "portfolio_id" uuid NOT NULL, "stock_id" uuid NOT NULL, "type" character varying(10) NOT NULL, "quantity" numeric(15,4) NOT NULL, "price" numeric(15,2) NOT NULL, "execution_date" date, "external_ref_id" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_69e3ea91f26d160e8cb2aa97a5b" UNIQUE ("external_ref_id"), CONSTRAINT "PK_acf330da1046c23ace3709fe393" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "symbol" character varying(10) NOT NULL, "name" character varying(100) NOT NULL, "market" character varying(50) NOT NULL, "current_price" numeric(15,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_abdd997b009437486baf7531854" UNIQUE ("symbol"), CONSTRAINT "PK_b5b1ee4ac914767229337974575" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "portfolio_stocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "portfolio_id" uuid NOT NULL, "stock_id" uuid NOT NULL, "shares" numeric(15,4) NOT NULL, "investment_amount" numeric(15,2) NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d8b5eece766e5843d05955f50eb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "portfolios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_488aa6e9b219d1d9087126871ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "email" character varying(100) NOT NULL, "phone" character varying(20), "password" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "wallet_id" uuid NOT NULL, "type" character varying(20) NOT NULL, "amount" numeric(15,2) NOT NULL, "execution_date" date, "external_ref_id" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0c8bc9d5e2f4bf6b4646a1378e4" UNIQUE ("external_ref_id"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "balance" numeric(15,2) NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL DEFAULT 'USD', "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "trade_orders" ADD CONSTRAINT "FK_2ab142a2446606daf299255f51e" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_orders" ADD CONSTRAINT "FK_5bfae7390cfe0923e14df8945f3" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trade_orders" ADD CONSTRAINT "FK_33dec10f66e977ebc0c34b0ca07" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolio_stocks" ADD CONSTRAINT "FK_7fbe08bfd9cd55e71e4381ead04" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolio_stocks" ADD CONSTRAINT "FK_0276b1336ae3b88c8ee97ff10c2" FOREIGN KEY ("stock_id") REFERENCES "stocks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolios" ADD CONSTRAINT "FK_57fba72db5ac40768b40f0ecfa1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e"`);
        await queryRunner.query(`ALTER TABLE "portfolios" DROP CONSTRAINT "FK_57fba72db5ac40768b40f0ecfa1"`);
        await queryRunner.query(`ALTER TABLE "portfolio_stocks" DROP CONSTRAINT "FK_0276b1336ae3b88c8ee97ff10c2"`);
        await queryRunner.query(`ALTER TABLE "portfolio_stocks" DROP CONSTRAINT "FK_7fbe08bfd9cd55e71e4381ead04"`);
        await queryRunner.query(`ALTER TABLE "trade_orders" DROP CONSTRAINT "FK_33dec10f66e977ebc0c34b0ca07"`);
        await queryRunner.query(`ALTER TABLE "trade_orders" DROP CONSTRAINT "FK_5bfae7390cfe0923e14df8945f3"`);
        await queryRunner.query(`ALTER TABLE "trade_orders" DROP CONSTRAINT "FK_2ab142a2446606daf299255f51e"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "portfolios"`);
        await queryRunner.query(`DROP TABLE "portfolio_stocks"`);
        await queryRunner.query(`DROP TABLE "stocks"`);
        await queryRunner.query(`DROP TABLE "trade_orders"`);
    }

}
