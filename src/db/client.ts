import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '../lib/env';

const client = postgres(env.DATABASE_URL, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
  connection: {
    statement_timeout: 30_000,  // 30s — prevent runaway queries
  },
});
export const db = drizzle(client, { schema });

export type Database = typeof db;
