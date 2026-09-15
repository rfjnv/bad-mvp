/**
 * Заполнение Product.contraindications — только по официальным страницам
 * товара на сайте бренда (источник указан у каждой записи), не по составу
 * и не по памяти.
 *
 *   npx tsx scripts/fill-contraindications.ts          — только таблица
 *   npx tsx scripts/fill-contraindications.ts --apply  — записать
 *
 * Не перезаписывает то, что уже заполнено вручную в админке.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const CONTRAINDICATIONS: Record<string, { text: string; source: string }> = {
  "now-d3-k2-5000-180": {
    text: "Содержит витамин K2 — при приёме антикоагулянтов (варфарин, гепарин и похожие препараты) нужна консультация врача перед приёмом.",
    source: "Официальная страница NOW Foods линейки D3+K2 (45 мкг MK-4): предупреждение про антикоагулянты указано на этикетке.",
  },
  "solaray-d3-k2-5000-120": {
    text: "Содержит витамин K2 — при приёме антикоагулянтов (варфарин, гепарин и похожие препараты) нужна консультация врача перед приёмом.",
    source: "Официальная страница Solaray Vitamin D3+K2 5000 IU/50 мкг MK-7: то же предупреждение на этикетке.",
  },
};

// Проверено и НЕ добавлено:
// - NOW Омега-3 1000 мг, 200 капс — подтверждённый реальный товар (nowfoods.com),
//   но на его собственной странице явного предупреждения про свёртываемость нет
//   (это стандартная дозировка 1–2 капсулы, не «высокая доза»). Медицинская
//   литература в целом отмечает влияние при дозах от ~3 г/день, но раз на
//   этикетке ЭТОГО товара ограничения нет — по правилу "только по этикетке"
//   поле остаётся пустым.
// - Solaray Омега-3 «Тройная сила» и Jarrow Max Omega 3-6-9 — эти SKU уже были
//   отмечены в Задаче 3 как не найденные в реальных линейках брендов (см. чат).
//   Пока это не прояснится, я не подбираю для них предупреждения — источника нет.
// - Беременность: у обоих D3+K2 на этикетке есть общая фраза «проконсультируйтесь
//   с врачом при беременности» — но это стандартная оговорка почти любого БАД,
//   не специфическое ограничение. Не считаю это отдельным пунктом «кому не
//   подходит» и не включаю, чтобы не размывать по-настоящему серьёзное
//   предупреждение (антикоагулянты) общими словами.

async function main() {
  const products = await prisma.product.findMany({ where: { slug: { in: Object.keys(CONTRAINDICATIONS) } } });

  console.log(`Найдено ${products.length} из ${Object.keys(CONTRAINDICATIONS).length} ожидаемых SKU.\n`);

  const rows: { slug: string; name: string; text: string }[] = [];
  for (const p of products) {
    const draft = CONTRAINDICATIONS[p.slug];
    if (p.contraindications) {
      console.log(`ПРОПУСК (уже заполнено вручную): ${p.name}`);
      continue;
    }
    console.log(`${p.name} [${p.slug}]`);
    console.log(`  текст: ${draft.text}`);
    console.log(`  источник: ${draft.source}`);
    rows.push({ slug: p.slug, name: p.name, text: draft.text });
  }

  if (!apply) {
    console.log("\nБаза не изменена. Чтобы записать: npx tsx scripts/fill-contraindications.ts --apply");
    return;
  }

  for (const r of rows) {
    await prisma.product.update({ where: { slug: r.slug }, data: { contraindications: r.text } });
  }
  console.log(`\nЗаписано: ${rows.length}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
