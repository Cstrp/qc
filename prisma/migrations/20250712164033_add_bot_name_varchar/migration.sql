/*
  Warnings:

  - You are about to alter the column `name` on the `bots` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- DropForeignKey
ALTER TABLE "telegram"."messages" DROP CONSTRAINT "messages_bot_id_fkey";

-- AlterTable
ALTER TABLE "telegram"."bots" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AddForeignKey
ALTER TABLE "telegram"."messages" ADD CONSTRAINT "messages_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "telegram"."bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
