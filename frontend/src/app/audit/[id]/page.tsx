"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  FileText,
  AlertTriangle,
  Globe,
  Database,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight
} from "lucide-react";

interface ProgressData {
  stage: string;
  progress_percent: number;
  claims_found: number;
  contradictions_found: number;
  documents_reviewed: number;
  news_fetched: number;
}

const PIPELINE_STAGES = [
  "Parsing documents...",
  "Extracting ESG claims...",
  "Fetching live news...",
  "Analyzing contradictions...",
  "Calculating integrity score...",
  "Generating forensic report..."
];

export default function AuditProgressPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params?.id as string;

  const [data, setData] = useState<ProgressData>({
    stage: "Connecting to secure audit stream...",
    progress_percent: 0,
    claims_found: 0,
    contradictions_found: 0,
    documents_reviewed: 0,
    news_fetched: 0,
  });

  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    if (!auditId) return;

    const wsUrl = `ws://127.0.0.1:8000/ws/audit/${auditId}/progress`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ProgressData;
        setData(payload);
        
        // Auto-redirect when 100% or final stage is met
        if (payload.progress_percent >= 100 || payload.stage.includes("report generated")) {
            // Note: Currently we don't have a report generated flag from the socket,
            // but the user's prompt indicated we stop when PDF finishes.
            // We can add a manual redirect button when it hits 95%.
        }
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setConnectionStatus("disconnected");
    };

    // Keepalive ping optional, but standard cleanup is essential:
    return () => {
      if (ws.readyState === 1) {
        ws.close();
      }
    };
  }, [auditId]);

  // Derived timeline state: which step are we currently on?
  // Use progress_percent to highlight the correct step.
  const getStepStatus = (index: number) => {
    const p = data.progress_percent;
    // Map percentages closely to the backend stage yields
    if (p >= 95) return index <= 5 ? "complete" : "current";
    if (p >= 75) return index < 4 ? "complete" : index === 4 ? "current" : "pending";
    if (p >= 50) return index < 3 ? "complete" : index === 3 ? "current" : "pending";
    if (p >= 35) return index < 2 ? "complete" : index === 2 ? "current" : "pending";
    if (p >= 20) return index < 1 ? "complete" : index === 1 ? "current" : "pending";
    
    // Default 0-19
    return index === 0 ? "current" : "pending";
  };

  return (
    <div className="min-h-screen bg-[#0f0f23] text-slate-200 p-6 md:p-12 font-sans selection:bg-[#4f8ef7] selection:text-white">
      {/* HEADER */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4f8ef7] to-[#a78bfa] flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(79,142,247,0.3)]">
              T
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-sm">
              Truth<span className="text-[#4f8ef7]">Lens</span> AI
            </h1>
          </div>
          <p className="text-slate-400 font-medium tracking-wide text-sm opacity-80 uppercase ml-1">
            Secure Audit Interface
          </p>
        </div>
        
        <div className="bg-[#1a1a3e] border border-[#2d2d5a] px-5 py-3 rounded-xl flex items-center gap-4 shadow-lg">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Audit ID
            </span>
            <span className="font-mono text-slate-200">{auditId.substring(0, 8).toUpperCase()}</span>
          </div>
          <div className="h-8 w-px bg-[#2d2d5a]"></div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Connection
            </span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {connectionStatus === "connected" && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connectionStatus === "connected" ? "bg-emerald-500" : "bg-red-500"}`}></span>
              </span>
              <span className={`text-sm font-medium ${connectionStatus === "connected" ? "text-emerald-400" : "text-red-400"}`}>
                {connectionStatus === "connected" ? "Secured" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MAIN PROGRESS AREA */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* STAGE HERO */}
          <div className="bg-gradient-to-br from-[#1a1a3e] to-[#0f0f2b] border border-[#2d2d5a] rounded-2xl p-8 relative overflow-hidden shadow-xl">
             {/* Background glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4f8ef7] opacity-[0.05] rounded-full blur-[100px]"></div>

             <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8 min-h-[220px]">
                
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-b-4 border-l-2 border-[#4f8ef7] flex items-center justify-center relative"
                  >
                    <div className="absolute inset-2 border-t-2 border-r-4 border-[#a78bfa] rounded-full animate-[spin_4s_linear_infinite_reverse]"></div>
                    <Activity className="w-8 h-8 text-[#4f8ef7] ml-0.5 mt-0.5" />
                  </motion.div>
                </motion.div>

                <div>
                   <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#4f8ef7] mb-3">
                     Live Pipeline Status
                   </h2>
                   <AnimatePresence mode="popLayout">
                     <motion.h3 
                       key={data.stage}
                       initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                       animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                       exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                       transition={{ duration: 0.4 }}
                       className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400"
                     >
                       {data.stage}
                     </motion.h3>
                   </AnimatePresence>
                </div>
                
                {data.progress_percent >= 95 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 px-6 py-3 bg-[#4f8ef7] hover:bg-[#3b7eea] text-white font-semibold rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(79,142,247,0.4)]"
                    onClick={() => alert("Redirect logic to PDF download or Dashboard to be implemented in Phase 10!")}
                  >
                    View Final Report <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
             </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-[#4f8ef7]/10 rounded-lg"><Database className="w-5 h-5 text-[#4f8ef7]"/></div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Claims Extracted</h4>
              </div>
              <p className="text-3xl font-black text-white mt-3 ml-2">{data.claims_found}</p>
            </div>
            
            <div className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-[30px] rounded-full"></div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-400"/></div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Contradictions</h4>
              </div>
              <p className="text-3xl font-black text-red-400 mt-3 ml-2">{data.contradictions_found}</p>
            </div>

            <div className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-[#34d399]/10 rounded-lg"><FileText className="w-5 h-5 text-[#34d399]"/></div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Docs Processed</h4>
              </div>
              <p className="text-3xl font-black text-white mt-3 ml-2">{data.documents_reviewed}</p>
            </div>

            <div className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-[#a78bfa]/10 rounded-lg"><Globe className="w-5 h-5 text-[#a78bfa]"/></div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">News Fetched</h4>
              </div>
              <p className="text-3xl font-black text-white mt-3 ml-2">{data.news_fetched}</p>
            </div>
          </div>
        </div>

        {/* TIMELINE CHECKLIST */}
        <div className="bg-[#1a1a3e] border border-[#2d2d5a] rounded-2xl p-6 shadow-xl">
           <h3 className="text-sm font-bold tracking-widest uppercase text-slate-300 mb-8 border-b border-[#2d2d5a] pb-4">
             Execution Timeline
           </h3>
           <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#2d2d5a] before:z-0">
             {PIPELINE_STAGES.map((stage, idx) => {
               const status = getStepStatus(idx);
               return (
                 <div key={idx} className="relative z-10 flex items-start gap-4">
                   <div className="mt-0.5">
                     {status === "complete" ? (
                       <CheckCircle2 className="w-7 h-7 text-[#34d399] bg-[#1a1a3e]" />
                     ) : status === "current" ? (
                       <div className="relative w-7 h-7 flex items-center justify-center bg-[#1a1a3e] rounded-full text-[#4f8ef7]">
                         <Loader2 className="w-6 h-6 animate-spin" />
                       </div>
                     ) : (
                       <Circle className="w-7 h-7 text-[#2d2d5a] bg-[#1a1a3e] fill-[#0f0f23]" />
                     )}
                   </div>
                   <div className="flex flex-col">
                     <span className={`text-sm font-semibold transition-colors duration-300 ${
                       status === "complete" ? "text-slate-200" :
                       status === "current" ? "text-[#4f8ef7]" : "text-slate-500"
                     }`}>
                       {stage}
                     </span>
                     {status === "current" && (
                       <span className="text-xs text-[#4f8ef7]/70 mt-1 font-medium">In progress...</span>
                     )}
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );
}
