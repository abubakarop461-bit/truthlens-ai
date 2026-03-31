"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, ChevronRight, CheckCircle, UploadCloud, Link as LinkIcon, 
  Search, Building, FileText, MapPin, Briefcase, Lock, Loader2, AlertTriangle 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewAuditPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [ticker, setTicker] = useState("");

  const [docTab, setDocTab] = useState("A"); // A = PDF, B = URL, C = Auto
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, type: string}[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [autoFetchQuery, setAutoFetchQuery] = useState("");

  const [depth, setDepth] = useState("Standard");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [newsIntegration, setNewsIntegration] = useState(false);

  // Validation
  const canProceed = () => {
    if (step === 1) return companyName.length > 2 && industry !== "" && country !== "";
    if (step === 2) {
      if (docTab === "A") return uploadedFiles.length > 0;
      if (docTab === "B") return urlInput.length > 5;
      if (docTab === "C") return autoFetchQuery.length > 2; // Auto fetch mock
    }
    if (step === 3) return depth !== "" && focusAreas.length > 0;
    return true;
  };

  const nextStep = () => {
    if (canProceed() && step < 4) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleLaunch = () => {
    setLoading(true);
    setTimeout(() => {
      // Mock finishing audit setup
      router.push("/dashboard");
    }, 2000);
  };

  const toggleFocusArea = (area: string) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area));
    } else {
      setFocusAreas([...focusAreas, area]);
    }
  };

  const handleMocFileUpload = () => {
    setUploadedFiles([...uploadedFiles, { name: "2023_Sustainability_Report.pdf", type: "Sustainability Report" }]);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-50 font-sans pb-20">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-800/50 flex items-center px-4 sm:px-8 bg-[#0A0F1E]/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mr-8">
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Link>
        <div className="flex items-center gap-2 border-l border-slate-800 pl-8">
          <Search className="w-5 h-5 text-[#2563EB]" />
          <span className="text-lg font-bold tracking-tight">TruthLens<span className="text-[#2563EB]">AI</span></span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pt-8 sm:pt-12 px-4 sm:px-6">
        
        {/* Progress Indicator */}
        <div className="mb-10 sm:mb-16">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full z-0"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#2563EB] rounded-full z-0 transition-all duration-500 ease-in-out"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
            
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step > i ? "bg-[#2563EB] text-white" : step === i ? "bg-blue-500 ring-4 ring-blue-500/20 text-white" : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {step > i ? <CheckCircle className="w-5 h-5" /> : i}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider hidden sm:block ${
                  step >= i ? "text-slate-200" : "text-slate-500"
                }`}>
                  {i === 1 ? "Identity" : i === 2 ? "Sources" : i === 3 ? "Config" : "Review"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <Card className="bg-slate-900/60 border-slate-800 text-slate-50 shadow-2xl overflow-hidden relative min-h-[500px]">
          
          <AnimatePresence mode="wait">
            {/* STEP 1: COMPANY IDENTITY */}
            {step === 1 && (
              <motion.div 
                key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="p-6 sm:p-10"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Company Identity</h2>
                  <p className="text-slate-400 text-sm">Target the organization you wish to cross-examine.</p>
                </div>

                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Company Name</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                      <input 
                        type="text" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                        placeholder="e.g. Shell PLC"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Industry Sector</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                        <select 
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-white appearance-none focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                        >
                          <option value="" disabled>Select sector...</option>
                          <option>Energy</option><option>Manufacturing</option>
                          <option>Finance</option><option>Retail</option>
                          <option>Technology</option><option>Agriculture</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">Country of Headquarters</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                        <input 
                          type="text" 
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                          placeholder="e.g. United Kingdom"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Stock Ticker <span className="text-slate-500 font-normal">(Optional)</span></label>
                    <input 
                      type="text" 
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      placeholder="e.g. SHEL"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DOCUMENT SOURCES */}
            {step === 2 && (
              <motion.div 
                key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="p-6 sm:p-10 flex flex-col h-full"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Document Sources</h2>
                  <p className="text-slate-400 text-sm">Provide the ESG reports and financial filings for TruthLens to cross-examine.</p>
                </div>

                <div className="flex border-b border-slate-800 mb-6">
                  <button onClick={() => setDocTab("A")} className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${docTab === "A" ? "border-[#2563EB] text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}>Upload PDFs</button>
                  <button onClick={() => setDocTab("B")} className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${docTab === "B" ? "border-[#2563EB] text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}>Paste URL</button>
                  <button onClick={() => setDocTab("C")} className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${docTab === "C" ? "border-[#2563EB] text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
                    Auto Fetch <Badge className="bg-blue-900/50 text-blue-300 hover:bg-blue-900/50 text-[9px] py-0 px-1 border border-blue-800/50">Pro+</Badge>
                  </button>
                </div>

                <div className="flex-1">
                  {docTab === "A" && (
                    <div className="space-y-4">
                      {uploadedFiles.length === 0 ? (
                        <button onClick={handleMocFileUpload} className="w-full border-2 border-dashed border-slate-700 hover:border-[#2563EB] hover:bg-blue-900/5 rounded-xl p-10 flex flex-col items-center justify-center transition-all group">
                          <div className="w-16 h-16 bg-slate-800 group-hover:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-[#2563EB]" />
                          </div>
                          <span className="font-semibold text-slate-200 mb-1">Click to browse or drag & drop</span>
                          <span className="text-xs text-slate-500">PDFs up to 50MB (Sustainability Reports, SEC Filings)</span>
                        </button>
                      ) : (
                        <div className="space-y-3">
                          {uploadedFiles.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                              <div className="flex items-center gap-4">
                                <FileText className="text-[#2563EB] w-6 h-6" />
                                <div>
                                  <p className="text-sm font-semibold">{f.name}</p>
                                  <p className="text-xs text-slate-400">Label: {f.type}</p>
                                </div>
                              </div>
                              <CheckCircle className="text-emerald-500 w-5 h-5" />
                            </div>
                          ))}
                          <Button variant="outline" onClick={handleMocFileUpload} className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white mt-4">
                            + Add another document
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {docTab === "B" && (
                    <div className="space-y-4 max-w-xl pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Target URL</label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                          <input 
                            type="text" 
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                            placeholder="https://..."
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Supports SEC EDGAR links, CDP disclosures, and company Investor Relations pages.</p>
                      </div>
                    </div>
                  )}

                  {docTab === "C" && (
                    <div className="space-y-4 max-w-xl pt-4 relative group">
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg border border-slate-800">
                        <div className="text-center p-6">
                          <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                          <p className="font-bold text-white mb-2">Pro+ Feature</p>
                          <p className="text-sm text-slate-400">Upgrade to Pro to automatically fetch relevant filings.</p>
                        </div>
                      </div>
                      <div className="space-y-2 opacity-50 pointer-events-none">
                        <label className="text-sm font-semibold text-slate-300">Company & Year</label>
                        <div className="flex gap-2">
                          <input readOnly value={companyName} className="flex-1 bg-slate-950/50 border border-slate-700 rounded-lg py-3 px-4 text-white" />
                          <input readOnly value="2023" className="w-24 bg-slate-950/50 border border-slate-700 rounded-lg py-3 px-4 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3: AUDIT CONFIGURATION */}
            {step === 3 && (
              <motion.div 
                key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="p-6 sm:p-10"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Audit Configuration</h2>
                  <p className="text-slate-400 text-sm">Determine the depth and specific focus areas for the RAG engine.</p>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Analysis Depth</label>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[
                        { id: "Standard", desc: "~3 min completion. Checks primary claims.", icon: <Search className="w-5 h-5" /> },
                        { id: "Deep Scan", desc: "~8 min completion. Deep cross-referencing.", icon: <FileText className="w-5 h-5" /> },
                        { id: "Forensic Enterprise", desc: "~15 min completion. Line-by-line SEC audit.", icon: <AlertTriangle className="w-5 h-5" /> }
                      ].map((d) => (
                        <div 
                          key={d.id}
                          onClick={() => setDepth(d.id)}
                          className={`cursor-pointer border rounded-xl p-4 transition-all ${depth === d.id ? "bg-[#2563EB]/10 border-[#2563EB]" : "bg-slate-900/50 border-slate-700 hover:border-slate-500"}`}
                        >
                          <div className={`mb-3 ${depth === d.id ? "text-[#2563EB]" : "text-slate-400"}`}>{d.icon}</div>
                          <p className="font-bold text-white mb-1">{d.id}</p>
                          <p className="text-xs text-slate-400">{d.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Focus Areas <span className="text-slate-500 font-normal lowercase">(Select multiple)</span></label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {["Climate & Emissions", "Water & Waste", "Labor & Supply Chain", "Governance", "Biodiversity", "Reporting Quality"].map((area) => (
                        <div 
                          key={area}
                          onClick={() => toggleFocusArea(area)}
                          className={`cursor-pointer border rounded-lg px-4 py-3 text-sm font-medium transition-all ${focusAreas.includes(area) ? "bg-[#2563EB] border-[#2563EB] text-white" : "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500"}`}
                        >
                          {area}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white flex items-center gap-2">
                        Live News Integration 
                        <Badge className="bg-blue-900/50 text-blue-300 hover:bg-blue-900/50 text-[10px] py-0 border border-blue-800/50">Pro+</Badge>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Cross-check claims against real-time news APIs.</p>
                    </div>
                    {/* Toggle Switch */}
                    <div 
                      onClick={() => setNewsIntegration(!newsIntegration)}
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${newsIntegration ? "bg-[#2563EB]" : "bg-slate-700"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${newsIntegration ? "translate-x-6" : "translate-x-0"}`} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: REVIEW & LAUNCH */}
            {step === 4 && (
              <motion.div 
                key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="p-6 sm:p-10"
              >
                <div className="mb-8 text-center max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-800/50">
                    <CheckCircle className="w-8 h-8 text-[#2563EB]" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Review & Launch</h2>
                  <p className="text-slate-400 text-sm">TruthLens is prepped and ready to deploy the forensic engine.</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-8 max-w-2xl mx-auto space-y-4">
                  <div className="flex justify-between pb-4 border-b border-slate-800/50">
                    <span className="text-slate-400 text-sm">Target Company</span>
                    <span className="font-bold text-white text-sm">{companyName || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between pb-4 border-b border-slate-800/50">
                    <span className="text-slate-400 text-sm">Sources</span>
                    <span className="font-medium text-white text-sm text-right">
                      {docTab === "A" ? `${uploadedFiles.length} file(s) uploaded` : docTab === "B" ? urlInput : "Auto Fetch"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-4 border-b border-slate-800/50">
                    <span className="text-slate-400 text-sm">Analysis Depth</span>
                    <span className="font-medium text-[#2563EB] text-sm">{depth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-slate-400 text-sm">Estimated Time</span>
                     <Badge variant="outline" className="border-emerald-700/50 text-emerald-400 bg-emerald-900/20">
                       {depth === "Standard" ? "~3 minutes" : depth === "Deep Scan" ? "~8 minutes" : "~15 minutes"}
                     </Badge>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-4 bg-slate-800/40 py-2 rounded-lg inline-block px-4 border border-slate-800">
                    <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5 text-yellow-500" />
                    This audit will consume <strong className="text-white">1 credit</strong>.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Navigation */}
          <div className="absolute bottom-0 inset-x-0 h-20 border-t border-slate-800 bg-[#060a14] px-6 sm:px-10 flex items-center justify-between z-20">
            <Button 
              variant="ghost" 
              onClick={prevStep}
              className={`text-slate-400 hover:text-white px-0 ${step === 1 ? 'invisible' : ''}`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            {step < 4 ? (
              <Button 
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-[#2563EB] hover:bg-blue-500 text-white font-semibold shadow-lg min-w-[120px]"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleLaunch}
                disabled={loading}
                className="bg-[#2563EB] hover:bg-blue-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all min-w-[200px]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : "Launch Forensic Audit \u2192"}
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
