-- DropForeignKey
ALTER TABLE "telegram"."users" DROP CONSTRAINT "users_bot_id_fkey";

-- CreateTable
CREATE TABLE "telegram"."_TelegramBotToTelegramUser" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_TelegramBotToTelegramUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TelegramBotToTelegramUser_B_index" ON "telegram"."_TelegramBotToTelegramUser"("B");

-- AddForeignKey
ALTER TABLE "telegram"."_TelegramBotToTelegramUser" ADD CONSTRAINT "_TelegramBotToTelegramUser_A_fkey" FOREIGN KEY ("A") REFERENCES "telegram"."bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram"."_TelegramBotToTelegramUser" ADD CONSTRAINT "_TelegramBotToTelegramUser_B_fkey" FOREIGN KEY ("B") REFERENCES "telegram"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
