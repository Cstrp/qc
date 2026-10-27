/*
  Warnings:

  - Added the required column `bot_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "telegram"."users" ADD COLUMN     "bot_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "telegram"."users" ADD CONSTRAINT "users_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "telegram"."bots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
