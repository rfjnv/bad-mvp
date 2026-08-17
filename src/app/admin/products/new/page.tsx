import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Новый товар</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
