/*
  Warnings:

  - A unique constraint covering the columns `[name,company_id]` on the table `bots` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "bots_name_company_id_key" ON "telegram"."bots"("name", "company_id");
