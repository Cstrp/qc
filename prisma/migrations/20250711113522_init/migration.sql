-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "telegram";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "telegram"."BOT_STATUS" AS ENUM ('ONLINE', 'IDLE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "public"."FILE_STATUS" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."MESSAGE_ROLE" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "telegram"."bots" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "telegram_id" TEXT,
    "username" TEXT,
    "status" "telegram"."BOT_STATUS" NOT NULL DEFAULT 'ONLINE',
    "creator" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "can_join_groups" BOOLEAN DEFAULT true,
    "can_connect_to_business" BOOLEAN DEFAULT false,
    "supports_inline_queries" BOOLEAN DEFAULT false,
    "has_main_web_app" BOOLEAN DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram"."users" (
    "id" UUID NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "username" TEXT,
    "language_code" TEXT,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram"."messages" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "role" "public"."MESSAGE_ROLE" NOT NULL,
    "bot_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram"."allowed_users" (
    "id" UUID NOT NULL,
    "bot_id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "added_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allowed_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."embeddings" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "embeddings" vector,
    "checksum" TEXT NOT NULL,
    "file_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."files" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "status" "public"."FILE_STATUS" NOT NULL DEFAULT 'PENDING',
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_bases" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "bot_id" UUID,
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_base_files" (
    "knowledge_base_id" UUID NOT NULL,
    "file_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_base_files_pkey" PRIMARY KEY ("knowledge_base_id","file_id")
);

-- CreateTable
CREATE TABLE "public"."chats" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "knowledge_base_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "role" "public"."MESSAGE_ROLE" NOT NULL,
    "chat_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bots_name_key" ON "telegram"."bots"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bots_token_key" ON "telegram"."bots"("token");

-- CreateIndex
CREATE UNIQUE INDEX "bots_telegram_id_key" ON "telegram"."bots"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "telegram"."users"("telegram_id");

-- CreateIndex
CREATE INDEX "allowed_users_bot_id_idx" ON "telegram"."allowed_users"("bot_id");

-- CreateIndex
CREATE INDEX "allowed_users_username_idx" ON "telegram"."allowed_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "allowed_users_bot_id_username_key" ON "telegram"."allowed_users"("bot_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "embeddings_checksum_key" ON "public"."embeddings"("checksum");

-- CreateIndex
CREATE INDEX "embeddings_file_id_idx" ON "public"."embeddings"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_bases_bot_id_key" ON "public"."knowledge_bases"("bot_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_bases_name_company_id_key" ON "public"."knowledge_bases"("name", "company_id");

-- AddForeignKey
ALTER TABLE "telegram"."messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "telegram"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram"."messages" ADD CONSTRAINT "messages_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "telegram"."bots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram"."allowed_users" ADD CONSTRAINT "allowed_users_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "telegram"."bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."embeddings" ADD CONSTRAINT "embeddings_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_bases" ADD CONSTRAINT "knowledge_bases_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "telegram"."bots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_base_files" ADD CONSTRAINT "knowledge_base_files_knowledge_base_id_fkey" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_base_files" ADD CONSTRAINT "knowledge_base_files_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chats" ADD CONSTRAINT "chats_knowledge_base_id_fkey" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
