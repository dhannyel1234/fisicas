-- Script de inicialização do banco de dados PostgreSQL
-- Este script é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar usuário e database se não existirem
-- (Isso já é feito através das variáveis de ambiente do Docker)

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Recarregar configurações
SELECT pg_reload_conf();

-- Log de inicialização
INSERT INTO pg_stat_statements_info VALUES ('Database initialized for Hyper-V Platform');

-- Comentários para documentação
COMMENT ON DATABASE hyperv_platform IS 'Database for Hyper-V VM management platform';

-- Configurar timezone
SET timezone = 'UTC';