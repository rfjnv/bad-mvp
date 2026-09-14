/**
 * Заполняет unitsPerPack/dailyDose/unitType для SKU, которые
 * scripts/fill-duration.ts сознательно пропустил (порошки и дозы
 * «1–2 капсулы» — нельзя было выбирать дозу за покупателя).
 *
 * Источник для порошков — собственное поле dosage товара в базе (уже
 * введено раньше, не выдумано здесь). Источник для диапазонов «1–2» —
 * верхняя граница диапазона: для напоминания «банка заканчивается»
 * заниженная длительность безопаснее завышенной (лучше напомнить чуть
 * раньше, чем после того как банка уже кончилась).
 *
 * NOW Сывороточный протеин сюда не включён: в dosage нет веса мерной
 * ложки в граммах, а гадать нельзя — нужно свериться с этикеткой.
 *
 *   npx tsx scripts/fill-duration-gaps.ts          — только таблица
 *   npx tsx scripts/fill-duration-gaps.ts --apply  — записать
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const FILL: Record<
  string,
  { unitsPerPack: number; dailyDose: number; unitType: "GRAM" | "CAPSULE"; reason: string }
> = {
  "jarrow-creatine-monohydrate-500g": {
    unitsPerPack: 500,
    dailyDose: 5,
    unitType: "GRAM",
    reason: 'dosage: "5 г в день" — банка 500 г из названия',
  },
  "now-collagen-peptides-16oz": {
    unitsPerPack: 454,
    dailyDose: 10,
    unitType: "GRAM",
    reason: 'dosage: "1 мерная ложка (10 г) в день" — банка 454 г из названия',
  },
  "jarrow-saccharomyces-boulardii-180": {
    unitsPerPack: 180,
    dailyDose: 2,
    unitType: "CAPSULE",
    reason: 'dosage: "1–2 раза в день", взят верхний предел — банка 180 капс из названия',
  },
  "life-extension-inositol-1000-360": {
    unitsPerPack: 360,
    dailyDose: 2,
    unitType: "CAPSULE",
    reason: 'dosage: "1–2 раза в день", взят верхний предел — банка 360 капс из названия',
  },
  "now-omega-3-1000-200": {
    unitsPerPack: 200,
    dailyDose: 2,
    unitType: "CAPSULE",
    reason: 'dosage: "1–2 капсулы в день", взят верхний предел — банка 200 капс из названия',
  },
};

async function main() {
  const products = await prisma.product.findMany({ where: { slug: { in: Object.keys(FILL) } } });

  console.log(`Найдено ${products.length} из ${Object.keys(FILL).length} ожидаемых SKU.\n`);

  for (const p of products) {
    const f = FILL[p.slug];
    if (p.unitsPerPack || p.dailyDose || p.unitType) {
      console.log(`ПРОПУСК (уже заполнено вручную): ${p.name}`);
      continue;
    }
    console.log(`${p.name} [${p.slug}]`);
    console.log(`  unitsPerPack=${f.unitsPerPack} dailyDose=${f.dailyDose} unitType=${f.unitType}`);
    console.log(`  обоснование: ${f.reason}`);
  }

  if (!apply) {
    console.log("\nБаза не изменена. Чтобы записать: npx tsx scripts/fill-duration-gaps.ts --apply");
    return;
  }

  let written = 0;
  for (const p of products) {
    const f = FILL[p.slug];
    if (p.unitsPerPack || p.dailyDose || p.unitType) continue;
    await prisma.product.update({
      where: { id: p.id },
      data: { unitsPerPack: f.unitsPerPack, dailyDose: f.dailyDose, unitType: f.unitType },
    });
    written++;
  }
  console.log(`\nЗаписано: ${written}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
