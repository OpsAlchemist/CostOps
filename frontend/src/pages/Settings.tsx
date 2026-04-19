import { User, Bell, Shield, CreditCard, Globe, Zap } from 'lucide-react';

const SettingsSection = ({ title, description, children }: any) => (
  <div className="panel-card overflow-hidden">
    <div className="p-8 border-b border-border bg-panel">
      <h3 className="text-lg font-bold text-ink-heading">{title}</h3>
      <p className="text-sm text-ink-muted">{description}</p>
    </div>
    <div className="p-8 flex flex-col gap-6">
      {children}
    </div>
  </div>
);

const SettingItem = ({ label, description, control }: any) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="max-w-md">
      <div className="text-sm font-bold text-ink-heading mb-1">{label}</div>
      <div className="text-xs text-ink-muted">{description}</div>
    </div>
    <div>{control}</div>
  </div>
);

export const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black mb-1">Account Settings</h1>
        <p className="text-sm text-ink-muted font-medium">Manage your profile, preferences, and organization.</p>
      </div>

      <nav className="flex gap-1 p-1 bg-panel border border-border rounded-xl">
        {["Profile", "Notifications", "Security", "Billing"].map((tab, i) => (
          <button 
            key={tab} 
            className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${i === 0 ? 'bg-brand-primary text-white' : 'text-ink-muted hover:bg-surface'}`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <SettingsSection 
        title="Personal Information" 
        description="Update your photo and personal details."
      >
        <SettingItem 
          label="Full Name" 
          description="Your name as it will appear on reports."
          control={<input type="text" defaultValue="John Doe" className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium focus:outline-hidden focus:border-brand-primary min-w-[240px]" />}
        />
        <SettingItem 
          label="Email Address" 
          description="The email associated with this account."
          control={<input type="email" defaultValue="john@costops.ai" className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium focus:outline-hidden focus:border-brand-primary min-w-[240px]" />}
        />
        <SettingItem 
          label="Profile Photo" 
          description="JPG or PNG. Max size 2MB."
          control={
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-lg font-bold">JD</div>
              <button className="text-xs font-bold text-brand-primary hover:underline">Change Photo</button>
            </div>
          }
        />
      </SettingsSection>

      <SettingsSection 
        title="Preferences" 
        description="Configure how you interact with the platform."
      >
        <SettingItem 
          label="Automatic Rightsizing" 
          description="Allow AI to automatically adjust instance sizes based on peak load."
          control={
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-border peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
            </div>
          }
        />
        <SettingItem 
          label="Optimization Frequency" 
          description="How often should AI scan your infrastructure for costs."
          control={
            <select className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-bold focus:outline-hidden min-w-[240px]">
              <option>Real-time</option>
              <option>Every 6 hours</option>
              <option>Daily</option>
            </select>
          }
        />
      </SettingsSection>
      
      <div className="flex justify-end gap-3 mb-10">
        <button className="btn-secondary">Discard Changes</button>
        <button className="btn-primary px-10">Save Settings</button>
      </div>
    </div>
  );
};
