import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { slug: "vitamin-d", name: "Витамин D", sortOrder: 1 },
  { slug: "omega-3", name: "Омега-3", sortOrder: 2 },
  { slug: "magnesium", name: "Магний", sortOrder: 3 },
  { slug: "zinc", name: "Цинк", sortOrder: 4 },
  { slug: "collagen", name: "Коллаген", sortOrder: 5 },
  { slug: "probiotics", name: "Пробиотики", sortOrder: 6 },
  { slug: "b-complex", name: "В-комплекс", sortOrder: 7 },
  { slug: "iron", name: "Железо", sortOrder: 8 },
  { slug: "sport", name: "Спортивное питание", sortOrder: 9 },
  { slug: "immunity", name: "Для иммунитета", sortOrder: 10 },
] as const;

interface SeedProduct {
  slug: string;
  name: string;
  brand: string;
  category: (typeof categories)[number]["slug"];
  price: number;
  oldPrice?: number;
  stock: number;
  description: string;
  composition: string;
  dosage: string;
  imageUrl?: string;
  sesCertNumber?: string;
  sesCertFileUrl?: string;
  sesCertIssuedAt?: string;
  sesCertExpiresAt?: string;
  conformityCertNumber?: string;
  conformityCertFileUrl?: string;
  conformityCertIssuedAt?: string;
  conformityCertExpiresAt?: string;
  activeSubstance?: string;
  activeAmount?: number;
  activeUnit?: string;
  servingsPerPackage?: number;
}

