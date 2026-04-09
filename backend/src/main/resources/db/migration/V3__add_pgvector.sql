CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE chat_messages ADD COLUMN embedding vector(768);

CREATE INDEX idx_chat_messages_embedding
ON chat_messages USING hnsw (embedding vector_cosine_ops);
