/**
 * Database-test setup. Loaded by `bun run test:db` only — never by CI.
 *
 * Throws unless TEST_DATABASE_URL names a localhost database, then publishes it
 * as DATABASE_URL for the application code to read.
 *
 * Note src/integration.db.test.ts additionally needs a live server on :6174.
 * Use `./run-integration-tests.sh`, which starts one, rather than calling
 * `bun run test:db` directly for that file.
 */
import { setupTestDatabase } from "@sudobility/test-db-guard";

process.env.NODE_ENV = "test";

setupTestDatabase();