const products: SeedProduct[] = [
  // Витамин D
  {
    slug: "solaray-d3-k2-5000-120",
    name: "Solaray D3+K2 5000, 120 капс",
    brand: "Solaray",
    category: "vitamin-d",
    price: 498800,
    stock: 34,
    description: "Комплекс витамина D3 и K2 для здоровья костей и сердечно-сосудистой системы.",
    composition: "Витамин D3 (холекальциферол) 5000 МЕ, витамин K2 (менахинон-7) 100 мкг.",
    dosage: "По 1 капсуле в день во время еды, если не назначено иначе.",
    imageUrl: "/products/solaray-d3-k2-5000-120.png",
    sesCertNumber: "UZ.SES.03.001.Е.000412.08.26",
    sesCertFileUrl: "/certs/solaray-d3-k2-5000-120-ses.svg",
    sesCertIssuedAt: "2026-08-12",
    sesCertExpiresAt: "2027-08-12",
    conformityCertNumber: "UZ-СТ.02.01.00512",
    conformityCertFileUrl: "/certs/solaray-d3-k2-5000-120-conformity.svg",
    conformityCertIssuedAt: "2026-08-12",
    conformityCertExpiresAt: "2027-08-12",
    activeSubstance: "Витамин D3",
    activeAmount: 5000,
    activeUnit: "МЕ",
    servingsPerPackage: 120,
  },
  {
    slug: "now-d3-k2-5000-180",
    name: "NOW D3+K2 5000, 180 капс",
    brand: "NOW Foods",
    category: "vitamin-d",
    price: 285120,
    oldPrice: 310000,
    stock: 51,
    description: "Витамин D3 с витамином K2 для усвоения кальция.",
    composition: "Витамин D3 5000 МЕ, витамин K2 45 мкг на капсулу.",
    dosage: "По 1 капсуле в день во время еды.",
    imageUrl: "/products/now-d3-k2-5000-180.png",
    sesCertNumber: "UZ.SES.03.001.Е.000398.07.26",
    sesCertFileUrl: "/certs/now-d3-k2-5000-180-ses.svg",
    sesCertIssuedAt: "2026-07-03",
    sesCertExpiresAt: "2027-07-03",
    activeSubstance: "Витамин D3",
    activeAmount: 5000,
    activeUnit: "МЕ",
    servingsPerPackage: 180,
  },
  {
    slug: "now-vitamin-d3-2000-120",
    name: "NOW Витамин D3 2000 МЕ, 120 капс",
    brand: "NOW Foods",
    category: "vitamin-d",
    price: 168000,
    stock: 60,
    description: "Витамин D3 в удобной дозировке для ежедневного приёма.",
    composition: "Витамин D3 (холекальциферол) 2000 МЕ на капсулу.",
    dosage: "По 1 капсуле в день во время еды.",
    imageUrl: "/products/now-vitamin-d3-2000-120.png",
    activeSubstance: "Витамин D3",
    activeAmount: 2000,
    activeUnit: "МЕ",
    servingsPerPackage: 120,
  },
  // Омега-3
  {
    slug: "now-omega-3-1000-200",
    name: "NOW Омега-3, 1000 мг, 200 капс",
    brand: "NOW Foods",
    category: "omega-3",
    price: 245000,
    stock: 40,
    description: "Рыбий жир с ЭПК и ДГК для сердца, сосудов и мозга.",
    composition: "Рыбий жир 1000 мг (ЭПК 180 мг, ДГК 120 мг) на капсулу.",
    dosage: "По 1–2 капсулы в день во время еды.",
    imageUrl: "/products/now-omega-3-1000-200.png",
    sesCertNumber: "UZ.SES.03.001.Е.000377.06.26",
    sesCertFileUrl: "/certs/now-omega-3-1000-200-ses.svg",
    sesCertIssuedAt: "2025-06-18",
    sesCertExpiresAt: "2026-06-18",
    conformityCertNumber: "UZ-СТ.02.01.00498",
    activeSubstance: "Омега-3 (рыбий жир)",
    activeAmount: 1000,
    activeUnit: "мг",
    servingsPerPackage: 200,
  },
  {
    slug: "solaray-omega-3-120",
    name: "Solaray Омега-3 Тройная сила, 120 капс",
    brand: "Solaray",
    category: "omega-3",
    price: 356000,
    stock: 22,
    description: "Концентрированный рыбий жир повышенной силы действия.",
    composition: "Рыбий жир 1200 мг с высоким содержанием ЭПК и ДГК.",
    dosage: "По 1 капсуле в день во время еды.",
    imageUrl: "/products/solaray-omega-3-120.png",
    activeSubstance: "Омега-3 (рыбий жир)",
    activeAmount: 1200,
    activeUnit: "мг",
    servingsPerPackage: 120,
  },
  {
    slug: "jarrow-max-omega-60",
    name: "Jarrow Max Omega 3-6-9, 60 капс",
    brand: "Jarrow Formulas",
    category: "omega-3",
    price: 210000,
    stock: 0,
    description: "Сбалансированный комплекс жирных кислот Омега 3-6-9.",
    composition: "Рыбий жир, масло бораго, льняное масло.",
    dosage: "По 2 капсулы в день во время еды.",
    imageUrl: "/products/jarrow-max-omega-60.png",
  },
  // Магний
  {
    slug: "now-magnesium-citrate-200",
    name: "NOW Магний цитрат, 200 капс",
    brand: "NOW Foods",
    category: "magnesium",
    price: 175000,
    stock: 45,
    description: "Легкоусвояемая форма магния для мышц и нервной системы.",
    composition: "Магния цитрат 400 мг на 2 капсулы.",
    dosage: "По 2 капсулы в день во время еды.",
    imageUrl: "/products/now-magnesium-citrate-200.png",
    sesCertNumber: "UZ.SES.03.001.Е.000355.05.26",
    activeSubstance: "Магний (цитрат)",
    activeAmount: 200,
    activeUnit: "мг",
    servingsPerPackage: 200,
  },
  {
    slug: "solaray-magnesium-glycinate-120",
    name: "Solaray Магний глицинат, 120 капс",
    brand: "Solaray",
    category: "magnesium",
    price: 265000,
    stock: 18,
    description: "Хелатная форма магния с высокой биодоступностью, мягкая для ЖКТ.",
    composition: "Магния бисглицинат 200 мг на 2 капсулы.",
    dosage: "По 2 капсулы в день во время еды.",
    imageUrl: "/products/solaray-magnesium-glycinate-120.png",
    activeSubstance: "Магний (бисглицинат)",
    activeAmount: 100,
    activeUnit: "мг",
    servingsPerPackage: 120,
  },
  {
    slug: "life-extension-magnesium-100",
    name: "Life Extension Магний, 100 капс",
    brand: "Life Extension",
    category: "magnesium",
    price: 220000,
    stock: 27,
    description: "Комплексная формула магния из нескольких форм для лучшего усвоения.",
    composition: "Магний (цитрат, малат, сукцинат) 500 мг на 4 капсулы.",
    dosage: "По 4 капсулы в день во время еды.",
    imageUrl: "/products/life-extension-magnesium-100.png",
    activeSubstance: "Магний (комплекс форм)",
    activeAmount: 125,
    activeUnit: "мг",
    servingsPerPackage: 100,
  },
  // Цинк
  {
    slug: "now-zinc-picolinate-50-120",
    name: "NOW Цинк пиколинат 50 мг, 120 капс",
    brand: "NOW Foods",
    category: "zinc",
    price: 130200,
    stock: 58,
    description: "Цинк в форме пиколината для иммунитета и кожи.",
    composition: "Цинка пиколинат, эквивалент 50 мг цинка на капсулу.",
    dosage: "По 1 капсуле в день во время еды.",
    imageUrl: "/products/now-zinc-picolinate-50-120.png",
    sesCertNumber: "UZ.SES.03.001.Е.000340.04.26",
    conformityCertNumber: "UZ-СТ.02.01.00471",
    activeSubstance: "Цинк",
    activeAmount: 50,
    activeUnit: "мг",
    servingsPerPackage: 120,
  },
  {
    slug: "jarrow-zinc-balance-100",
    name: "Jarrow Zinc Balance, 100 капс",
    brand: "Jarrow Formulas",
    category: "zinc",
    price: 145000,
    stock: 33,
    description: "Сбалансированный комплекс цинка и меди.",
    composition: "Цинка монометионин 15 мг, медь 1 мг на капсулу.",
    dosage: "По 1 капсуле в день во время еды.",
    imageUrl: "/products/jarrow-zinc-balance-100.png",
    activeSubstance: "Цинк",
    activeAmount: 15,
    activeUnit: "мг",
    servingsPerPackage: 100,
  },
  // Коллаген
  {
    slug: "now-collagen-peptides-16oz",
    name: "NOW Коллаген пептиды, порошок 454 г",
    brand: "NOW Foods",
    category: "collagen",
    price: 385000,
    stock: 15,
    description: "Гидролизованный коллаген для кожи, суставов и связок.",
    composition: "Гидролизованный коллаген (говяжий) 10 г на порцию.",
    dosage: "1 мерная ложка (10 г) в день, растворить в жидкости.",
    imageUrl: "/products/now-collagen-peptides-16oz.png",
    sesCertNumber: "UZ.SES.03.001.Е.000321.03.26",
    activeSubstance: "Коллаген",
    activeAmount: 10,
    activeUnit: "г",
    servingsPerPackage: 45,
  },
  {
    slug: "solaray-collagen-complex-90",
    name: "Solaray Коллаген комплекс, 90 капс",
    brand: "Solaray",
    category: "collagen",
    price: 298000,
    oldPrice: 330000,
    stock: 12,
    description: "Коллаген с витамином C для синтеза собственного коллагена.",
    composition: "Гидролизованный коллаген 1000 мг, витамин C 60 мг на 3 капсулы.",
    dosage: "По 3 капсулы в день во время еды.",
    imageUrl: "/products/solaray-collagen-complex-90.png",
    activeSubstance: "Коллаген",
    activeAmount: 333,
    activeUnit: "мг",
    servingsPerPackage: 90,
  },
  // Пробиотики
  {
    slug: "jarrow-saccharomyces-boulardii-180",
    name: "Jarrow Сахаромицеты Буларди, 180 капс",
    brand: "Jarrow Formulas",
    category: "probiotics",
    price: 420000,
    stock: 20,
    description: "Пробиотические дрожжи для поддержки микрофлоры кишечника.",
    composition: "Saccharomyces boulardii 5 млрд КОЕ на капсулу.",
    dosage: "По 1 капсуле 1–2 раза в день.",
    imageUrl: "/products/jarrow-saccharomyces-boulardii-180.png",
    sesCertNumber: "UZ.SES.03.001.Е.000308.02.26",
    conformityCertNumber: "UZ-СТ.02.01.00449",
    activeSubstance: "Пробиотик (S. boulardii)",
    activeAmount: 5,
    activeUnit: "млрд КОЕ",
    servingsPerPackage: 180,
  },
  {
    slug: "now-probiotic-10-50",
    name: "NOW Пробиотик-10, 50 капс",
    brand: "NOW Foods",
    category: "probiotics",
    price: 310000,
    stock: 26,
    description: "Комплекс из 10 штаммов пробиотических бактерий.",
    composition: "10 штаммов бактерий, 25 млрд КОЕ на капсулу.",
    dosage: "По 1 капсуле в день натощак.",
    imageUrl: "/products/now-probiotic-10-50.png",
    activeSubstance: "Пробиотик (10 штаммов)",
    activeAmount: 25,
    activeUnit: "млрд КОЕ",
    servingsPerPackage: 50,
  },
  // В-комплекс
  {
    slug: "jarrow-methylfolate-400-60",
    name: "Jarrow Метилфолат 400 мкг, 60 капс",
    brand: "Jarrow Formulas",
    category: "b-complex",
    price: 138000,
    stock: 42,
    description: "Активная форма фолиевой кислоты (витамин B9).",
    composition: "5-метилтетрагидрофолат (метилфолат) 400 мкг на капсулу.",
    dosage: "По 1 капсуле в день во время еды.",
    imageUrl: "/products/jarrow-methylfolate-400-60.png",
    sesCertNumber: "UZ.SES.03.001.Е.000287.01.26",
    activeSubstance: "Фолат (B9)",
    activeAmount: 400,
    activeUnit: "мкг",
    servingsPerPackage: 60,
  },
  {
    slug: "life-extension-b-complex-1-60",
    name: "Life Extension B-комплекс №1, 60 капс",
    brand: "Life Extension",
    category: "b-complex",
    price: 110000,
    stock: 37,
    description: "Полный комплекс витаминов группы B для энергии и нервной системы.",
    composition: "Витамины B1, B2, B3, B5, B6, B12, фолиевая кислота, биотин.",
    dosage: "По 1 капсуле в день во время еды.",
    imageUrl: "/products/life-extension-b-complex-1-60.png",
  },
  {
    slug: "life-extension-inositol-1000-360",
    name: "Life Extension Инозитол 1000 мг, 360 капс",
    brand: "Life Extension",
    category: "b-complex",
    price: 470000,
    stock: 9,
    description: "Инозитол (витамин B8) для нервной системы и обмена веществ.",
    composition: "Инозитол 1000 мг на капсулу.",
    dosage: "По 1 капсуле 1–2 раза в день во время еды.",
    imageUrl: "/products/life-extension-inositol-1000-360.png",
    activeSubstance: "Инозитол (B8)",
    activeAmount: 1000,
    activeUnit: "мг",
    servingsPerPackage: 360,
  },
  // Железо
  {
    slug: "now-iron-18-120",
    name: "NOW Железо 18 мг, 120 капс",
    brand: "NOW Foods",
    category: "iron",
    price: 95000,
    stock: 48,
    description: "Железо в лёгкой для усвоения форме для профилактики дефицита.",
    composition: "Железо (глицинат) 18 мг на капсулу.",
    dosage: "По 1 капсуле в день во время еды.",
    imageUrl: "/products/now-iron-18-120.png",
    sesCertNumber: "UZ.SES.03.001.Е.000265.12.25",
    activeSubstance: "Железо",
    activeAmount: 18,
    activeUnit: "мг",
    servingsPerPackage: 120,
  },
  {
    slug: "solaray-iron-complex-90",
    name: "Solaray Железо комплекс, 90 капс",
    brand: "Solaray",
    category: "iron",
    price: 128000,
    stock: 31,
    description: "Железо с витамином C и фолиевой кислотой для лучшего усвоения.",
    composition: "Железа бисглицинат 25 мг, витамин C, фолиевая кислота.",
    dosage: "По 1 капсуле в день во время еды.",
    imageUrl: "/products/solaray-iron-complex-90.png",
    activeSubstance: "Железо",
    activeAmount: 25,
    activeUnit: "мг",
    servingsPerPackage: 90,
  },
  // Спортивное питание
  {
    slug: "now-whey-protein-2lb",
    name: "NOW Сывороточный протеин, 907 г",
    brand: "NOW Foods",
    category: "sport",
    price: 420000,
    stock: 24,
    description: "Сывороточный протеин для набора и восстановления мышечной массы.",
    composition: "Концентрат сывороточного белка, 24 г белка на порцию.",
    dosage: "1–2 мерные ложки после тренировки, растворить в воде или молоке.",
    imageUrl: "/products/now-whey-protein-2lb.png",
    sesCertNumber: "UZ.SES.03.001.Е.000244.11.25",
    conformityCertNumber: "UZ-СТ.02.01.00420",
    activeSubstance: "Белок",
    activeAmount: 24,
    activeUnit: "г",
    servingsPerPackage: 30,
  },
  {
    slug: "now-bcaa-120",
    name: "NOW BCAA 1000, 120 капс",
    brand: "NOW Foods",
    category: "sport",
    price: 265000,
    stock: 19,
    description: "Аминокислоты с разветвлёнными цепями для восстановления мышц.",
    composition: "Лейцин, изолейцин, валин в соотношении 2:1:1.",
    dosage: "По 3 капсулы 2 раза в день.",
    imageUrl: "/products/now-bcaa-120.png",
  },
  {
    slug: "jarrow-creatine-monohydrate-500g",
    name: "Jarrow Креатин моногидрат, 500 г",
    brand: "Jarrow Formulas",
    category: "sport",
    price: 195000,
    stock: 0,
    description: "Чистый креатин моногидрат для роста силы и мышечной массы.",
    composition: "Креатин моногидрат 100%, 5 г на порцию.",
    dosage: "5 г в день, растворить в жидкости.",
    imageUrl: "/products/jarrow-creatine-monohydrate-500g.png",
    activeSubstance: "Креатин",
    activeAmount: 5,
    activeUnit: "г",
    servingsPerPackage: 100,
  },
  // Для иммунитета
  {
    slug: "now-chlorophyll-liquid-473",
    name: "NOW Хлорофилл жидкий, 473 мл",
    brand: "NOW Foods",
    category: "immunity",
    price: 240000,
    stock: 16,
    description: "Жидкий хлорофилл для общего тонуса и поддержки организма.",
    composition: "Хлорофиллин меди натрия, 100 мг на 15 мл.",
    dosage: "По 15 мл в день, разбавить водой.",
    imageUrl: "/products/now-chlorophyll-liquid-473.png",
    sesCertNumber: "UZ.SES.03.001.Е.000229.10.25",
    activeSubstance: "Хлорофилл",
    activeAmount: 100,
    activeUnit: "мг",
    servingsPerPackage: 31,
  },
  {
    slug: "now-vitamin-c-1000-250",
    name: "NOW Витамин C 1000 мг, 250 таб",
    brand: "NOW Foods",
    category: "immunity",
    price: 158000,
    stock: 55,
    description: "Витамин C для поддержки иммунитета.",
    composition: "Аскорбиновая кислота 1000 мг на таблетку.",
    dosage: "По 1 таблетке в день во время еды.",
    imageUrl: "/products/now-vitamin-c-1000-250.png",
    activeSubstance: "Витамин C",
    activeAmount: 1000,
    activeUnit: "мг",
    servingsPerPackage: 250,
  },
  {
    slug: "solaray-elderberry-complex-60",
    name: "Solaray Бузина комплекс, 60 капс",
    brand: "Solaray",
    category: "immunity",
    price: 215000,
    oldPrice: 240000,
    stock: 21,
    description: "Экстракт бузины с цинком и витамином C для сезонной поддержки иммунитета.",
    composition: "Экстракт чёрной бузины 500 мг, цинк, витамин C.",
    dosage: "По 1 капсуле в день во время еды.",
    imageUrl: "/products/solaray-elderberry-complex-60.png",
    activeSubstance: "Экстракт бузины",
    activeAmount: 500,
    activeUnit: "мг",
    servingsPerPackage: 60,
  },
  {
    slug: "jarrow-echinacea-immune-60",
    name: "Jarrow Эхинацея Иммун, 60 капс",
    brand: "Jarrow Formulas",
    category: "immunity",
    price: 175000,
    stock: 29,
    description: "Экстракт эхинацеи для поддержки естественного иммунного ответа.",
    composition: "Экстракт эхинацеи пурпурной 400 мг на капсулу.",
    dosage: "По 1 капсуле 2 раза в день.",
    imageUrl: "/products/jarrow-echinacea-immune-60.png",
    activeSubstance: "Экстракт эхинацеи",
    activeAmount: 400,
    activeUnit: "мг",
    servingsPerPackage: 60,
  },
];

