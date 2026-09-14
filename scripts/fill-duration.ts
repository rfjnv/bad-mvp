/**
 * Одноразовое заполнение unitsPerPack / unitType / dailyDose для существующих
 * товаров — из названия («…, 200 капс») и способа применения («По 2 капсулы
 * в день»).
 *
 *   npx tsx scripts/fill-duration.ts          — только таблица, базу не трогает
 *   npx tsx scripts/fill-duration.ts --apply  — записать распознанное
 *
 * Что намеренно НЕ распознаётся и уходит в список на ручное заполнение:
 *   • диапазоны («По 1–2 капсулы») — нельзя выбрать дозу за покупателя;
 *   • порошки в граммах (протеин, креатин) — доза в мерных ложках, из текста
 *     не следует;
 *   • всё, где единица в названии не совпадает с единицей в дозировке.
 * Товары, у которых поля уже заполнены, скрипт не перезаписывает.
 */
import { PrismaClient, UnitType } from "@prisma/client";
import { computeDuration } from "../src/lib/duration";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

interface Parsed {
  unitsPerPack: number;
  unitType: UnitType;
  dailyDose: number;
}

// \b в JS не считает кириллицу словом, поэтому границы задаём явно
const PACK_UNITS: [RegExp, UnitType][] = [
  [/(\d+)\s*(капс|капсул)/i, "CAPSULE"],
  [/(\d+)\s*(таб|таблет)/i, "TABLET"],
  [/(\d+)\s*мл(?![а-яё])/i, "ML"],
  [/(\d+)\s*г(?![а-яё])/i, "GRAM"],
];

const DOSE_UNITS: [RegExp, UnitType][] = [
  [/капсул/i, "CAPSULE"],
  [/таблет/i, "TABLET"],
  [/(?<![а-яё])мл(?![а-яё])/i, "ML"],
  [/(?<![а-яё])г(?![а-яё])|грамм/i, "GRAM"],
  [/мерн/i, "SCOOP"],
];

function parsePack(name: string): { units: number; type: UnitType } | null {
  for (const [re, type] of PACK_UNITS) {
    const m = name.match(re);
    if (m) return { units: Number(m[1]), type };
  }
  return null;
}

/** «По 2 капсулы в день», «По 3 капсулы 2 раза в день», «По 15 мл в день» */
function parseDose(dosage: string): { perDay: number; type: UnitType } | { unparsed: string } {
  if (/\d\s*[–-]\s*\d/.test(dosage)) return { unparsed: "диапазон дозы" };

  const per = dosage.match(/по\s+(\d+(?:[.,]\d+)?)\s*([а-яё.]+)/i);
  if (!per) return { unparsed: "не найдено «По N …»" };
  const amount = Number(per[1].replace(",", "."));

  let type: UnitType | null = null;
  for (const [re, t] of DOSE_UNITS) {
    if (re.test(per[2]) || re.test(dosage.slice(per.index!, per.index! + 40))) {
      type = t;
      break;
    }
  }
  if (!type) return { unparsed: "единица дозы не распознана" };

  const times = dosage.match(/(\d+)\s*раз/i);
  const perDay = amount * (times ? Number(times[1]) : 1);
  return { perDay, type };
}

async function main() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  const ok: { slug: string; name: string; parsed: Parsed; days: number }[] = [];
  const skipped: { slug: string; name: string; reason: string }[] = [];
  const already: string[] = [];

  for (const p of products) {
    if (p.unitsPerPack && p.dailyDose && p.unitType) {
      already.push(p.slug);
      continue;
    }
    const pack = parsePack(p.name);
    if (!pack) {
      skipped.push({ slug: p.slug, name: p.name, reason: "фасовка не найдена в названии" });
      continue;
    }
    // Порошки: доза в ложках, из текста не следует — только вручную
    if (pack.type === "GRAM") {
      skipped.push({ slug: p.slug, name: p.name, reason: "порошок в граммах — доза вручную" });
      continue;
    }
    const dose = parseDose(p.dosage);
    if ("unparsed" in dose) {
      skipped.push({ slug: p.slug, name: p.name, reason: dose.unparsed });
      continue;
    }
    if (dose.type !== pack.type) {
      skipped.push({
        slug: p.slug,
        name: p.name,
        reason: `единица упаковки (${pack.type}) ≠ единице дозы (${dose.type})`,
      });
      continue;
    }
    const parsed: Parsed = { unitsPerPack: pack.units, unitType: pack.type, dailyDose: dose.perDay };
    const d = computeDuration({ ...parsed, price: p.price });
    if (!d) {
      skipped.push({ slug: p.slug, name: p.name, reason: "длительность не считается" });
      continue;
    }
    ok.push({ slug: p.slug, name: p.name, parsed, days: d.days });
  }

  console.log(`\nРАСПОЗНАНО (${ok.length}):`);
  console.log("  " + "Товар".padEnd(46) + "Упак.".padStart(8) + "  Ед.".padEnd(9) + "Доза/день".padStart(10) + "  Хватит");
  for (const r of ok) {
    console.log(
      "  " +
        r.name.slice(0, 45).padEnd(46) +
        String(r.parsed.unitsPerPack).padStart(8) +
        ("  " + r.parsed.unitType).padEnd(9) +
        String(r.parsed.dailyDose).padStart(10) +
        `  ${r.days} дн.`
    );
  }

  console.log(`\nВРУЧНУЮ В АДМИНКЕ (${skipped.length}):`);
  for (const s of skipped) console.log("  " + s.name.slice(0, 45).padEnd(46) + "— " + s.reason);

  if (already.length) console.log(`\nУЖЕ ЗАПОЛНЕНЫ, не трогаем: ${already.length}`);

  if (!apply) {
    console.log("\nБаза не изменена. Чтобы записать: npx tsx scripts/fill-duration.ts --apply");
    return;
  }

  for (const r of ok) {
    await prisma.product.update({ where: { slug: r.slug }, data: r.parsed });
  }
  console.log(`\nЗаписано: ${ok.length} товаров.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
