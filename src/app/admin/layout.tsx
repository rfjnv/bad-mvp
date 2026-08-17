import AdminNav from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