const orderSeeds = [
  {
    customerName: "Азиз Каримов",
    customerPhone: "+998901234567",
    customerAddress: "Ташкент, Юнусабадский р-н, ул. Амира Темура 45, кв. 12",
    status: "DELIVERED" as const,
    paymentMethod: "CASH" as const,
    paymentStatus: "PAID" as const,
    items: [
      { slug: "solaray-d3-k2-5000-120", quantity: 1 },
      { slug: "now-magnesium-citrate-200", quantity: 2 },
    ],
  },
  {
    customerName: "Дилноза Юсупова",
    customerPhone: "+998933456789",
    customerAddress: "Ташкент, Мирзо-Улугбекский р-н, ул. Буюк Ипак Йули 12",
    status: "DELIVERED" as const,
    paymentMethod: "PAYME" as const,
    paymentStatus: "PAID" as const,
    items: [{ slug: "now-collagen-peptides-16oz", quantity: 1 }],
  },
  {
    customerName: "Фаррух Тошматов",
    customerPhone: "+998971112233",
    customerAddress: "Самарканд, ул. Регистан 8",
    status: "SHIPPED" as const,
    paymentMethod: "CLICK" as const,
    paymentStatus: "PAID" as const,
    items: [
      { slug: "now-zinc-picolinate-50-120", quantity: 1 },
      { slug: "now-vitamin-c-1000-250", quantity: 1 },
    ],
  },
  {
    customerName: "Мадина Абдуллаева",
    customerPhone: "+998909998877",
    customerAddress: "Ташкент, Чиланзарский р-н, кв. 19, дом 4",
    status: "CONFIRMED" as const,
    paymentMethod: "CASH" as const,
    paymentStatus: "PENDING" as const,
    items: [{ slug: "jarrow-methylfolate-400-60", quantity: 2 }],
  },
  {
    customerName: "Бахтиёр Исмоилов",
    customerPhone: "+998935556677",
    customerAddress: "Бухара, ул. Наводкор 3",
    status: "NEW" as const,
    paymentMethod: "PAYME" as const,
    paymentStatus: "PENDING" as const,
    items: [{ slug: "now-whey-protein-2lb", quantity: 1 }],
  },
  {
    customerName: "Нилуфар Раджабова",
    customerPhone: "+998977778899",
    customerAddress: "Ташкент, Яккасарайский р-н, ул. Богишамол 22",
    status: "NEW" as const,
    paymentMethod: "CASH" as const,
    paymentStatus: "PENDING" as const,
    items: [
      { slug: "jarrow-saccharomyces-boulardii-180", quantity: 1 },
      { slug: "solaray-magnesium-glycinate-120", quantity: 1 },
    ],
  },
  {
    customerName: "Отабек Юлдашев",
    customerPhone: "+998991230045",
    customerAddress: "Ташкент, Сергелийский р-н, массив Себзор 14",
    status: "CANCELLED" as const,
    paymentMethod: "CLICK" as const,
    paymentStatus: "FAILED" as const,
    items: [{ slug: "now-d3-k2-5000-180", quantity: 1 }],
  },
  {
    customerName: "Севара Носирова",
    customerPhone: "+998912223344",
    customerAddress: "Фергана, ул. Мустакиллик 56",
    status: "DELIVERED" as const,
    paymentMethod: "CASH" as const,
    paymentStatus: "PAID" as const,
    items: [
      { slug: "now-omega-3-1000-200", quantity: 1 },
      { slug: "now-iron-18-120", quantity: 1 },
      { slug: "life-extension-b-complex-1-60", quantity: 1 },
    ],
  },
  {
    customerName: "Жасур Рахимов",
    customerPhone: "+998945671122",
    customerAddress: "Ташкент, Мирабадский р-н, ул. Шахрисабз 9",
    status: "SHIPPED" as const,
    paymentMethod: "PAYME" as const,
    paymentStatus: "PAID" as const,
    items: [{ slug: "solaray-elderberry-complex-60", quantity: 2 }],
  },
];

