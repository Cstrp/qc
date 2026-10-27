/*
  Warnings:

  - You are about to drop the column `bot_id` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "telegram"."users" DROP COLUMN "bot_id";
