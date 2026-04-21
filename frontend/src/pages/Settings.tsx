import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

interface CloudCredState {
  accessKeyId: string;
  secretAccessKey: string;
  status: 'idle' | 'loading' | 'connected' | 'error';
  error: string;
}

const defaultCredState = (): CloudCredState => ({
  accessKeyId: '',
  secretAccessKey: '',
  status: 'idle',
  error: '',
});

const MASKED_KEY = '••••••••••••••••';

const CLOUD_PROVIDERS = [
  { key: 'aws', label: 'Amazon Web Services (AWS)' },
  { key: 'azure', label: 'Microsoft Azure' },
  { key: 'gcp', label: 'Google Cloud Platform (GCP)' },
] as const;

export const Settings = () => {
  const { authFetch } = useAuth();
  const [showProfileForm, setShowProfileForm] = useState(true);
  const [profileData, setProfileData] = useState({ name: '', email: '', company: '', bio: '' });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [cloudCreds, setCloudCreds] = useState<Record<string, CloudCredState>>({
    aws: defaultCredState(),
    azure: defaultCredState(),
    gcp: defaultCredState(),
  });

  const handleCloudConnect = async (provider: string) => {
    const cred = cloudCreds[provider];
    if (!cred.accessKeyId || !cred.secretAccessKey) return;

    setCloudCreds((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], status: 'loading', error: '' },
    }));

    try {
      const res = await authFetch(`${BASE_URL}/user/connect-cloud`, {
        method: 'POST',
        body: JSON.stringify({
          cloud_provider: provider,
          access_key_id: cred.accessKeyId,
          secret_access_key: cred.secretAccessKey,
        }),
      });

      if (res.ok) {
        setCloudCreds((prev) => ({
          ...prev,
          [provider]: {
            accessKeyId: MASKED_KEY,
            secretAccessKey: MASKED_KEY,
            status: 'connected',
            error: '',
          },
        }));
      } else {
        const data = await res.json().catch(() => ({}));
        setCloudCreds((prev) => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            status: 'error',
            error: data.detail || 'Failed to save credentials.',
          },
        }));
      }
    } catch {
      setCloudCreds((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          status: 'error',
          error: 'Unable to connect to server.',
        },
      }));
    }
  };

  const updateCred = (provider: string, field: 'accessKeyId' | 'secretAccessKey', value: string) => {
    setCloudCreds((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value, status: prev[provider].status === 'error' ? 'idle' : prev[provider].status },
    }));
  };

  const fetchProfile = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/user/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          company: data.company || '',
          bio: data.bio || '',
        });
      }
    } catch {
      // silently fail on fetch
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      const res = await authFetch(`${BASE_URL}/user/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        setNotification({ type: 'success', message: 'Profile updated successfully.' });
      } else if (res.status === 409) {
        setNotification({ type: 'error', message: 'Email already in use.' });
      } else {
        const data = await res.json().catch(() => ({}));
        setNotification({ type: 'error', message: data.detail || 'Failed to update profile.' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Unable to connect to server.' });
    } finally {
      setLoading(false);
    }
  };

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

      {/* Edit Profile Section */}
      <SettingsSection
        title="Edit Profile"
        description="Update your profile information."
      >
        {!showProfileForm ? (
          <button
            onClick={() => setShowProfileForm(true)}
            className="btn-primary px-6 py-2 self-start"
          >
            Edit Profile
          </button>
        ) : (
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
            {notification && (
              <div className={`px-4 py-3 rounded-lg text-sm font-medium ${notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {notification.message}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-ink-heading">Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium focus:outline-hidden focus:border-brand-primary"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-ink-heading">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium focus:outline-hidden focus:border-brand-primary"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-ink-heading">Company</label>
              <input
                type="text"
                value={profileData.company}
                onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium focus:outline-hidden focus:border-brand-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-ink-heading">Bio (optional)</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium focus:outline-hidden focus:border-brand-primary min-h-[80px]"
              />
            </div>
            <div className="flex gap-3 mt-2">
              <button type="submit" disabled={loading} className="btn-primary px-8">
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={() => { setShowProfileForm(false); setNotification(null); }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </SettingsSection>

      {/* Connect Cloud Accounts Section */}
      <SettingsSection
        title="Connect Cloud Accounts"
        description="Link your cloud provider credentials for cost analysis."
      >
        {CLOUD_PROVIDERS.map(({ key, label }) => {
          const cred = cloudCreds[key];
          const isConnected = cred.status === 'connected';
          const isLoading = cred.status === 'loading';
          return (
            <div key={key} className="flex flex-col gap-3 pb-6 border-b border-border last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink-heading">{label}</span>
                {isConnected && (
                  <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Connected</span>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Access Key ID"
                  value={cred.accessKeyId}
                  onChange={(e) => updateCred(key, 'accessKeyId', e.target.value)}
                  readOnly={isConnected}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium focus:outline-hidden focus:border-brand-primary"
                />
                <input
                  type="password"
                  placeholder="Secret Access Key"
                  value={cred.secretAccessKey}
                  onChange={(e) => updateCred(key, 'secretAccessKey', e.target.value)}
                  readOnly={isConnected}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium focus:outline-hidden focus:border-brand-primary"
                />
                <button
                  onClick={() => handleCloudConnect(key)}
                  disabled={isLoading || isConnected || !cred.accessKeyId || !cred.secretAccessKey}
                  className="btn-primary px-6 py-2 whitespace-nowrap"
                >
                  {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
                </button>
              </div>
              {cred.status === 'error' && cred.error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
                  {cred.error}
                </div>
              )}
            </div>
          );
        })}
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