const banners = [
  {
    title: "Осенняя поддержка иммунитета",
    subtitle: "Витамин C, эхинацея и бузина — в наличии с доставкой по Ташкенту",
    imageUrl: "/banners/immunity.png",
    linkUrl: "/catalog?category=immunity",
    sortOrder: 1,
  },
  {
    title: "Витамин D для узбекского климата",
    subtitle: "D3+K2 от Solaray и NOW Foods — разбор дозировок на карточке товара",
    imageUrl: "/banners/vitamin-d.png",
    linkUrl: "/catalog?category=vitamin-d",
    sortOrder: 2,
  },
  {
    title: "Скидки на выбранные позиции",
    subtitle: "До 15% на коллаген и комплексы с бузиной, пока есть на складе",
    imageUrl: "/banners/sale.png",
    linkUrl: "/catalog?sort=price_asc",
    sortOrder: 3,
  },
];

const bundles = [
  {
    slug: "immunity-kit",
    name: "Комплект для иммунитета",
    description: "Витамин C, эхинацея и бузина — базовый набор для сезонной поддержки организма.",
    discountPct: 12,
    imageUrl: "/bundles/immunity-kit.png",
    sortOrder: 1,
    productSlugs: ["now-vitamin-c-1000-250", "jarrow-echinacea-immune-60", "solaray-elderberry-complex-60"],
  },
  {
    slug: "energy-minerals-kit",
    name: "Комплект «Энергия и минералы»",
    description: "Витамин D3, магний и фолат — база для тонуса и нервной системы, хорошо сочетаются между собой.",
    discountPct: 15,
    imageUrl: "/bundles/energy-minerals-kit.png",
    sortOrder: 2,
    productSlugs: ["now-vitamin-d3-2000-120", "now-magnesium-citrate-200", "jarrow-methylfolate-400-60"],
  },
  {
    slug: "skin-joints-kit",
    name: "Комплект для кожи и суставов",
    description: "Коллаген и омега-3 — то, что чаще всего берут вместе для кожи, волос и подвижности суставов.",
    discountPct: 10,
    imageUrl: "/bundles/skin-joints-kit.png",
    sortOrder: 3,
    productSlugs: ["now-collagen-peptides-16oz", "now-omega-3-1000-200"],
  },
];

