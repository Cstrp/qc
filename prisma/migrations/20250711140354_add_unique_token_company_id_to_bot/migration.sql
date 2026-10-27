/*
  Warnings:

  - A unique constraint covering the columns `[token,company_id]` on the table `bots` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "telegram"."bots_first_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "bots_token_company_id_key" ON "telegram"."bots"("token", "company_id");
