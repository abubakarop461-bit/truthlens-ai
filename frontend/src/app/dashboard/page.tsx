import { getServerSession } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Activity } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // Mocking variables for empty state
  const auditsCount = (session.user as any)?.auditsCount || 0;
  const credits = (session.user as any)?.credits || 3;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
         <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
              Welcome, {session.user?.name?.split(" ")[0] || "User"}
            </h2>
            <p className="text-slate-400">Here's the latest intelligence on your ESG integrity audits.</p>
         </div>
      </div>

      {/* Quick Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/60 border-slate-800 text-white shadow-lg overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#2563EB]/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              Audit Credits Remaining
              <Activity className="w-4 h-4 text-[#2563EB]" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-1">{credits}</div>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Renews on next billing cycle</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/60 border-slate-800 text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Audits Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-1">{auditsCount}</div>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Lifetime forensic reports</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contradictions Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white mb-1">{auditsCount > 0 ? 12 : 0}</div>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Across all audited claims</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area: Recent Audits */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
           <h3 className="text-xl font-bold text-slate-200">Recent Audits</h3>
        </div>
        
        {auditsCount === 0 ? (
          <Card className="bg-slate-900/40 border-slate-800 border-dashed text-center py-20 text-white shadow-inner">
            <CardContent className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-blue-900/20 border border-blue-800/50 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(37,99,235,0.1)]">
                <FileText className="w-10 h-10 text-[#2563EB]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">No audits initiated yet</h3>
              <p className="text-slate-400 mb-8 max-w-md text-base leading-relaxed">
                Upload your first sustainability report or SEC filing to cross-examine corporate claims against financial realities.
              </p>
              <Link href="/audit/new">
                <Button size="lg" className="bg-[#2563EB] hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] h-14 px-8 text-lg font-bold rounded-xl transition-all hover:scale-105">
                  <PlusCircle className="w-5 h-5 mr-2" /> Start your first audit
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-900/50 border-slate-800 text-white">
            <CardContent className="p-0">
              {/* Future Table Placeholder */}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
