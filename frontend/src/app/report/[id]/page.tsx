"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Globe,
  Database,
  ArrowRight,
  ShieldAlert,
  Download,
  Share2,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface Contradiction {
  contradiction_id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  contradiction_score: number;
  reasons: string[];
  claim_a: {
    claim_id: string;
    text: string;
    source: string;
    source_type: string;
    category: string;
  };
  claim_b: {
    claim_id: string;
    text: string;
    source: string;
    source_type: string;
    category: string;
  };
}

interface ResultsPayload {
  audit_id: string;
  overall_score: number;
  integrity_label: string;
  summary: string;
  metrics: {
    claims_analyzed: number;
    contradictions_found: number;
    vague_claims: number;
    documents_reviewed: number;
  };
  category_scores: {
    key: string;
    display_name: string;
    score: number;
    claims_count: number;
    contradictions_count: number;
    notes: string[];
  }[];
  contradictions: Contradiction[];
  vague_claims_list: { claim_text: string }[];
}

const GAUGE_COLORS = {
  HIGH: "#16a34a",
  MODERATE: "#eab308",
  LOW: "#f97316",
  CRITICAL: "#dc2626"
};

export default function AuditResultsDashboard() {
  const params = useParams();
  const router = useRouter();
  const auditId = params?.id as string;

  const [data, setData] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterSeverity, setFilterSeverity] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  useEffect(() => {
    if (!auditId) return;
    
    fetch(`http://127.0.0.1:8000/api/audit/${auditId}/results`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load results. Is the audit scored yet?");
        return res.json();
      })
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [auditId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <RefreshCcw className="w-8 h-8 text-[#4f8ef7] animate-spin mb-4" />
          <h2 className="text-xl font-semibold tracking-wide">Compiling Analyst Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center p-6 text-white text-center">
        <div>
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Results Unavailable</h2>
          <p className="text-slate-400 max-w-md mx-auto">{error || "Audit data could not be parsed."}</p>
        </div>
      </div>
    );
  }

  const getVerdictStyle = (label: string) => {
    if (label.includes("HIGH")) return "bg-[#16a34a]/10 border-[#16a34a] text-[#16a34a]";
    if (label.includes("MODERATE")) return "bg-[#eab308]/10 border-[#eab308] text-[#eab308]";
    if (label.includes("LOW")) return "bg-[#f97316]/10 border-[#f97316] text-[#f97316]";
    return "bg-[#dc2626]/20 border-[#dc2626] text-[#ef4444]";
  };

  const gaugeData = [
    { name: "score", value: data.overall_score },
    { name: "remaining", value: 100 - data.overall_score }
  ];
  
  const gaugeColor = data.overall_score >= 85 ? GAUGE_COLORS.HIGH : 
                     data.overall_score >= 65 ? GAUGE_COLORS.MODERATE : 
                     data.overall_score >= 40 ? GAUGE_COLORS.LOW : GAUGE_COLORS.CRITICAL;

  const radarData = data.category_scores.map(c => ({
    subject: c.display_name.split(' ')[0], // short name
    full: c.display_name,
    A: c.score,
    fullMark: 100,
  }));

  // Filtering Logic
  const filteredContradictions = data.contradictions.filter(c => {
    const sevMatch = filterSeverity === "All" || c.severity === filterSeverity;
    // Map contradiction category nicely or use basic includes
    const catMatch = filterCategory === "All" || (c.claim_a.category && c.claim_a.category.toLowerCase().includes(filterCategory.toLowerCase()));
    return sevMatch && catMatch;
  });

  return (
    <div className="min-h-screen bg-[#0f0f23] text-slate-200 font-sans pb-32">
      
      {/* VERDICT BANNER (Full Width) */}
      <div className={`w-full border-b-[3px] py-10 px-6 ${getVerdictStyle(data.integrity_label)}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2 block">
              Autonomous Audit Verdict
            </span>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3">
              {data.integrity_label}
            </h1>
            <p className="text-sm md:text-base font-medium opacity-90 max-w-2xl leading-relaxed">
              {data.summary}
            </p>
          </div>
          <div className="flex-shrink-0 text-center bg-black/20 rounded-2xl p-6 border border-white/10">
            <div className="text-6xl font-black leading-none">{data.overall_score}</div>
            <div className="text-xs font-bold uppercase tracking-wider mt-2 opacity-80">Out of 100</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10 space-y-10">
        
        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-xl p-5 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Claims Analyzed</div>
            <div className="text-3xl font-bold text-white">{data.metrics.claims_analyzed}</div>
            <Database className="absolute bottom-4 right-4 text-[#4f8ef7] w-12 h-12 opacity-10" />
          </div>
          <div className="bg-[#1a1a3e] border border-red-900/50 rounded-xl p-5 relative overflow-hidden">
            <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Contradictions</div>
            <div className="text-3xl font-bold text-red-400">{data.metrics.contradictions_found}</div>
            <ShieldAlert className="absolute bottom-4 right-4 text-red-400 w-12 h-12 opacity-10" />
          </div>
          <div className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-xl p-5 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vague Claims</div>
            <div className="text-3xl font-bold text-[#eab308]">{data.metrics.vague_claims}</div>
            <AlertCircle className="absolute bottom-4 right-4 text-[#eab308] w-12 h-12 opacity-10" />
          </div>
          <div className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-xl p-5 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Docs Reviewed</div>
            <div className="text-3xl font-bold text-white">{data.metrics.documents_reviewed}</div>
            <FileText className="absolute bottom-4 right-4 text-emerald-400 w-12 h-12 opacity-10" />
          </div>
        </div>

        {/* SCORE SECTION (Two Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gauge */}
          <div className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 w-full text-left mb-6 border-b border-[#2d2d5a] pb-3">Integrity Score</h3>
            <div className="relative w-64 h-32 overflow-hidden mb-6 flex items-end justify-center">
              <div className="w-full h-64 absolute top-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill={gaugeColor} />
                      <Cell fill="#0f0f2b" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="z-10 text-5xl font-black mb-1" style={{ color: gaugeColor }}>{data.overall_score}</div>
            </div>
            <div className="flex bg-[#0f0f2b] border border-[#2d2d5a] rounded-lg px-4 py-2 items-center gap-2">
               <Info className="w-4 h-4 text-[#4f8ef7]" />
               <span className="text-xs font-semibold text-slate-300">Places company in the bottom 15% of peers.</span>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 w-full text-left mb-2 border-b border-[#2d2d5a] pb-3">Category Breakdown</h3>
            <div className="w-full h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#2d2d5a" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#4f8ef7" fill="#4f8ef7" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-[#0f0f2b] border border-[#2d2d5a] rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between sticky top-4 z-20 shadow-md">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Severity:</span>
            <div className="flex gap-2">
              {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'VAGUE'].map(sev => (
                <button 
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg border transition-colors ${filterSeverity === sev ? 'bg-[#4f8ef7] border-[#4f8ef7] text-white' : 'bg-transparent border-[#2d2d5a] text-slate-400 hover:border-slate-500'}`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category:</span>
            <div className="flex gap-2">
              {['All', 'emissions', 'water', 'labor', 'governance'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg border transition-colors ${filterCategory === cat ? 'bg-white border-white text-[#0f0f2b]' : 'bg-transparent border-[#2d2d5a] text-slate-400 hover:border-slate-500'}`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTRADICTION CARDS */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white border-b border-[#2d2d5a] pb-3 mb-6">Forensic Evidence ({filteredContradictions.length})</h3>
          
          {filterSeverity === "VAGUE" ? (
             <div className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-2xl p-6">
               <h4 className="text-sm font-bold uppercase text-[#eab308] mb-4">Aspirational & Vague Claims Identified</h4>
               <ul className="space-y-4">
                 {data.vague_claims_list.map((c, i) => (
                   <li key={i} className="bg-[#0f0f2b] p-4 rounded-lg border border-[#2d2d5a] text-slate-300 italic text-sm">"{c.claim_text}"</li>
                 ))}
               </ul>
             </div>
          ) : filteredContradictions.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1a3e] rounded-2xl border border-[#2d2d5a] text-slate-500 italic">
               No contradictions found matching selected filters.
            </div>
          ) : filteredContradictions.map((con, idx) => (
            <div key={idx} className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-2xl overflow-hidden shadow-lg hover:border-[#4f8ef7]/50 transition-colors duration-300">
               
               <div className="flex justify-between items-center bg-[#0f0f2b] px-6 py-4 border-b border-[#2d2d5a]">
                 <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded border ${con.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/50' : 'bg-orange-500/10 text-orange-400 border-orange-500/50'}`}>
                      {con.severity}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Match Score: {con.contradiction_score.toFixed(2)}</span>
                 </div>
                 <div className="text-xs font-bold uppercase text-slate-400 tracking-widest">{con.claim_a.category}</div>
               </div>

               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                 {/* Claim Box */}
                 <div className="bg-[#fefce8] border-l-4 border-yellow-500 rounded-r-xl p-5 shadow-sm text-slate-800">
                    <h5 className="text-[10px] font-black uppercase text-yellow-700 tracking-widest mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Asserted Claim</h5>
                    <p className="text-sm font-medium italic leading-relaxed mb-4">"{con.claim_a.text}"</p>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-black/5 inline-block px-2 py-1 rounded">Source: {con.claim_a.source_type.replace('_', ' ')}</div>
                 </div>

                 {/* VS icon overlay for desktop */}
                 <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#0f0f2b] border border-[#2d2d5a] rounded-full items-center justify-center text-xs font-black text-slate-400 z-10">VS</div>

                 {/* Evidence Box */}
                 <div className="bg-[#fef2f2] border-l-4 border-red-500 rounded-r-xl p-5 shadow-sm text-slate-800">
                    <h5 className="text-[10px] font-black uppercase text-red-700 tracking-widest mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Forensic Evidence</h5>
                    <p className="text-sm font-medium italic leading-relaxed mb-4">"{con.claim_b.text}"</p>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-black/5 inline-block px-2 py-1 rounded">Source: {con.claim_b.source_type.replace('_', ' ')}</div>
                 </div>
               </div>

               <div className="bg-[#1e1e46] px-6 py-4 border-t border-[#2d2d5a]">
                  <h6 className="text-[10px] font-black text-[#4f8ef7] uppercase tracking-widest mb-2">Automated Analysis</h6>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">{con.reasons[0]}</p>
                  
                  <div className="mt-4 flex gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#34d399]/10 text-[#34d399] px-2 py-1 rounded">SEC ESG Rules</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#a78bfa]/10 text-[#a78bfa] px-2 py-1 rounded">Greenwashing Flag</span>
                  </div>
               </div>

            </div>
          ))}
        </div>

      </div>

      {/* BOTTOM STICKY ACTION BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-[#1a1a3e]/90 backdrop-blur-md border-t border-[#2d2d5a] p-4 flex flex-col sm:flex-row justify-center items-center gap-4 z-50">
         <button 
           onClick={() => window.open(`http://localhost:8000/api/audit/${auditId}/report/pdf`, '_blank')}
           className="bg-[#4f8ef7] hover:bg-[#3b7eea] text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(79,142,247,0.3)] hover:scale-105"
         >
           <Download className="w-5 h-5"/> Download Full PDF Report
         </button>
         <button className="bg-[#0f0f2b] border border-[#2d2d5a] hover:bg-[#2d2d5a] text-slate-300 font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors">
           <Share2 className="w-5 h-5"/> Share Audit Link
         </button>
         <button 
           onClick={() => router.push('/audit/new')}
           className="bg-transparent hover:bg-white/5 text-slate-400 font-bold py-3 px-6 rounded-xl transition-colors"
         >
           Audit Another Company
         </button>
      </div>

    </div>
  );
}
