import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTenantIdForeignKey1736697031205 implements MigrationInterface {
  name = 'AddTenantIdForeignKey1736697031205'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`)
    await queryRunner.query(`ALTER TABLE "users" ADD "tenantId" integer`)
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"`,
    )
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tenantId"`)
    await queryRunner.query(
      `ALTER TABLE "users" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    )
  }
}
