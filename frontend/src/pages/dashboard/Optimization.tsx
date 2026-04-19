import { useEffect, useState } from 'react';
import { TrendingDown, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { apiService } from '../../services/apiService';

export const Optimization = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getRecommendations();
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
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
          <h1 className="text-2xl font-black mb-1">Optimization Center</h1>
          <p className="text-sm text-ink-muted font-medium">Auto-identified savings for your cloud infrastructure.</p>
        </div>
        <button className="btn-primary">
          Apply All Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="panel-card p-6 flex items-center gap-4 shadow-lg shadow-success/10 border-success/20">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
            <TrendingDown size={24} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Active Savings</div>
            <div className="text-2xl font-bold text-ink-heading tracking-tight">$42,500.00</div>
          </div>
        </div>
        <div className="panel-card p-6 flex items-center gap-4 border-amber-200">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Pending Actions</div>
            <div className="text-2xl font-bold text-ink-heading tracking-tight">14 Recommendations</div>
          </div>
        </div>
        <div className="panel-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Optimized Assets</div>
            <div className="text-2xl font-bold text-ink-heading tracking-tight">85% Correctly Sized</div>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="p-8 border-b border-border flex justify-between items-center">
           <h2 className="text-lg font-bold">Active Recommendations</h2>
           <div className="flex gap-2">
              <span className="px-2 py-1 text-[10px] font-bold bg-surface rounded border border-border">AWS</span>
              <span className="px-2 py-1 text-[10px] font-bold bg-surface rounded border border-border opacity-50">GCP</span>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Recommendation</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Region</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Est. Savings</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec) => (
                <tr key={rec.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-ink-heading">{rec.title}</span>
                         <span className={`tag-badge ${rec.tag}`}>{rec.status}</span>
                      </div>
                      <p className="text-xs text-ink-muted max-w-sm">{rec.desc}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-ink-heading uppercase tracking-widest">{rec.region}</td>
                  <td className="px-8 py-6 text-sm font-bold text-success">{rec.savings}</td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 rounded-lg bg-surface border border-border hover:border-brand-primary group transition-all">
                      <ArrowUpRight size={16} className="text-ink-muted group-hover:text-brand-primary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
