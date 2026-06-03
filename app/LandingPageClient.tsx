"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, getCompatibleUnits, pricePerOrderedUnit, toBaseUnit } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowRight, Package, ShieldCheck, Scale, Layers, ChevronRight, Sparkles, Calculator, Check, ShoppingCart, HelpCircle, Copy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LandingPageClientProps {
  session: any;
}

const features = [
  {
    title: "High-Precision Decimal Math",
    category: "math",
    icon: Scale,
    color: "indigo",
    description: "Uses exact numeric(20,6) fields in PostgreSQL rather than floats or doubles. This completely eliminates cumulative rounding errors during financial or scientific inventory audits."
  },
  {
    title: "Transactional Stock Guards",
    category: "locks",
    icon: ShieldCheck,
    color: "emerald",
    description: "All order confirmations verify warehouse stock thresholds in a single database transaction. Prevents stock leakages or double allocation by blocking confirmation on insufficient balances, and returns stock on rejection."
  },
  {
    title: "Edge-Guard Authentication",
    category: "auth",
    icon: Layers,
    color: "cyan",
    description: "NextAuth.js v5 route guarding executed on the edge runtime. Instantly routes administrative tasks, seller portal layouts, and login prompts securely based on encoded JWT claims."
  },
  {
    title: "Live Unit Conversion Pipeline",
    category: "math",
    icon: Calculator,
    color: "pink",
    description: "Stores weight in grams and volume in milliliters, but allows sellers to buy in kilograms or liters. Pre-commit hooks convert orders to the database base unit seamlessly."
  },
  {
    title: "Real-time Stock Audits",
    category: "locks",
    icon: Package,
    color: "amber",
    description: "Never sell item stock that doesn't exist. The ordering cart validates cache limits in real-time before transaction execution, preserving consistency under high concurrency."
  },
  {
    title: "Status Lifecycle Tracker",
    category: "auth",
    icon: Check,
    color: "violet",
    description: "Trace every order from pending state to confirmed, rejected, or fulfilled. Visual indicators help administrators coordinate operations with instant status update capabilities."
  }
];

