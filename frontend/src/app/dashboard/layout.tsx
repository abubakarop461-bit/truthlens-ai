import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Search, LayoutDashboard, FileText, Settings, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="h-screen bg-[#0A0F1E] text-slate-50 flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="w-64 border-r border-slate-800/50 bg-[#060a14] p-6 flex-col hidden md:flex shrink-0">
        <Link href="/" className="flex items-center gap-2 mb-10">
          <Search className="w-6 h-6 text-[#2563EB]" />
          <span className="text-xl font-bold tracking-tight">TruthLens<span className="text-[#2563EB]">AI</span></span>
        </Link>
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-white bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)] rounded-lg font-medium transition-all">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors">
            <FileText className="w-5 h-5" /> Audits
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors">
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </nav>
        <div className="mt-auto border-t border-slate-800/50 pt-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
            {session.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 truncate text-sm">
            <p className="font-medium text-slate-200 truncate">{session.user?.name || "Demo User"}</p>
            <p className="text-slate-500 text-xs truncate">{session.user?.email || "demo@example.com"}</p>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-4 sm:px-6 bg-[#0A0F1E]/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <Button variant="ghost" size="icon" className="text-slate-300">
               <Menu className="w-5 h-5" />
            </Button>
            <span className="text-lg font-bold">TruthLens<span className="text-[#2563EB]">AI</span></span>
          </div>
          <h1 className="text-lg font-bold hidden md:block text-slate-200">Dashboard</h1>
          <Link href="/audit/new">
            <Button className="bg-[#2563EB] hover:bg-blue-500 text-white font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              New Audit
            </Button>
          </Link>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
