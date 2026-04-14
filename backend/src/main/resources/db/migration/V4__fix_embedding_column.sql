DROP INDEX IF EXISTS idx_chat_messages_embedding;
ALTER TABLE chat_messages DROP COLUMN IF EXISTS embedding;
ALTER TABLE chat_messages ADD COLUMN embedding vector;
