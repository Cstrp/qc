/*
  Warnings:

  - You are about to drop the column `can_connect_to_business` on the `bots` table. All the data in the column will be lost.
  - You are about to drop the column `has_main_web_app` on the `bots` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "telegram"."bots" DROP COLUMN "can_connect_to_business",
DROP COLUMN "has_main_web_app";
