/*
  Warnings:

  - The values [IDLE] on the enum `BOT_STATUS` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "telegram"."BOT_STATUS_new" AS ENUM ('ONLINE', 'OFFLINE');
ALTER TABLE "telegram"."bots" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "telegram"."bots" ALTER COLUMN "status" TYPE "telegram"."BOT_STATUS_new" USING ("status"::text::"telegram"."BOT_STATUS_new");
ALTER TYPE "telegram"."BOT_STATUS" RENAME TO "BOT_STATUS_old";
ALTER TYPE "telegram"."BOT_STATUS_new" RENAME TO "BOT_STATUS";
DROP TYPE "telegram"."BOT_STATUS_old";
ALTER TABLE "telegram"."bots" ALTER COLUMN "status" SET DEFAULT 'OFFLINE';
COMMIT;
