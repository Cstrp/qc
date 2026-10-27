/*
  Warnings:

  - You are about to drop the column `added_by` on the `allowed_users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "telegram"."allowed_users" DROP COLUMN "added_by";