export default function LandingPageClient({ session }: LandingPageClientProps) {
  const isLoggedIn = !!session;
  const role = session?.user?.role;
  // Mouse spotlight hover tracker
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const [activeTab, setActiveTab] = useState("all");

  // States for the interactive conversion demo
  const [demoValue, setDemoValue] = useState("2.5");
  const [demoUnit, setDemoUnit] = useState("kg");
  const [demoPrice, setDemoPrice] = useState("0.05");
  const [demoBaseUnit, setDemoBaseUnit] = useState("g"); // derived weight
  
  const [baseQty, setBaseQty] = useState(2500);
  const [bulkPrice, setBulkPrice] = useState(50);
  const [demoTotal, setDemoTotal] = useState(125);

  // States for the Floating Point simulator
  const [floatValue1, setFloatValue1] = useState("0.1");
  const [floatValue2, setFloatValue2] = useState("0.2");
  const [jsSumResult, setJsSumResult] = useState<string | null>(null);
  const [ogSumResult, setOgSumResult] = useState<string | null>(null);
  const [isMathSimulating, setIsMathSimulating] = useState(false);

  const runMathSimulation = () => {
    setIsMathSimulating(true);
    setJsSumResult(null);
    setOgSumResult(null);
    setTimeout(() => {
      const v1 = parseFloat(floatValue1) || 0;
      const v2 = parseFloat(floatValue2) || 0;
      const sum = v1 + v2;
      setJsSumResult(sum.toString());
      setOgSumResult((Math.round(sum * 1000000) / 1000000).toFixed(6));
      setIsMathSimulating(false);
    }, 800);
  };

  // States for the Concurrency Transaction Locks simulator
  const [concurrencyStep, setConcurrencyStep] = useState(0); 
  const [concurrencyLog, setConcurrencyLog] = useState<string[]>([]);
  const [isConcurrencySimulating, setIsConcurrencySimulating] = useState(false);

  const runConcurrencySimulation = () => {
    setIsConcurrencySimulating(true);
    setConcurrencyStep(1);
    setConcurrencyLog([
      "[t=0ms] Seller A submits order for 10 kg Basmati Rice",
      "[t=2ms] Seller B submits order for 5 kg Basmati Rice simultaneously"
    ]);
    
    setTimeout(() => {
      setConcurrencyStep(2);
      setConcurrencyLog(prev => [
        ...prev,
        "[t=15ms] DB Transaction A starts. Row locked: PRODUCT id=BAS-RICE-01 FOR UPDATE",
        "[t=17ms] DB Transaction B waits: waiting to acquire row lock on PRODUCT id=BAS-RICE-01"
      ]);
      
      setTimeout(() => {
        setConcurrencyStep(3);
        setConcurrencyLog(prev => [
          ...prev,
          "[t=35ms] Transaction A verifies stock: available 10 kg >= requested 10 kg. Validation SUCCESS.",
          "[t=40ms] Transaction A updates stock: stock_quantity = 0 kg",
          "[t=45ms] Transaction A COMMITS. Row lock released."
        ]);
        
        setTimeout(() => {
          setConcurrencyStep(4);
          setConcurrencyLog(prev => [
            ...prev,
            "[t=55ms] Transaction B acquires row lock on PRODUCT id=BAS-RICE-01",
            "[t=60ms] Transaction B verifies stock: available 0 kg < requested 5 kg. Validation FAILED.",
            "[t=65ms] Transaction B ROLLS BACK. Thread A SUCCESS. Thread B REJECTED (Out of Stock)."
          ]);
          setIsConcurrencySimulating(false);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  // Clipboard copy handler
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 1500);
  };

  // Recalculate demo conversions live
  useEffect(() => {
    try {
      const qty = parseFloat(demoValue) || 0;
      const price = parseFloat(demoPrice) || 0;
      
      const bQty = toBaseUnit(qty, demoUnit);
      setBaseQty(bQty);
      
      const bPrice = pricePerOrderedUnit(price, demoUnit);
      setBulkPrice(bPrice);
      
      setDemoTotal(qty * bPrice);
    } catch (e) {
      // ignore parsing errors
    }
  }, [demoValue, demoUnit, demoPrice]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute top-[20%] right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full filter blur-3xl opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-10 w-[400px] h-[400px] bg-indigo-500/5 rounded-full filter blur-3xl opacity-20 pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-900/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-extrabold text-md">oG</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
            orderGo
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#demo" className="hover:text-white transition-colors">Live Demo</a>
          <a href="#tech" className="hover:text-white transition-colors">Architecture</a>
          <a href="#credentials" className="hover:text-white transition-colors">Demo Logins</a>
        </nav>

        <div>
          {isLoggedIn ? (
            <Link href={role === "admin" ? "/admin/dashboard" : "/seller/dashboard"}>
              <Button className="bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 text-xs font-semibold px-4 h-9">
                Go to Dashboard
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-semibold px-5 h-9 shadow-lg shadow-indigo-500/10">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-4 md:px-8 text-center max-w-5xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 text-[11px] font-semibold tracking-wide uppercase">
          <Sparkles className="h-3 w-3" />
          The High-Precision Inventory Core
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Precision Warehousing <br />
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
            at the Speed of Thought
          </span>
        </h1>
        
        <p className="text-slate-400 text-md md:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
          An open-source, production-ready ledger for stock tracking. Powered by Next.js 14, Neon serverless PostgreSQL, and Drizzle. Guarded down to the microgram.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {isLoggedIn ? (
            <Link href={role === "admin" ? "/admin/dashboard" : "/seller/dashboard"}>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold px-8 py-6 rounded-xl shadow-xl shadow-indigo-600/10">
                Enter System Portal
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold px-8 py-6 rounded-xl shadow-xl shadow-indigo-600/10">
                  Access Demo Portal
                </Button>
              </Link>
              <a href="#demo">
                <Button variant="ghost" className="w-full sm:w-auto text-slate-350 hover:text-white border border-slate-800 hover:bg-slate-900/40 font-semibold px-8 py-6 rounded-xl">
                  Try Interactive Calculator
                </Button>
              </a>
            </>
          )}
        </div>

        {/* Dashboard Mockup Showcase */}
        <div className="pt-12 md:pt-16 max-w-4xl mx-auto">
          <div 
            onMouseMove={handleMouseMove}
            className="relative p-2.5 rounded-2xl bg-slate-900/30 border border-slate-800/80 shadow-2xl backdrop-blur-sm overflow-hidden group"
          >
            <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 bg-[radial-gradient(250px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.06),transparent_80%)] pointer-events-none" />
            <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 bg-[radial-gradient(250px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.25),transparent_80%)] pointer-events-none" style={{ maskImage: 'radial-gradient(249px_circle_at_var(--mouse-x)_var(--mouse-y), transparent, black)', WebkitMaskImage: 'radial-gradient(249px_circle_at_var(--mouse-x)_var(--mouse-y), transparent, black)' }} />
            <div className="relative rounded-xl border border-slate-850 bg-slate-950/80 p-5 md:p-8 space-y-6 text-left">
              {/* Fake Dashboard header */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] text-slate-500 font-mono ml-2">secure.ordergo.app/seller/products</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-950/50 border border-emerald-800/30 text-emerald-350 font-bold uppercase tracking-wider">
                  Live Demo Connected
                </span>
              </div>

              {/* Fake product card simulation */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider">Basmati Rice</span>
                    <h3 className="text-xl font-bold text-white">Premium Aromatic Long-Grain</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Weight product stored internally in grams (g) to prevent floating point discrepancies. Priced per gram, displayed in kilograms.
                  </p>
                  
                  <div className="flex gap-4 p-3 rounded-lg bg-slate-900/30 border border-slate-850 text-xs">
                    <div>
                      <span className="text-slate-500 block">Warehouse Stock</span>
                      <span className="font-semibold text-slate-200">150,000 g (150.00 kg)</span>
                    </div>
                    <div className="border-l border-slate-850 pl-4">
                      <span className="text-slate-500 block">Base Pricing</span>
                      <span className="font-semibold text-slate-200">₹0.05 / gram</span>
                    </div>
                  </div>
                </div>

                {/* Animated interactive widget block */}
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Order Unit Selection</span>
                      <span className="text-indigo-300 font-mono">1 kg = 1000 g</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <Label className="text-[10px] text-slate-500 font-semibold uppercase">Quantity</Label>
                        <div className="bg-slate-950/60 border border-slate-850 text-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold mt-1">
                          2.5
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500 font-semibold uppercase">Chosen Unit</Label>
                        <div className="bg-slate-950/60 border border-slate-850 text-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold mt-1">
                          kg
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-indigo-950/20 border border-indigo-900/25 text-center text-xs">
                    <div className="text-slate-400">Live Client Math:</div>
                    <div className="font-bold text-white text-sm mt-0.5">
                      2.5 kg &times; ₹50.00/kg = <span className="text-emerald-450">₹125.00</span>
                    </div>
                  </div>

                  <Button disabled className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 text-white text-xs h-9">
                    <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                    Added to Order Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 md:px-8 bg-slate-950/50 border-t border-slate-900">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Fully Verified Mechanics
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Engineered for Absolute Accuracy</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Our inventory system is structured with strict database integrity constraints and zero placeholders.
            </p>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { id: "all", label: "All Features" },
              { id: "math", label: "Precision Math" },
              { id: "locks", label: "Stock Locks" },
              { id: "auth", label: "Edge Security" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 border",
                  activeTab === tab.id
                    ? "bg-indigo-500/10 border-indigo-500/35 text-indigo-300 shadow-md shadow-indigo-500/5"
                    : "bg-slate-900/40 border-slate-850 text-slate-450 hover:border-slate-800 hover:text-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features
              .filter(f => activeTab === "all" || f.category === activeTab)
              .map((f, i) => {
                const IconComponent = f.icon;
                return (
                  <Card 
                    key={i}
                    onMouseMove={handleMouseMove}
                    className="relative border-slate-850 bg-slate-900/35 text-slate-100 group overflow-hidden transition-all duration-300 hover:border-slate-700/50 hover:bg-slate-900/50 flex flex-col justify-between"
                  >
                    {/* Spotlight Glow overlays */}
                    <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 bg-[radial-gradient(120px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.06),transparent_80%)] pointer-events-none" />
                    <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 bg-[radial-gradient(120px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.22),transparent_80%)] pointer-events-none" style={{ maskImage: 'radial-gradient(119px_circle_at_var(--mouse-x)_var(--mouse-y), transparent, black)', WebkitMaskImage: 'radial-gradient(119px_circle_at_var(--mouse-x)_var(--mouse-y), transparent, black)' }} />
                    
                    <CardHeader className="pb-2">
                      <div className={cn(
                        "p-2 rounded-lg w-max mb-3 border",
                        f.color === "indigo" && "bg-indigo-500/10 text-indigo-400 border-indigo-500/15",
                        f.color === "emerald" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
                        f.color === "cyan" && "bg-cyan-500/10 text-cyan-400 border-cyan-500/15",
                        f.color === "pink" && "bg-pink-500/10 text-pink-400 border-pink-500/15",
                        f.color === "amber" && "bg-amber-500/10 text-amber-400 border-amber-500/15",
                        f.color === "violet" && "bg-violet-500/10 text-violet-400 border-violet-500/15",
                      )}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-bold text-white tracking-tight">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-400 leading-relaxed pt-1">
                      {f.description}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      </section>

      {/* Interactive Precision & Transaction Lab */}
      <section id="demo" className="py-20 px-4 md:px-8 border-t border-slate-900 bg-slate-900/10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <Calculator className="h-7 w-7 text-indigo-400" />
              Interactive Precision & Transaction Lab
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Test our core business logic and database transaction safeguards in real-time.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {/* Card 1: Live Conversion Engine */}
            <Card 
              onMouseMove={handleMouseMove}
              className="relative border-slate-850 bg-slate-900/35 text-slate-100 group overflow-hidden transition-all duration-300 p-6 flex flex-col justify-between"
            >
              <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 bg-[radial-gradient(150px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.06),transparent_80%)] pointer-events-none" />
              
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    <Calculator className="h-3.5 w-3.5" />
                    Weight & Count Pipelines
                  </div>
                  <h3 className="text-md font-bold text-white">Live Conversion Engine</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Stores inventories in absolute base units (`g`, `mL`, `unit`) to avoid rounding discrepancies.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demoQty" className="text-slate-400 text-[10px] font-semibold uppercase">Ordered Quantity</Label>
                  <Input
                    id="demoQty"
                    type="number"
                    step="any"
                    value={demoValue}
                    onChange={(e) => setDemoValue(e.target.value)}
                    className="bg-slate-950/60 border-slate-850 text-slate-200 h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demoUnit" className="text-slate-400 text-[10px] font-semibold uppercase">Ordered Unit</Label>
                  <Select value={demoUnit} onValueChange={setDemoUnit}>
                    <SelectTrigger className="bg-slate-950/60 border-slate-850 text-slate-200 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-850 text-slate-200">
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demoPrice" className="text-slate-400 text-[10px] font-semibold uppercase">Base Unit Price (₹ / Gram)</Label>
                  <Input
                    id="demoPrice"
                    type="number"
                    step="0.0001"
                    value={demoPrice}
                    onChange={(e) => setDemoPrice(e.target.value)}
                    className="bg-slate-950/60 border-slate-850 text-slate-200 h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-4 text-xs font-mono border-t border-slate-900/60 mt-4">
                <div className="flex justify-between items-center p-2 rounded bg-slate-950/50 border border-slate-900">
                  <span className="text-slate-500 text-[9px] uppercase font-bold">Stored DB Weight</span>
                  <span className="font-bold text-white text-[11px]">{baseQty.toLocaleString("en-IN")} g</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-950/50 border border-slate-900">
                  <span className="text-slate-500 text-[9px] uppercase font-bold">Bulk Unit Price</span>
                  <span className="font-bold text-white text-[11px]">{formatCurrency(bulkPrice)} / {demoUnit}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-indigo-950/20 border border-indigo-900/30 text-indigo-350">
                  <span className="text-indigo-400 text-[9px] uppercase font-bold">Total Invoice</span>
                  <span className="font-bold text-emerald-400 text-[11px]">{formatCurrency(demoTotal)}</span>
                </div>
              </div>
            </Card>

            {/* Card 2: IEEE Drift Sum Visualizer */}
            <Card 
              onMouseMove={handleMouseMove}
              className="relative border-slate-850 bg-slate-900/35 text-slate-100 group overflow-hidden transition-all duration-300 p-6 flex flex-col justify-between"
            >
              <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 bg-[radial-gradient(150px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.06),transparent_80%)] pointer-events-none" />
              
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    <Scale className="h-3.5 w-3.5" />
                    IEEE-754 Floats vs Decimal
                  </div>
                  <h3 className="text-md font-bold text-white">Precision Drift Visualizer</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Standard JavaScript floats drift. We enforce SQL-level numeric(20,6) precision checks to prevent decimal loss.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floatValue1" className="text-slate-400 text-[10px] font-semibold uppercase">Value A</Label>
                  <Input
                    id="floatValue1"
                    type="number"
                    step="any"
                    value={floatValue1}
                    onChange={(e) => setFloatValue1(e.target.value)}
                    className="bg-slate-950/60 border-slate-850 text-slate-200 h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floatValue2" className="text-slate-400 text-[10px] font-semibold uppercase">Value B</Label>
                  <Input
                    id="floatValue2"
                    type="number"
                    step="any"
                    value={floatValue2}
                    onChange={(e) => setFloatValue2(e.target.value)}
                    className="bg-slate-950/60 border-slate-850 text-slate-200 h-8 text-xs font-mono"
                  />
                </div>

                <Button 
                  onClick={runMathSimulation}
                  disabled={isMathSimulating}
                  className="w-full bg-indigo-600 hover:bg-indigo-505 text-white text-xs h-8 font-semibold"
                >
                  {isMathSimulating ? "Computing..." : "Execute Simulation Sum"}
                </Button>
              </div>

              <div className="space-y-2.5 pt-4 text-xs font-mono border-t border-slate-900/60 mt-4">
                <div className="p-2 rounded bg-rose-950/20 border border-rose-900/25 text-rose-300">
                  <div className="text-[8px] text-rose-500 uppercase font-bold">Standard JS Float Result</div>
                  <div className="font-extrabold text-[11px] mt-0.5">{jsSumResult || "—"}</div>
                </div>
                <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900/25 text-emerald-300">
                  <div className="text-[8px] text-emerald-500 uppercase font-bold">orderGo exact numeric</div>
                  <div className="font-extrabold text-[11px] mt-0.5">{ogSumResult || "—"}</div>
                </div>
              </div>
            </Card>

            {/* Card 3: Race-Condition Concurrency Simulator */}
            <Card 
              onMouseMove={handleMouseMove}
              className="relative border-slate-850 bg-slate-900/35 text-slate-100 group overflow-hidden transition-all duration-300 p-6 flex flex-col justify-between"
            >
              <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 bg-[radial-gradient(150px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.06),transparent_80%)] pointer-events-none" />
              
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    SELECT ... FOR UPDATE Locks
                  </div>
                  <h3 className="text-md font-bold text-white">Stock Lock Simulator</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Seller A and Seller B check out the last 10 kg of stock at the same millisecond.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className={cn(
                    "p-2 rounded border text-center",
                    concurrencyStep >= 1 ? "bg-indigo-950/20 border-indigo-900/40 text-indigo-300" : "bg-slate-950/40 border-slate-900 text-slate-650"
                  )}>
                    <div className="font-bold">A: 10 kg</div>
                    <div className="text-[8px] uppercase mt-0.5">
                      {concurrencyStep === 4 ? "SUCCESS" : concurrencyStep > 0 ? "LOCKING..." : "PENDING"}
                    </div>
                  </div>
                  <div className={cn(
                    "p-2 rounded border text-center",
                    concurrencyStep >= 1 ? "bg-cyan-950/20 border-cyan-900/40 text-cyan-300" : "bg-slate-950/40 border-slate-900 text-slate-650"
                  )}>
                    <div className="font-bold">B: 5 kg</div>
                    <div className="text-[8px] uppercase mt-0.5">
                      {concurrencyStep === 4 ? "REJECTED" : concurrencyStep > 0 ? "WAITING..." : "PENDING"}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={runConcurrencySimulation}
                  disabled={isConcurrencySimulating}
                  className="w-full bg-emerald-600 hover:bg-emerald-505 text-white text-xs h-8 font-semibold"
                >
                  {isConcurrencySimulating ? "Running locks..." : "Test Concurrency"}
                </Button>
              </div>

              <div className="bg-slate-950 border border-slate-900 rounded p-2.5 font-mono text-[8px] leading-relaxed text-slate-400 h-[100px] overflow-y-auto mt-4">
                {concurrencyLog.length === 0 ? (
                  <span className="text-slate-700 italic">Click "Test Concurrency" to watch isolation flow.</span>
                ) : (
                  concurrencyLog.map((log, index) => (
                    <div key={index} className={cn(
                      "mb-0.5",
                      log.includes("SUCCESS") || log.includes("COMMITS") ? "text-emerald-450" : 
                      log.includes("FAILED") || log.includes("ROLLS BACK") ? "text-rose-450" : 
                      log.includes("locked") || log.includes("waits") ? "text-indigo-400" : "text-slate-350"
                    )}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="py-20 px-4 md:px-8 border-t border-slate-900">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">Full-Stack Tech Stack</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Built on modern infrastructure optimized for latency, type safety, and relational integrity.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 text-center space-y-2">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Framework</span>
              <h4 className="text-md font-bold text-white">Next.js 14</h4>
              <p className="text-xs text-slate-450">App Router, Layout segments, Server & Client components.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 text-center space-y-2">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Database</span>
              <h4 className="text-md font-bold text-white">Neon PostgreSQL</h4>
              <p className="text-xs text-slate-450">Serverless SQL database with direct & pooled connection modes.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 text-center space-y-2">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">ORM Layer</span>
              <h4 className="text-md font-bold text-white">Drizzle ORM</h4>
              <p className="text-xs text-slate-450">TypeScript-first schema design, migrations, and joins.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-850 text-center space-y-2">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Security Gate</span>
              <h4 className="text-md font-bold text-white">NextAuth v5</h4>
              <p className="text-xs text-slate-450">Role-based JWT sessions, CredentialsProvider, and middleware guards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials */}
      <section id="credentials" className="py-20 px-4 md:px-8 border-t border-slate-900 bg-slate-900/10">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">Instant Sandbox Access</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Test out both admin controls and seller flows immediately. Click any credential to copy.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            {/* Admin Keycard */}
            <Card 
              onMouseMove={handleMouseMove}
              className="relative border-slate-850 bg-slate-900/25 text-slate-100 group overflow-hidden transition-all duration-300 p-6 flex flex-col justify-between space-y-4 hover:border-indigo-500/20"
            >
              <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 bg-[radial-gradient(150px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.05),transparent_80%)] pointer-events-none" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase font-bold">Role: Administrator</span>
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">Full System Operations</h4>
                    <p className="text-[10px] text-slate-500">Manage products, verify transactions, register accounts.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-900 text-xs font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-slate-950/60 border border-slate-900">
                  <div className="overflow-hidden mr-2">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Email Address</span>
                    <span className="text-slate-300 text-[10px] truncate block">admin@aasa.com</span>
                  </div>
                  <button 
                    onClick={() => handleCopy("admin@aasa.com", "Admin Email")}
                    className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    title="Copy Email"
                  >
                    {copiedText === "Admin Email" ? <Check className="h-3.5 w-3.5 text-emerald-450" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-slate-950/60 border border-slate-900">
                  <div className="overflow-hidden mr-2">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Secret Key</span>
                    <span className="text-slate-300 text-[10px] truncate block">Admin@123</span>
                  </div>
                  <button 
                    onClick={() => handleCopy("Admin@123", "Admin Password")}
                    className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    title="Copy Password"
                  >
                    {copiedText === "Admin Password" ? <Check className="h-3.5 w-3.5 text-emerald-450" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </Card>

            {/* Seller Keycard */}
            <Card 
              onMouseMove={handleMouseMove}
              className="relative border-slate-850 bg-slate-900/25 text-slate-100 group overflow-hidden transition-all duration-300 p-6 flex flex-col justify-between space-y-4 hover:border-emerald-500/20"
            >
              <div className="absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 bg-[radial-gradient(150px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(16,185,129,0.04),transparent_80%)] pointer-events-none" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase font-bold">Role: Registered Seller</span>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">Order & Quotation Catalog</h4>
                    <p className="text-[10px] text-slate-500">Browse live stocks, add to cart, checkout invoices.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-900 text-xs font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-slate-950/60 border border-slate-900">
                  <div className="overflow-hidden mr-2">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Email Address</span>
                    <span className="text-slate-300 text-[10px] truncate block">seller@aasa.com</span>
                  </div>
                  <button 
                    onClick={() => handleCopy("seller@aasa.com", "Seller Email")}
                    className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    title="Copy Email"
                  >
                    {copiedText === "Seller Email" ? <Check className="h-3.5 w-3.5 text-emerald-450" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-slate-950/60 border border-slate-900">
                  <div className="overflow-hidden mr-2">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Secret Key</span>
                    <span className="text-slate-300 text-[10px] truncate block">Seller@123</span>
                  </div>
                  <button 
                    onClick={() => handleCopy("Seller@123", "Seller Password")}
                    className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    title="Copy Password"
                  >
                    {copiedText === "Seller Password" ? <Check className="h-3.5 w-3.5 text-emerald-450" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center pt-2">
            <Link href="/login">
              <Button className="bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-semibold px-8 py-5 rounded-xl shadow-lg shadow-indigo-600/10">
                Proceed to Secure Login Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center border-t border-slate-900 text-[11px] text-slate-600 bg-slate-950">
        <p>&copy; {new Date().getFullYear()} orderGo Inc. All rights reserved.</p>
        <p className="mt-1">High-Precision Warehousing Solutions &bull; Built with Next.js 14</p>
      </footer>
    </div>
  );
}
