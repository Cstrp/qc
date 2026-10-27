/*
  Warnings:

  - Added the required column `name` to the `bots` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "telegram"."bots" ADD COLUMN     "name" TEXT NOT NULL;
