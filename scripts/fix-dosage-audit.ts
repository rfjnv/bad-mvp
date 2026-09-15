/**
 * Аудит нестандартных позиций (порошки/жидкости/диапазоны доз) — проверка
 * по официальным страницам брендов, не по памяти. Правит и публичный
 * текст dosage (это видят покупатели), и unitsPerPack/dailyDose/unitType
 * (это считает "хватит на N дней").
 *
 *   npx tsx scripts/fix-dosage-audit.ts          — только таблица
 *   npx tsx scripts/fix-dosage-audit.ts --apply  — записать
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

interface Fix {
  dosage?: string;
  unitsPerPack?: number;
  dailyDose?: number;
  unitType?: "GRAM" | "ML" | "CAPSULE";
  reason: string;
  source: string;
}

const FIXES: Record<string, Fix> = {
  "jarrow-creatine-monohydrate-500g": {
    dosage: "6 г (1 мерная ложка) в день, растворить в жидкости.",
    dailyDose: 6,
    unitType: "GRAM",
    reason: 'Было "5 г в день" — на этикетке реального товара порция 6 г (Creapure Creatine Monohydrate).',
    source: "https://www.myfooddiary.com/foods/7353737/jarrow-formulas-creatine-monohydrate-powder",
  },
  "life-extension-inositol-1000-360": {
    dosage: "По 1 капсуле в день во время еды.",
    dailyDose: 1,
    unitType: "CAPSULE",
    reason:
      'Было "1–2 раза в день" — на официальной странице Life Extension указана фиксированная доза: ' +
      '"Take one (1) capsule with food". Диапазона на этикетке нет.',
    source: "https://www.lifeextension.com/vitamins-supplements/item01674/inositol-caps",
  },
  "now-omega-3-1000-200": {
    dosage: "По 2 капсулы в день во время еды.",
    reason:
      'Текст был "1–2 капсулы" — на официальной странице NOW для этой формулы (180 EPA/120 DHA) ' +
      'указана фиксированная доза "Take 2 NOW Omega-3 1,000 mg softgels a day". Число дней не меняется ' +
      '(дневная доза уже считалась как 2), меняется только текст — чтобы не обещать диапазон, которого нет.',
    source: "https://www.amazon.com/NOW-Supplements-Molecularly-Distilled-Cardiovascular/dp/B001GCU6KA",
  },
  "now-chlorophyll-liquid-473": {
    dosage: "По 5 мл (1 чайная ложка) в день, разбавить водой.",
    dailyDose: 5,
    unitType: "ML",
    reason:
      'ВАЖНО: было "15 мл в день" — втрое больше реальной порции. На этикетке NOW Liquid Chlorophyll: ' +
      '"1 Teaspoon (5 mL) daily". Это не только меняет длительность банки (31 → 94 дня), но и означало ' +
      'неверную инструкцию покупателю — 12 мг меди в день вместо 4 мг на реальной порции.',
    source: "https://www.iherb.com/pr/now-foods-liquid-chlorophyll-mint-16-fl-oz-473-ml/5028",
  },
};

// Не нашёл достаточно источника — оставляю null, не гадаю:
const CLEAR: Record<string, string> = {
  "now-collagen-peptides-16oz":
    'Товар в каталоге — "454 г", но реальный NOW "Collagen Peptides Powder" (без добавок) продаётся ' +
    'только в 227 г; 454 г есть только у другого товара бренда — "Multi Collagen Protein Types I,II,III" ' +
    '(другой состав). Похоже на несовпадение SKU, как и в Задаче 3. Снимаю unitsPerPack/dailyDose/unitType ' +
    "до проверки по этикетке на складе — сейчас они посчитаны по неподтверждённым данным.",
};

async function main() {
  const products = await prisma.product.findMany({
    where: { slug: { in: [...Object.keys(FIXES), ...Object.keys(CLEAR)] } },
  });

  console.log("ИСПРАВЛЕНИЯ (по подтверждённым этикеткам):\n");
  for (const p of products) {
    const fix = FIXES[p.slug];
    if (!fix) continue;
    console.log(`${p.name} [${p.slug}]`);
    if (fix.dosage && fix.dosage !== p.dosage) console.log(`  dosage: "${p.dosage}" → "${fix.dosage}"`);
    if (fix.dailyDose !== undefined && fix.dailyDose !== p.dailyDose) console.log(`  dailyDose: ${p.dailyDose} → ${fix.dailyDose}`);
    console.log(`  причина: ${fix.reason}`);
    console.log(`  источник: ${fix.source}\n`);
  }

  console.log("ОЧИСТКА (источника недостаточно, снимаю посчитанное ранее):\n");
  for (const p of products) {
    const reason = CLEAR[p.slug];
    if (!reason) continue;
    console.log(`${p.name} [${p.slug}]`);
    console.log(`  unitsPerPack/dailyDose/unitType: ${p.unitsPerPack}/${p.dailyDose}/${p.unitType} → null`);
    console.log(`  причина: ${reason}\n`);
  }

  if (!apply) {
    console.log("База не изменена. Чтобы записать: npx tsx scripts/fix-dosage-audit.ts --apply");
    return;
  }

  for (const [slug, fix] of Object.entries(FIXES)) {
    await prisma.product.update({
      where: { slug },
      data: {
        ...(fix.dosage ? { dosage: fix.dosage } : {}),
        ...(fix.dailyDose !== undefined ? { dailyDose: fix.dailyDose } : {}),
        ...(fix.unitType ? { unitType: fix.unitType } : {}),
      },
    });
  }
  for (const slug of Object.keys(CLEAR)) {
    await prisma.product.update({
      where: { slug },
      data: { unitsPerPack: null, dailyDose: null, unitType: null },
    });
  }
  console.log(`Записано: ${Object.keys(FIXES).length} исправлений, ${Object.keys(CLEAR).length} очисток.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
