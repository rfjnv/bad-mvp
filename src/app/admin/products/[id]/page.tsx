import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

function toDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Редактирование товара</h1>
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          categoryId: product.categoryId,
          description: product.description,
          composition: product.composition,
          dosage: product.dosage,
          price: product.price,
          oldPrice: product.oldPrice,
          stock: product.stock,
          imageUrl: product.imageUrl,
          sesCertNumber: product.sesCertNumber ?? "",
          sesCertFileUrl: product.sesCertFileUrl ?? "",
          sesCertIssuedAt: toDateInput(product.sesCertIssuedAt),
          sesCertExpiresAt: toDateInput(product.sesCertExpiresAt),
          conformityCertNumber: product.conformityCertNumber ?? "",
          conformityCertFileUrl: product.conformityCertFileUrl ?? "",
          conformityCertIssuedAt: toDateInput(product.conformityCertIssuedAt),
          conformityCertExpiresAt: toDateInput(product.conformityCertExpiresAt),
          activeSubstance: product.activeSubstance ?? "",
          activeAmount: product.activeAmount,
          activeUnit: product.activeUnit ?? "",
          servingsPerPackage: product.servingsPerPackage,
          isActive: product.isActive,
        }}
      />
    </div>
  );
}
