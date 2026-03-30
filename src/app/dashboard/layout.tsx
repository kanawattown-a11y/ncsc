import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 pb-4">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto pt-6 px-6">
          <div className="mx-auto max-w-7xl h-full pb-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
