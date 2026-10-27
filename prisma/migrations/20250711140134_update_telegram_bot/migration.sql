/*
  Warnings:

  - You are about to drop the column `creator` on the `bots` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `bots` table. All the data in the column will be lost.
  - You are about to drop the column `telegram_id` on the `bots` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `bots` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[first_name]` on the table `bots` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `first_name` to the `bots` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "telegram"."bots_name_key";

-- DropIndex
DROP INDEX "telegram"."bots_telegram_id_key";

-- DropIndex
DROP INDEX "telegram"."bots_token_key";

-- AlterTable
ALTER TABLE "telegram"."bots" DROP COLUMN "creator",
DROP COLUMN "name",
DROP COLUMN "telegram_id",
DROP COLUMN "user_id",
ADD COLUMN     "can_read_all_group_messages" BOOLEAN DEFAULT true,
ADD COLUMN     "first_name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bots_first_name_key" ON "telegram"."bots"("first_name");
