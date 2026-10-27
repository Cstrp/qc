-- DropForeignKey
ALTER TABLE "telegram"."users" DROP CONSTRAINT "users_bot_id_fkey";

-- AddForeignKey
ALTER TABLE "telegram"."users" ADD CONSTRAINT "users_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "telegram"."bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
