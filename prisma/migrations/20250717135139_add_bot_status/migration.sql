-- AlterTable
ALTER TABLE "telegram"."bots" ADD COLUMN     "status" "telegram"."BOT_STATUS" NOT NULL DEFAULT 'OFFLINE';
