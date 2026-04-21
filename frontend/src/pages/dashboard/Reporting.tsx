import { FileText, Download, Calendar, Filter } from 'lucide-react';

const reports = [
  { name: "Monthly Cost Summary", date: "Aug 2026", type: "Cost", status: "Ready" },
  { name: "Optimization Impact Report", date: "Aug 2026", type: "Savings", status: "Ready" },
  { name: "Infrastructure Audit", date: "Jul 2026", type: "Audit", status: "Ready" },
  { name: "Budget vs Actual", date: "Jul 2026", type: "Budget", status: "Ready" },
  { name: "Resource Utilization", date: "Jun 2026", type: "Usage", status: "Archived" },
];

export const Reporting = () => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black mb-1">Reports</h1>
          <p className="text-sm text-ink-muted font-medium">Generate and download cloud cost reports.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-panel border border-border rounded-lg text-sm font-bold text-ink-heading hover:bg-surface transition-all flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
          <button className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-hover transition-all flex items-center gap-2">
            <Calendar size={16} /> Generate Report
          </button>
        </div>
      </div>

      <div className="panel-card">
        <div className="p-8 border-b border-border">
          <h2 className="text-lg font-bold">Available Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Report Name</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Period</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Type</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-8 py-6 flex items-center gap-3">
                    <FileText size={18} className="text-brand-primary" />
                    <span className="text-sm font-bold text-ink-heading">{report.name}</span>
                  </td>
                  <td className="px-8 py-6 text-sm text-ink-muted">{report.date}</td>
                  <td className="px-8 py-6"><span className="tag-badge tag-blue">{report.type}</span></td>
                  <td className="px-8 py-6 text-xs font-bold text-success">{report.status}</td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 rounded-lg bg-surface border border-border hover:border-brand-primary group transition-all">
                      <Download size={16} className="text-ink-muted group-hover:text-brand-primary" />
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