async function main() {
  console.log("Создаём баннеры...");
  for (const b of banners) {
    const exists = await prisma.banner.findFirst({ where: { title: b.title } });
    if (exists) {
      await prisma.banner.update({ where: { id: exists.id }, data: b });
    } else {
      await prisma.banner.create({ data: b });
    }
  }

  console.log("Создаём категории...");
  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name, sortOrder: c.sortOrder },
    });
    categoryMap.set(c.slug, created.id);
  }

  console.log("Создаём товары...");
  const productIdBySlug = new Map<string, string>();
  for (const p of products) {
    const data = {
      name: p.name,
      brand: p.brand,
      categoryId: categoryMap.get(p.category)!,
      description: p.description,
      composition: p.composition,
      dosage: p.dosage,
      price: p.price,
      oldPrice: p.oldPrice ?? null,
      stock: p.stock,
      imageUrl: p.imageUrl ?? `/products/${p.category}.svg`,
      sesCertNumber: p.sesCertNumber ?? null,
      sesCertFileUrl: p.sesCertFileUrl ?? null,
      sesCertIssuedAt: p.sesCertIssuedAt ? new Date(p.sesCertIssuedAt) : null,
      sesCertExpiresAt: p.sesCertExpiresAt ? new Date(p.sesCertExpiresAt) : null,
      conformityCertNumber: p.conformityCertNumber ?? null,
      conformityCertFileUrl: p.conformityCertFileUrl ?? null,
      conformityCertIssuedAt: p.conformityCertIssuedAt ? new Date(p.conformityCertIssuedAt) : null,
      conformityCertExpiresAt: p.conformityCertExpiresAt ? new Date(p.conformityCertExpiresAt) : null,
      activeSubstance: p.activeSubstance ?? null,
      activeAmount: p.activeAmount ?? null,
      activeUnit: p.activeUnit ?? null,
      servingsPerPackage: p.servingsPerPackage ?? null,
    };
    const created = await prisma.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data },
      update: data,
    });
    productIdBySlug.set(p.slug, created.id);
  }

  console.log("Создаём наборы...");
  for (const b of bundles) {
    const productIds = b.productSlugs.map((slug) => productIdBySlug.get(slug)!);
    const existing = await prisma.bundle.findUnique({ where: { slug: b.slug } });
    if (existing) {
      await prisma.bundleItem.deleteMany({ where: { bundleId: existing.id } });
      await prisma.bundle.update({
        where: { id: existing.id },
        data: {
          name: b.name,
          description: b.description,
          discountPct: b.discountPct,
          imageUrl: b.imageUrl,
          sortOrder: b.sortOrder,
          items: { create: productIds.map((productId) => ({ productId })) },
        },
      });
    } else {
      await prisma.bundle.create({
        data: {
          slug: b.slug,
          name: b.name,
          description: b.description,
          discountPct: b.discountPct,
          imageUrl: b.imageUrl,
          sortOrder: b.sortOrder,
          items: { create: productIds.map((productId) => ({ productId })) },
        },
      });
    }
  }

  console.log("Создаём тестовые заказы...");
  let counter = await prisma.counter.upsert({
    where: { id: "order" },
    create: { id: "order", value: 0 },
    update: {},
  });

  for (const o of orderSeeds) {
    const alreadySeeded = await prisma.order.findFirst({
      where: { customerPhone: o.customerPhone, customerName: o.customerName },
    });
    if (alreadySeeded) continue;

    counter = await prisma.counter.update({ where: { id: "order" }, data: { value: { increment: 1 } } });
    const orderNumber = `BAD-${String(counter.value).padStart(6, "0")}`;

    const items = o.items.map((it) => {
      const product = products.find((p) => p.slug === it.slug)!;
      return {
        productId: productIdBySlug.get(it.slug)!,
        quantity: it.quantity,
        priceAtPurchase: product.price,
      };
    });
    const totalAmount = items.reduce((sum, it) => sum + it.priceAtPurchase * it.quantity, 0);

    await prisma.order.create({
      data: {
        orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerAddress: o.customerAddress,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        totalAmount,
        items: { create: items },
      },
    });
  }

  console.log("Создаём администратора...");
  const passwordHash = await bcrypt.hash("admin12345", 10);
  await prisma.adminUser.upsert({
    where: { login: "admin" },
    create: { login: "admin", passwordHash },
    update: {},
  });

  console.log("Готово.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
