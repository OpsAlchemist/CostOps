import { useEffect, useState } from 'react';
import { BarChart3, TrendingDown, Info, ShieldCheck, Zap } from 'lucide-react';
import { apiService } from '../../services/apiService';

const StatCard = ({ label, value, trend, isPositive }: any) => (
  <div className="panel-card p-6 flex flex-col gap-2">
    <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">{label}</span>
    <span className="text-3xl font-bold text-ink-heading tracking-tight">{value}</span>
    <span className={`text-xs font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
      {trend}
    </span>
  </div>
);

export const Overview = () => {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, historyData] = await Promise.all([
        apiService.getStats(),
        apiService.getHistory()
      ]);
      setStats(statsData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black mb-1">Infrastructure Overview</h1>
          <p className="text-sm text-ink-muted font-medium">Monitoring 4 cloud regions and 12 clusters.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-panel border border-border rounded-lg text-sm font-bold text-ink-heading hover:bg-surface transition-all">
            Download Report
          </button>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-hover transition-all"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Monthly Spend" 
          value={`$${stats?.monthlySpend.toLocaleString()}`} 
          trend={stats?.spendTrend} 
          isPositive={false} 
        />
        <StatCard 
          label="Potential Savings" 
          value={`$${stats?.potentialSavings.toLocaleString()}`} 
          trend={stats?.savingsTrend} 
          isPositive={true} 
        />
        <StatCard 
          label="Efficiency Score" 
          value={`${stats?.efficiencyScore}/100`} 
          trend="Top 5% of industry" 
          isPositive={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 panel-card p-8">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-lg font-bold">Cost History & Projections</h2>
            <select className="text-xs font-bold bg-surface border border-border rounded-lg px-3 py-1.5 focus:outline-hidden">
               <option>Last 12 Months</option>
               <option>Last 6 Months</option>
            </select>
          </div>
          
          <div className="h-64 flex items-end gap-3 md:gap-6">
            {history?.values.map((height: number, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                 <div 
                   className={`w-full rounded-t-md transition-all duration-500 relative ${i === history.values.length - 1 ? 'bg-brand-primary' : 'bg-border group-hover:bg-brand-primary/40'}`}
                   style={{ height: `${height}%` }}
                 >
                    {i === history.values.length - 1 && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-ink-heading text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-100 transition-opacity">
                         Latest
                      </div>
                    )}
                 </div>
                 <span className="text-[10px] font-bold text-ink-muted uppercase">
                   {history.months[i]}
                 </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold">Quick Actions</h2>
          </div>
          <div className="flex flex-col gap-4">
             {[
               { icon: Zap, label: "Optimize Instances", color: "text-amber-500", bg: "bg-amber-500/10" },
               { icon: ShieldCheck, label: "Security Audit", color: "text-success", bg: "bg-success/10" },
               { icon: TrendingDown, label: "Budget Alerts", color: "text-brand-primary", bg: "bg-brand-primary/10" },
               { icon: Info, label: "Usage Insights", color: "text-ink-muted", bg: "bg-surface" },
             ].map((action, i) => (
               <button key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-panel hover:bg-surface transition-all text-left group">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.bg} ${action.color}`}>
                    <action.icon size={20} />
                  </div>
                  <span className="text-sm font-bold text-ink-heading group-hover:text-brand-primary transition-colors">{action.label}</span>
               </button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
