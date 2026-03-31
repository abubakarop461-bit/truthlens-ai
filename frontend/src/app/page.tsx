"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  ShieldAlert, 
  FileText, 
  ChevronRight, 
  Lock, 
  Search, 
  Download,
  AlertTriangle,
  Building
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-50 font-sans selection:bg-[#2563EB] selection:text-white overflow-hidden">
      
      {/* NAVIGATION */}
      <nav className="border-b border-slate-800/50 bg-[#0A0F1E]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-[#2563EB]" />
            <span className="text-xl font-bold tracking-tight">TruthLens<span className="text-[#2563EB]">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="#how-it-works" className="hover:text-white transition-colors">Methodology</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-white transition-colors">API</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white font-medium text-sm sm:text-base px-2 sm:px-4">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-[#2563EB] hover:bg-blue-500 text-white font-bold tracking-wide shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all px-4 sm:px-6">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e3a8a25_0%,#0A0F1E_70%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6 sm:gap-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-300 text-xs sm:text-sm font-medium w-fit">
              <Badge variant="secondary" className="bg-[#2563EB] text-white hover:bg-[#2563EB] border-0">New</Badge>
              EU CSRD Compliance Engine Live
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
              Is Your Portfolio <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-cyan-400">
                Greenwashing You?
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              TruthLens AI cross-examines corporate ESG claims against financial filings and live news in minutes — and generates a forensic audit report with cited evidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-[#2563EB] hover:bg-blue-500 text-white h-16 sm:h-20 px-8 sm:px-12 text-lg sm:text-xl font-extrabold shadow-[0_0_40px_rgba(37,99,235,0.7)] rounded-xl transition-all hover:scale-105 border border-[#2563EB]/50 w-full sm:w-auto">
                Audit a Company Free <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 ml-2" />
              </Button>
            </div>
            
            <div className="pt-6 sm:pt-8 border-t border-slate-800/50 mt-4">
              <p className="text-xs sm:text-sm text-slate-500 mb-4 font-semibold tracking-wider">TRUSTED BY INDUSTRY LEADERS</p>
              <div className="flex flex-wrap gap-4 sm:gap-8 text-slate-400 font-medium text-xs sm:text-sm">
                <span className="flex items-center gap-1.5 sm:gap-2"><Building className="w-4 h-4"/> ESG Funds</span>
                <span className="flex items-center gap-1.5 sm:gap-2"><ShieldAlert className="w-4 h-4"/> Regulators</span>
                <span className="flex items-center gap-1.5 sm:gap-2"><FileText className="w-4 h-4"/> Journalists</span>
              </div>
            </div>
          </motion.div>

          {/* HERO ANIMATION */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[350px] sm:h-[500px] w-full bg-slate-900/50 rounded-2xl border border-slate-800 shadow-2xl shadow-blue-900/20 overflow-hidden flex items-center justify-center mt-6 lg:mt-0"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-8 transform scale-[0.85] sm:scale-100">
              
              <div className="flex gap-4 sm:gap-8 items-end justify-center w-full">
                <motion.div 
                  initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                  className="w-24 sm:w-32 bg-slate-800 border border-slate-700 rounded-lg p-3 sm:p-4 shadow-lg flex flex-col gap-2"
                >
                  <div className="h-2 w-8 sm:w-12 bg-blue-500 rounded"></div>
                  <div className="h-2 w-full bg-slate-600 rounded"></div>
                  <div className="h-2 w-4/5 bg-slate-600 rounded"></div>
                  <span className="text-[10px] text-slate-400 mt-1 sm:mt-2">ESG Report</span>
                </motion.div>

                <motion.div 
                  initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
                  className="w-24 sm:w-32 bg-slate-800 border border-slate-700 rounded-lg p-3 sm:p-4 shadow-lg flex flex-col gap-2"
                >
                  <div className="h-2 w-8 sm:w-12 bg-emerald-500 rounded"></div>
                  <div className="h-2 w-full bg-slate-600 rounded"></div>
                  <div className="h-2 w-4/5 bg-slate-600 rounded"></div>
                  <span className="text-[10px] text-slate-400 mt-1 sm:mt-2">SEC 10-K</span>
                </motion.div>
              </div>

              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#2563EB] to-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.5)] z-10 my-2 sm:my-4"
              >
                <Search className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
                className="w-full max-w-sm bg-red-950/60 border border-red-900/80 rounded-lg p-3 sm:p-4 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-[10px] sm:text-xs font-bold text-red-500">CONTRADICTION FOUND</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  <span className="text-slate-400">Claim:</span> "Net Zero by 2030"<br/>
                  <span className="text-slate-400">Evidence:</span> $4.2B Fossil Fuel CAPEX in current SEC filing.
                </p>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* SOCIAL PROOF / STATS */}
      <section className="border-y border-slate-800/50 bg-[#0c1222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:divide-x divide-slate-800/50">
          <div className="flex flex-col items-center justify-center text-center px-2 sm:px-4">
            <span className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">2,400+</span>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-2 uppercase tracking-wider font-semibold">Companies Audited</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-2 sm:px-4">
            <span className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">18,000+</span>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-2 uppercase tracking-wider font-semibold">Contradictions</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-2 sm:px-4">
            <span className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">94%</span>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-2 uppercase tracking-wider font-semibold">Accuracy vs Manual</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-2 sm:px-4">
            <span className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">3</span>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-2 uppercase tracking-wider font-semibold">Regulatory Filings</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 sm:py-24 px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 tracking-tight">
            We don't read between the lines.<br className="hidden sm:block"/>
            We <span className="text-[#2563EB]">audit</span> them.
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            No human analyst team can do this at scale. TruthLens AI processes thousands of pages across disparate sources in under 5 minutes.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6 sm:gap-8">
           {[
            {
              icon: <FileText className="w-8 h-8 text-[#2563EB]" />,
              title: "1. Upload or Link",
              desc: "Provide sustainability reports, SEC filings, EU taxonomy disclosures, or just a title to auto-fetch."
            },
            {
              icon: <Search className="w-8 h-8 text-[#2563EB]" />,
              title: "2. AI Cross-Examination",
              desc: "Our RAG engine extracts thousands of ESG claims and searches for direct contradictions in financial data."
            },
            {
              icon: <Download className="w-8 h-8 text-[#2563EB]" />,
              title: "3. Court-Ready Report",
              desc: "Download a comprehensive Big 4 quality PDF forensic audit report with every claim cited verbatim."
            }
          ].map((step, i) => (
            <Card key={i} className="bg-slate-900/50 border-slate-800 text-white backdrop-blur-sm hover:border-[#2563EB]/50 transition-colors">
              <CardHeader>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-900/20 flex items-center justify-center mb-4 border border-blue-900/50">
                  {step.icon}
                </div>
                <CardTitle className="text-lg sm:text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* LIVE DEMO CONTENT */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 bg-slate-900/30 border-y border-slate-800/50 flex flex-col lg:flex-row gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
        <div className="w-full lg:w-1/2 relative rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden shadow-2xl">
          {/* Mock Contradiction Card inside */}
          <div className="p-6 relative text-left">
            <div className="flex justify-between items-center mb-6">
              <Badge variant="destructive" className="bg-red-900/80 text-red-100 border-red-800">🚨 CRITICAL RISK</Badge>
              <span className="text-xs sm:text-sm text-slate-400 font-medium">Shell PLC (Energy)</span>
            </div>
            
            <div className="space-y-4 pb-32">
              <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl">
                <p className="text-[10px] sm:text-xs text-yellow-500 font-extrabold mb-2 uppercase tracking-wider">Company Claim (ESG Report p.23)</p>
                <p className="text-xs sm:text-sm text-slate-200 italic font-medium">"We achieved net zero Scope 1 and 2 emissions across operations in 2023."</p>
              </div>
              <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-xl">
                <p className="text-[10px] sm:text-xs text-red-400 font-extrabold mb-2 uppercase tracking-wider">Contradicting Evidence (SEC 20-F p.147)</p>
                <p className="text-xs sm:text-sm text-slate-200 italic font-medium">"Capital expenditure of $4.2B allocated to new upstream oil development."</p>
              </div>
            </div>

            {/* Frosted Glass Blur overlay */}
            <div className="absolute inset-x-0 bottom-0 top-[35%] sm:top-1/3 z-20 bg-[#0A0F1E]/60 backdrop-blur-md flex flex-col items-center justify-center p-6 border-t border-blue-900/50 text-center">
              <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-slate-200 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white text-center shadow-black drop-shadow-lg">Unlock Full Analysis</h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-6 text-center max-w-[250px] font-medium drop-shadow-md">Join TruthLens AI to view the complete evidence breakdown and methodology for this audit.</p>
              <Button className="bg-[#2563EB] hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all h-12 sm:h-14 px-8 font-bold text-base sm:text-lg w-full sm:w-auto text-center mx-auto block max-w-sm">
                Join Free Trial to View
              </Button>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-1/2">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 tracking-tight">See it in action.</h2>
          <p className="text-slate-400 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
            We unleashed our engine on a major energy company's public disclosures. The results demonstrate the undeniable gap between marketing narrative and financial reality.
          </p>
          <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-slate-300 font-medium">
            <li className="flex gap-3 items-start p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#2563EB] shrink-0 mt-0.5" />
              <span>Analyzed 4 complex documents and 23 live news articles</span>
            </li>
            <li className="flex gap-3 items-start p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#2563EB] shrink-0 mt-0.5" />
              <span>Extracted 127 specific ESG claims with perfect accuracy</span>
            </li>
            <li className="flex gap-3 items-start p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#2563EB] shrink-0 mt-0.5" />
              <span>Found 14 confirmed contradictions & 31 vague statements</span>
            </li>
          </ul>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 tracking-tight">Invest with Confidence.</h2>
          <p className="text-slate-400 text-base sm:text-lg">Choose the tier that fits your forensic analysis volume.</p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 sm:gap-8 lg:px-8">
          {/* STARTER */}
          <Card className="bg-slate-900/50 border-slate-800 text-white flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-slate-200">Starter</CardTitle>
              <div className="mt-4"><span className="text-4xl font-bold">$0</span><span className="text-slate-500 text-lg"> /mo</span></div>
              <CardDescription className="text-slate-400 mt-2">For independent researchers and journalists.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2563EB]" /> 3 audits/month</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2563EB]" /> Watermarked PDF reports</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2563EB]" /> 2 document sources max</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2563EB]" /> Email support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors h-12 shadow-sm shadow-black shrink-0">Get Started Free</Button>
            </CardFooter>
          </Card>

          {/* PRO */}
          <Card className="bg-[#0A153A] border-[#2563EB] text-white flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-blue-900/30">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2563EB] text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider text-white">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Professional</CardTitle>
              <div className="mt-4"><span className="text-4xl font-bold">$149</span><span className="text-blue-200/50 text-lg"> /mo</span></div>
              <CardDescription className="text-blue-100 mt-2">For boutique ESG funds and consultants.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm text-blue-50">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-400" /> 50 audits/month</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-400" /> Full unlocked PDF reports</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-400" /> Live news integration</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-400" /> API access</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cyan-400" /> Priority support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-[#2563EB] hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all h-12 font-semibold">Upgrade to Pro</Button>
            </CardFooter>
          </Card>

          {/* ENTERPRISE */}
          <Card className="bg-slate-900/50 border-slate-800 text-white flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-slate-200">Enterprise</CardTitle>
              <div className="mt-4"><span className="text-4xl font-bold">Custom</span></div>
              <CardDescription className="text-slate-400 mt-2">For large funds, banks, and regulators.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2563EB]" /> Unlimited audits</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2563EB]" /> Regulatory filing format output</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2563EB]" /> Custom red flags database</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2563EB]" /> Dedicated account manager</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#2563EB]" /> SLA & White-label setup</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors h-12">Contact Sales</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/50 bg-[#060a14] py-8 sm:py-12 px-4 sm:px-6 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#2563EB]" />
            <span className="text-lg font-bold tracking-tight text-white">TruthLens<span className="text-[#2563EB]">AI</span></span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-400 font-medium">
            <Link href="#" className="hover:text-white transition-colors">About</Link>
            <Link href="#" className="hover:text-white transition-colors">Methodology</Link>
            <Link href="#" className="hover:text-white transition-colors">API Docs</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300 font-medium py-1 px-3">SOC 2 Compliant</Badge>
            <Badge variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300 font-medium py-1 px-3">GDPR Ready</Badge>
            <Badge variant="outline" className="border-emerald-900/50 text-emerald-400 bg-emerald-900/10 font-medium py-1 px-3">EU CSRD Aligned</Badge>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} TruthLens AI. All rights reserved. Not actual legal or financial advice.
        </div>
      </footer>

    </div>
  );
}
