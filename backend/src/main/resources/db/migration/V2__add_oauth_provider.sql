-- users 테이블에 OAuth 관련 컬럼 추가
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);
