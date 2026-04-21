import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Cloud, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  TrendingDown, 
  ArrowRight, 
  Menu, 
  X, 
  Layers,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "../components/ThemeToggle";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-panel border-b border-border py-4 shadow-sm" : "bg-transparent py-6"}`}>
      <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-primary rounded-[6px] flex items-center justify-center text-white font-black text-lg">
              C
            </div>
            <span className="text-xl font-bold text-ink-heading tracking-tight">CostOps AI</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Overview", "Infrastructure", "Optimization", "Reporting"].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="text-sm font-medium text-ink-muted hover:text-brand-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link to="/login" className="px-5 py-2 text-sm font-bold text-ink-heading hover:text-brand-primary transition-colors">
            Sign In
          </Link>
          <Link to="/login" className="px-5 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-brand-hover transition-all shadow-lg shadow-brand-primary/20">
            Get Started
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <button className="text-ink" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-panel border-b border-border p-6 md:hidden flex flex-col gap-4 shadow-xl"
          >
            {["Overview", "Infrastructure", "Optimization", "Reporting"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-ink-heading">
                {item}
              </a>
            ))}
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-3 bg-brand-primary text-white font-bold rounded-lg text-center">
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const FeatureItem = ({ icon: Icon, title, description, index }: { icon: any, title: string, description: string, index: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    className="panel-card p-6 flex flex-col gap-4 group hover:border-brand-primary transition-all duration-300"
  >
    <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
      <Icon size={20} />
    </div>
    <div>
      <h3 className="text-base font-bold mb-2 text-ink-heading">{title}</h3>
      <p className="text-ink-muted leading-relaxed text-sm">{description}</p>
    </div>
  </motion.div>
);

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-surface selection:bg-brand-primary/10">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-48 pb-16 px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-panel border border-border text-brand-primary text-[10px] font-bold mb-8 uppercase tracking-widest"
          >
            Infrastructure Optimization
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-ink-heading leading-[1.1] tracking-tight mb-6 max-w-4xl"
          >
            Stop Overpaying For Your Cloud Infrastructure.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-ink-muted max-w-2xl mb-10 leading-relaxed"
          >
            CostOps AI analyzes your infrastructure in real-time to identify savings, 
            automate scaling, and reduce your monthly bill by up to 45%.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link to="/signup" className="btn-primary">
              Start Saving Now
              <ArrowRight size={18} />
            </Link>
            <Link to="/signup" className="btn-secondary">
              Book a Demo
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="overview" className="py-8 px-8 bg-surface">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="panel-card p-6 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Monthly Spend</span>
            <span className="text-3xl font-bold text-ink-heading">$142,850.20</span>
            <span className="text-xs font-medium text-danger">↑ 4.2% vs last month</span>
          </div>
          <div className="panel-card p-6 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">AI Potential Savings</span>
            <span className="text-3xl font-bold text-ink-heading">$28,400.00</span>
            <span className="text-xs font-medium text-success">↓ 12 identified risks</span>
          </div>
          <div className="panel-card p-6 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Efficiency Score</span>
            <span className="text-3xl font-bold text-ink-heading">92/100</span>
            <span className="text-xs font-medium text-success">Top 5% of industry</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="infrastructure" className="py-24 px-8 border-y border-border bg-panel">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="max-w-lg">
              <h2 className="text-3xl font-bold mb-4 text-ink-heading tracking-tight">Intelligence in every byte.</h2>
              <p className="text-ink-muted text-base leading-relaxed">
                Every feature is designed to give you clarity and control over your cloud spending without sacrificing performance.
              </p>
            </div>
            <button className="text-sm font-bold text-brand-primary flex items-center gap-1 hover:underline">
              View all features <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            <FeatureItem 
              index={0}
              icon={BarChart3} 
              title="Real-time Analytics" 
              description="Visualize your spend across all clouds in a single, unified view with granular resource-level insights."
            />
            <FeatureItem 
              index={1}
              icon={TrendingDown} 
              title="Automated Savings" 
              description="Our AI agents automatically purchase spot instances and reserved capacity to ensure you never pay full price."
            />
            <FeatureItem 
              index={2}
              icon={Zap} 
              title="Infrastructure Rightsizing" 
              description="Identifying over-provisioned resources and recommending the perfect instance size for your actual load."
            />
            <FeatureItem 
              index={3}
              icon={Cloud} 
              title="Multi-Cloud Support" 
              description="Native integrations for AWS, Azure, Google Cloud, and Kubernetes environments out of the box."
            />
            <FeatureItem 
              index={4}
              icon={ShieldCheck} 
              title="Goverance & Policy" 
              description="Set strict budget alerts and automated shutdown policies to prevent surprise billing spikes."
            />
            <FeatureItem 
              index={5}
              icon={Layers} 
              title="Smart Tagging" 
              description="AI-assisted tagging ensures 100% cost allocation accuracy across teams, projects, and departments."
            />
          </div>
        </div>
      </section>

      {/* AI Recommendations Layout simulation */}
      <section id="optimization" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-8 items-start">
          <div className="panel-card p-8 order-2 lg:order-1 h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-lg font-bold text-ink-heading">Optimization Recommendations</h2>
              <span className="tag-badge tag-amber">4 pending</span>
            </div>
            <div className="space-y-4">
              {[
                { type: "High Priority", savings: "Save $12,400/yr", desc: "Resize 14 underutilized r5.large instances in us-east-1 production cluster.", tag: "tag-blue" },
                { type: "Medium", savings: "Save $4,200/yr", desc: "Migrate legacy S3 Standard buckets to Intelligent-Tiering for infrequent logs.", tag: "tag-amber" },
                { type: "Optimization", savings: "Save $850/yr", desc: "Cleanup unattached EBS volumes older than 30 days in development environment.", tag: "tag-green" }
              ].map((rec, i) => (
                <div key={i} className="rec-card flex flex-col gap-2 transition-transform hover:scale-[1.01] cursor-pointer">
                  <div className="flex justify-between items-center">
                    <span className={`tag-badge ${rec.tag}`}>{rec.type}</span>
                    <span className="text-sm font-bold text-success">{rec.savings}</span>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed">{rec.desc}</p>
                </div>
              ))}
            </div>
            <button className="mt-10 w-full py-2.5 bg-ink-heading text-white font-bold rounded-lg hover:bg-ink-heading/90 transition-all text-sm">
              Apply All Optimizations
            </button>
          </div>
          
          <div className="flex flex-col gap-6 order-1 lg:order-2">
            <h2 className="text-3xl font-bold text-ink-heading tracking-tight leading-tight">Scale your team, not your cloud bill.</h2>
            <p className="text-ink-muted leading-relaxed">
              CostOps AI bridges the gap between engineering velocity and financial accountability. 
              Our platform empowers teams to ship faster while automatically maintaining cost efficiency at scale.
            </p>
            <div className="space-y-4 mt-4">
              {[
                "CI/CD cost regression prevention",
                "CFO-level forecasting dashboards",
                "Automated Slack & Teams reporting",
                "Custom workload rules"
              ].map((text, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <CheckCircle2 size={18} className="text-success" />
                  <span className="text-sm font-bold text-ink-heading">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="reporting" className="py-24 border-y border-border bg-panel">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-xs font-bold text-ink-muted uppercase tracking-[0.2em] mb-12">Trusted by modern engineering teams</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-12 gap-y-8 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {["Amazon", "Google Cloud", "Microsoft", "Stripe", "Airbnb", "Vercel"].map(name => (
              <div key={name} className="flex justify-center text-lg font-bold text-ink-heading">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-16 px-8 bg-panel border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
            <div className="col-span-full lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 bg-brand-primary rounded-[4px] flex items-center justify-center text-white font-bold">C</div>
                <span className="text-lg font-bold text-ink-heading">CostOps AI</span>
              </div>
              <p className="text-ink-muted max-w-xs leading-relaxed text-sm">
                Unified cloud financial operations and automated optimization infrastructure.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-ink-heading">Product</h4>
              <ul className="space-y-3 text-ink-muted text-sm font-medium">
                <li><a href="#" className="hover:text-brand-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-ink-heading">Company</h4>
              <ul className="space-y-3 text-ink-muted text-sm font-medium">
                <li><a href="#" className="hover:text-brand-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Legal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-ink-heading">Documentation</h4>
              <ul className="space-y-3 text-ink-muted text-sm font-medium">
                <li><a href="#" className="hover:text-brand-primary transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-ink-heading">Connect</h4>
              <ul className="space-y-3 text-ink-muted text-sm font-medium">
                <li><a href="#" className="hover:text-brand-primary transition-colors">Twitter (X)</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border text-[11px] text-ink-muted font-bold tracking-widest uppercase gap-4">
            <p>© 2026 CostOps AI Inc.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-brand-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-brand-primary transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
