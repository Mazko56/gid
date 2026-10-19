import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { SCHEMA_SQL, SEED_SQL } from "./schema.js";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool?: Pool;

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      this.logger.warn("DATABASE_URL is not set. Stage 2 API will be unavailable until PostgreSQL is connected.");
      return;
    }

    this.pool = new Pool({
      connectionString,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });

    await this.pool.query("SELECT 1");
    if (process.env.DB_AUTO_MIGRATE !== "false") {
      await this.pool.query(SCHEMA_SQL);
      if (process.env.DB_AUTO_SEED !== "false") await this.pool.query(SEED_SQL);
    }
    this.logger.log("PostgreSQL connected and Stage 2 schema is ready");
  }

  isReady() {
    return Boolean(this.pool);
  }

  async query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
    if (!this.pool) throw new Error("DATABASE_URL is not configured");
    return this.pool.query<T>(text, params);
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) throw new Error("DATABASE_URL is not configured");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
