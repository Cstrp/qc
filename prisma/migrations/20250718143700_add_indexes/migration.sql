-- CreateIndex
CREATE INDEX "chats_knowledge_base_id_idx" ON "public"."chats"("knowledge_base_id");

-- CreateIndex
CREATE INDEX "files_company_id_idx" ON "public"."files"("company_id");

-- CreateIndex
CREATE INDEX "knowledge_bases_company_id_idx" ON "public"."knowledge_bases"("company_id");

-- CreateIndex
CREATE INDEX "bots_company_id_idx" ON "telegram"."bots"("company_id");

-- CreateIndex
CREATE INDEX "messages_bot_id_idx" ON "telegram"."messages"("bot_id");

-- CreateIndex
CREATE INDEX "messages_user_id_idx" ON "telegram"."messages"("user_id");
