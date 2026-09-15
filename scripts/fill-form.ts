/**
 * Заполнение Product.form / Product.formNote и Category.formGuide.
 *
 * Значения — не медицинские утверждения, а общеизвестные факты про сами
 * добавки (усвояемость формы, переносимость ЖКТ), без цифр и без «лечит».
 * Заполняется только там, где в категории реально есть разные формы одного
 * вещества — иначе поле остаётся пустым.
 *
 *   npx tsx scripts/fill-form.ts          — только таблица, базу не трогает
 *   npx tsx scripts/fill-form.ts --apply  — записать
 *
 * Не перезаписывает то, что уже заполнено вручную в админке.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

/**
 * Каждая запись проверена по странице товара на сайте бренда (source) —
 * не по памяти и не по названию SKU. Четыре позиции из первого черновика
 * убраны: реальный состав бренда найти не удалось (см. отчёт в чате) —
 * пустое поле лучше уверенной ошибки.
 */
const PRODUCT_FORM: Record<string, { form: string; formNote: string; source: string }> = {
  // Магний — три формы, разница в цене за мг реальная и заметная
  "now-magnesium-citrate-200": {
    form: "Цитрат",
    formNote: "Хорошо усваивается и стоит недорого — обычный выбор для ежедневного приёма.",
    source: "https://www.nowfoods.com/products/supplements/magnesium-citrate-200-mg-tablets",
  },
  "solaray-magnesium-glycinate-120": {
    form: "Глицинат (бисглицинат)",
    formNote: "Мягче действует на желудок, чем другие формы — стоит выбрать при чувствительном ЖКТ.",
    source: "https://solaray.com/products/magnesium-glycinate",
  },
  "life-extension-magnesium-100": {
    form: "Смесь форм (оксид, цитрат, сукцинат)",
    formNote:
      "В составе есть оксид магния — самая дешёвая и хуже усваиваемая форма, у неё низкая биодоступность. " +
      "Смесь с цитратом и сукцинатом частично это компенсирует, но «равномерное усвоение» было бы преувеличением.",
    source: "https://www.lifeextension.com/vitamins-supplements/item01459/magnesium-caps",
  },

  // Цинк
  "now-zinc-picolinate-50-120": {
    form: "Пиколинат",
    formNote: "Форма, которую часто выбирают за усвояемость.",
    source: "https://www.nowfoods.com/products/supplements/zinc-picolinate-50-mg-veg-capsules",
  },
  "jarrow-zinc-balance-100": {
    form: "Монометионин + медь",
    formNote: "С медью: при длительном приёме цинк снижает её усвоение, здесь это уже учтено.",
    source: "https://jarrow.com/products/zinc-balance-100-veggie-caps",
  },

  // Железо
  "now-iron-18-120": {
    form: "Бисглицинат (Ferrochel)",
    formNote: "Хелатная форма — переносится мягче классических солей железа.",
    source: "https://www.nowfoods.com/products/supplements/iron-18-mg-veg-capsules",
  },
  // solaray-iron-complex-90 — не нашёл на сайте Solaray точную SKU с этим
  // составом (90 капс, бисглицинат + вит. C); форма не заполнена.

  // Йод — источник и стабильность дозы отличаются
  "now-kelp-150-200": {
    form: "Из водорослей (келп)",
    formNote: "Природный источник; содержание йода в водорослях колеблется, доза не так точна, как у концентрированных форм.",
    source: "https://www.nowfoods.com/products/supplements/kelp-150-mcg-tablets",
  },
  // solaray-iodine-caps-200 ("Йод из водорослей 325 мкг") — на solaray.com
  // реальный йодный товар бренда другой (Kelp Seaweed 550 мг с фолиевой
  // кислотой, другая дозировка). Похоже, в каталоге вымышленная SKU —
  // форма не заполнена, см. отчёт.
  "life-extension-sea-iodine-60": {
    form: "Смесь бурых водорослей и фукуса + йодид калия",
    formNote: "Смешанный источник, самая высокая дозировка в линейке — близко к верхнему безопасному пределу.",
    source: "https://www.lifeextension.com/vitamins-supplements/item01740/sea-iodine",
  },

  // Коллаген — формат приёма, не химия
  // now-collagen-peptides-16oz — при аудите duration_days (см. чат)
  // выяснилось, что реальный NOW "Collagen Peptides Powder" продаётся
  // только в 227 г; 454 г есть лишь у другого товара бренда с другим
  // составом ("Multi Collagen Protein"). Похоже на то же несовпадение
  // SKU, что и ниже у Solaray — форма не заполняется, пока не проверят
  // по этикетке на складе.
  // solaray-collagen-complex-90 — на solaray.com нет коллагена в формате
  // «1000 мг гидролизованного + 60 мг вит. C, 90 капс»: у бренда Collagen
  // Bone Complete и Collagen Keratin — другой состав. Форма не заполнена.

  // Омега-3 — состав и концентрация
  "now-omega-3-1000-200": {
    form: "Рыбий жир, ЭПК + ДГК",
    formNote: "180 мг ЭПК + 120 мг ДГК на капсулу — стандартное соотношение.",
    source: "https://www.nowfoods.com/products/supplements/omega-3-1000-mg-softgels",
  },
  // solaray-omega-3-120 ("Тройная сила") и jarrow-max-omega-60 — НЕ нашёл
  // этих продуктов в реальных линейках Solaray и Jarrow (у Jarrow нет
  // рыбий жир+бораго+лён комбо вообще, у Solaray омега-линейка — Super
  // Omega 3-7-9 на лососёвом масле, другой состав). Форма не заполнена
  // для обоих, см. отчёт — возможно, сами SKU в каталоге нужно проверить.

  // B-комплекс — активная форма фолата
  "jarrow-methylfolate-400-60": {
    form: "Метилфолат (активная форма B9)",
    formNote: "Готовая к усвоению форма — в отличие от фолиевой кислоты, не требует превращения в организме.",
    source: "https://jarrow.com/products/methyl-folate-400-mcg-60-veggie-caps",
  },

  // Спорт
  "jarrow-creatine-monohydrate-500g": {
    form: "Моногидрат",
    formNote: "Самая изученная и доступная форма креатина.",
    source: "https://www.priceplow.com/jarrow-formulas/creatine-monohydrate",
  },
};

