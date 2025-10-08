-- Initialize PostgreSQL credentials for local development
-- Sets password for the default postgres role and ensures DB exists
ALTER USER postgres WITH PASSWORD 'postgres';
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'krishi_mitra') THEN
    PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE krishi_mitra');
  END IF;
END
$$ LANGUAGE plpgsql;