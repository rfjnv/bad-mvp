/**
 * Применяет одну миграцию Prisma напрямую через node-postgres.
 *
 * Зачем: на машине разработчика движок Prisma периодически не резолвит
 * хост Neon (P1001), хотя обычное подключение работает. Скрипт делает
 * ровно то, что `prisma migrate deploy`: выполняет migration.sql в транзакции
 * и записывает строку в _prisma_migrations с тем же checksum, чтобы
 * на Render `migrate deploy` увидел миграцию применённой и не повторял её.
 *
 * Использование: node scripts/db-apply-migration.cjs <имя_папки_миграции>
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Client } = require("pg");

const name = process.argv[2];
if (!name) {
  console.error("Укажите имя папки миграции из prisma/migrations");
  process.exit(1);
}
const file = path.join("prisma", "migrations", name, "migration.sql");
const sql = fs.readFileSync(file, "utf8");
const checksum = crypto.createHash("sha256").update(sql).digest("hex");

const env = fs.readFileSync(".env", "utf8");
const url = (env.match(/^DATABASE_URL="([^"]*)"/m) || [])[1];
if (!url) {
  console.error("DATABASE_URL не найден в .env");
  process.exit(1);
}

// Системный DNS на этой машине периодически не находит хосты Neon.
// Резолвим через 1.1.1.1 и подключаемся по IP, оставляя имя хоста в SNI —
// по нему Neon определяет endpoint, без него соединение отклонит.
async function connect() {
  const dns = require("dns").promises;
  const u = new URL(url);
  const base = { user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: u.pathname.slice(1), port: Number(u.port) || 5432, connectionTimeoutMillis: 20000 };
  try {
    const c = new Client({ ...base, host: u.hostname, ssl: { rejectUnauthorized: false } });
    await c.connect();
    return c;
  } catch (e) {
    if (e.code !== "ENOTFOUND") throw e;
    const r = new dns.Resolver();
    r.setServers(["1.1.1.1", "8.8.8.8"]);
    const [ip] = await r.resolve4(u.hostname);
    console.log(`DNS:  ->  (через 1.1.1.1)`);
    const c = new Client({ ...base, host: ip, ssl: { rejectUnauthorized: false, servername: u.hostname } });
    await c.connect();
    return c;
  }
}

(async () => {
  const c = await connect();
  try {
    const applied = await c.query(
      "select 1 from _prisma_migrations where migration_name = $1 and finished_at is not null",
      [name]
    );
    if (applied.rowCount > 0) {
      console.log(`Миграция ${name} уже применена — пропускаю.`);
      return;
    }
    await c.query("begin");
    await c.query(sql);
    await c.query(
      `insert into _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       values (gen_random_uuid()::text, $1, now(), $2, null, null, now(), 1)`,
      [checksum, name]
    );
    await c.query("commit");
    console.log(`Применена миграция ${name}`);
  } catch (e) {
    await c.query("rollback").catch(() => {});
    console.error("Ошибка:", e.message);
    process.exit(1);
  } finally {
    await c.end();
  }
})();