const CATEGORY_GUIDE: Record<string, string> = {
  magnesium:
    "Магний бывает в разных формах: цитрат — доступный и хорошо изученный вариант для повседневного восполнения; глицинат мягче для желудка — стоит выбрать при чувствительном ЖКТ. В смесях форм проверяйте состав: если среди них есть оксид магния, это самая дешёвая и хуже усваиваемая форма, а не преимущество.",
  zinc:
    "Пиколинат цинка часто выбирают за усвояемость. Вариант с монометионином и медью подходит для длительного приёма: медь компенсирует то, что цинк со временем вытесняет её усвоение.",
  iron:
    "Глицинат и бисглицинат железа — хелатные формы, которые обычно переносятся мягче классических солей железа. Витамин C в составе помогает усвоению.",
  iodine:
    "Йод из водорослей — природный источник, но его содержание в сырье колеблется, поэтому точная доза не так стабильна, как у более концентрированных форм. Выбирайте дозировку исходя из того, сколько йода вам нужно.",
  collagen:
    "Порошок удобен для больших порций и разбавления в напитках без вкуса. Капсулы компактнее для приёма вне дома, но обычно дают меньшую дозу за приём.",
  "omega-3":
    "Продукты отличаются концентрацией ЭПК и ДГК на капсулу — чем она выше, тем меньше капсул нужно в день.",
  "b-complex":
    "Метилфолат — уже активная форма витамина B9, готовая к использованию организмом, в отличие от обычной фолиевой кислоты, которую сначала нужно преобразовать.",
};

async function main() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  const categories = await prisma.category.findMany();
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  const productRows: { slug: string; name: string; form: string; formNote: string }[] = [];
  const productSkipped: string[] = [];
  for (const p of products) {
    const draft = PRODUCT_FORM[p.slug];
    if (!draft) continue;
    if (p.form || p.formNote) {
      productSkipped.push(p.name);
      continue;
    }
    productRows.push({ slug: p.slug, name: p.name, ...draft });
  }

  const guideRows: { slug: string; name: string; text: string }[] = [];
  const guideSkipped: string[] = [];
  for (const [slug, text] of Object.entries(CATEGORY_GUIDE)) {
    const cat = catBySlug.get(slug);
    if (!cat) continue;
    if (cat.formGuide) {
      guideSkipped.push(cat.name);
      continue;
    }
    guideRows.push({ slug, name: cat.name, text });
  }

  console.log(`\nФОРМА ВЕЩЕСТВА, товары (${productRows.length}):`);
  for (const r of productRows) {
    console.log(`  ${r.name}`);
    console.log(`    форма: ${r.form}`);
    console.log(`    почему: ${r.formNote}`);
  }
  if (productSkipped.length) {
    console.log(`\n  Уже заполнены вручную, не трогаем: ${productSkipped.join(", ")}`);
  }

  console.log(`\n«КАКАЯ ФОРМА ДЛЯ ЧЕГО», категории (${guideRows.length}):`);
  for (const r of guideRows) {
    console.log(`  ${r.name}:`);
    console.log(`    ${r.text}`);
  }
  if (guideSkipped.length) {
    console.log(`\n  Уже заполнены вручную, не трогаем: ${guideSkipped.join(", ")}`);
  }

  if (!apply) {
    console.log("\nБаза не изменена. Чтобы записать: npx tsx scripts/fill-form.ts --apply");
    return;
  }

  for (const r of productRows) {
    await prisma.product.update({ where: { slug: r.slug }, data: { form: r.form, formNote: r.formNote } });
  }
  for (const r of guideRows) {
    await prisma.category.update({ where: { slug: r.slug }, data: { formGuide: r.text } });
  }
  console.log(`\nЗаписано: ${productRows.length} товаров, ${guideRows.length} категорий.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
