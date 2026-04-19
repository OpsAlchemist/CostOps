import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Layers, 
  Settings, 
  LogOut, 
  Bell, 
  Menu, 
  X, 
  TrendingDown,
  ChevronRight,
  User,
  Zap
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  icon: any;
  label: string;
  href: string;
  isActive: boolean;
  key?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, href, isActive }) => (
  <Link 
    to={href}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive 
      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
      : "text-ink-muted hover:bg-surface hover:text-ink-heading border border-transparent hover:border-border"
    }`}
  >
    <Icon size={20} />
    <span className="text-sm font-bold tracking-tight">{label}</span>
  </Link>
);

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: BarChart3, label: "Overview", href: "/overview" },
    { icon: TrendingDown, label: "Optimization", href: "/optimization" },
    { icon: Layers, label: "Infrastructure", href: "/infrastructure" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-panel border-r border-border p-6 fixed h-screen">
        <div className="flex items-center gap-2.5 mb-10 px-2">
          <div className="w-8 h-8 bg-brand-primary rounded-[6px] flex items-center justify-center text-white font-black">
            C
          </div>
          <span className="font-bold text-ink-heading tracking-tight">CostOps AI</span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {menuItems.map(item => (
            <SidebarItem 
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={location.pathname === item.href}
            />
          ))}
        </nav>

        <div className="pt-6 border-t border-border flex flex-col gap-2">
           <SidebarItem 
            icon={LogOut} 
            label="Log out" 
            href="/login" 
            isActive={false}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-panel border-b border-border px-8 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="w-8 h-8 bg-brand-primary rounded-[6px] flex items-center justify-center text-white font-black">
              C
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-sm font-bold text-ink-muted">
             <span>Portal</span>
             <ChevronRight size={14} />
             <span className="text-ink-heading capitalize">{location.pathname.substring(1)}</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="p-2 rounded-lg bg-surface border border-border text-ink-muted hover:text-ink-heading relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-panel" />
            </button>
            <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-sm font-semibold text-ink-heading cursor-pointer hover:border-brand-primary/50" onClick={() => navigate('/settings')}>
              JD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-64 bg-panel z-[60] lg:hidden p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-brand-primary rounded-[6px] flex items-center justify-center text-white font-black">
                    C
                  </div>
                  <span className="font-bold text-ink-heading tracking-tight">CostOps AI</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-2 flex-1">
                {menuItems.map(item => (
                  <SidebarItem 
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isActive={location.pathname === item.href}
                  />
                ))}
              </nav>

              <div className="pt-6 border-t border-border mt-auto">
                 <SidebarItem 
                  icon={LogOut} 
                  label="Log out" 
                  href="/login" 
                  isActive={false}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
