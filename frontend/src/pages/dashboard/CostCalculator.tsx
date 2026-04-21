import { useState } from 'react';
import { Calculator, Server, HardDrive, Zap, DollarSign, RefreshCw, Cloud } from 'lucide-react';

type CloudProvider = 'aws' | 'azure' | 'gcp';

interface ServiceOption {
  id: string;
  icon: typeof Server;
  label: string;
}

interface RegionOption {
  value: string;
  label: string;
}

interface ProviderConfig {
  label: string;
  services: ServiceOption[];
  regions: RegionOption[];
}

const PROVIDER_CONFIGS: Record<CloudProvider, ProviderConfig> = {
  aws: {
    label: 'AWS',
    services: [
      { id: 'ec2', icon: Server, label: 'EC2' },
      { id: 's3', icon: HardDrive, label: 'S3' },
      { id: 'lambda', icon: Zap, label: 'Lambda' },
    ],
    regions: [
      { value: 'us-east-1', label: 'US East (N. Virginia)' },
      { value: 'us-east-2', label: 'US East (Ohio)' },
      { value: 'us-west-1', label: 'US West (N. California)' },
      { value: 'us-west-2', label: 'US West (Oregon)' },
      { value: 'eu-west-1', label: 'EU (Ireland)' },
      { value: 'eu-central-1', label: 'EU (Frankfurt)' },
      { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
      { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    ],
  },
  azure: {
    label: 'Azure',
    services: [
      { id: 'virtual_machines', icon: Server, label: 'Virtual Machines' },
      { id: 'blob_storage', icon: HardDrive, label: 'Blob Storage' },
      { id: 'functions', icon: Zap, label: 'Functions' },
    ],
    regions: [
      { value: 'eastus', label: 'East US' },
      { value: 'eastus2', label: 'East US 2' },
      { value: 'westus', label: 'West US' },
      { value: 'westus2', label: 'West US 2' },
      { value: 'westeurope', label: 'West Europe' },
      { value: 'northeurope', label: 'North Europe' },
      { value: 'southeastasia', label: 'Southeast Asia' },
      { value: 'eastasia', label: 'East Asia' },
    ],
  },
  gcp: {
    label: 'GCP',
    services: [
      { id: 'compute_engine', icon: Server, label: 'Compute Engine' },
      { id: 'cloud_storage', icon: HardDrive, label: 'Cloud Storage' },
      { id: 'cloud_functions', icon: Zap, label: 'Cloud Functions' },
    ],
    regions: [
      { value: 'us-central1', label: 'US Central (Iowa)' },
      { value: 'us-east1', label: 'US East (South Carolina)' },
      { value: 'us-west1', label: 'US West (Oregon)' },
      { value: 'europe-west1', label: 'Europe West (Belgium)' },
      { value: 'europe-west2', label: 'Europe West (London)' },
      { value: 'asia-east1', label: 'Asia East (Taiwan)' },
      { value: 'asia-southeast1', label: 'Asia Southeast (Singapore)' },
      { value: 'asia-northeast1', label: 'Asia Northeast (Tokyo)' },
    ],
  },
};

const AWS_INSTANCE_TYPES = [
  't2.nano', 't2.micro', 't2.small', 't2.medium', 't2.large', 't2.xlarge',
  't3.nano', 't3.micro', 't3.small', 't3.medium', 't3.large',
  'm5.large', 'm5.xlarge', 'm5.2xlarge',
  'c5.large', 'c5.xlarge',
  'r5.large', 'r5.xlarge',
];

const AZURE_VM_SIZES = [
  'Standard_B1s', 'Standard_B1ms', 'Standard_B2s', 'Standard_B2ms',
  'Standard_D2s_v3', 'Standard_D4s_v3', 'Standard_D8s_v3',
  'Standard_E2s_v3', 'Standard_E4s_v3',
  'Standard_F2s_v2', 'Standard_F4s_v2',
];

const GCP_MACHINE_TYPES = [
  'e2-micro', 'e2-small', 'e2-medium',
  'e2-standard-2', 'e2-standard-4', 'e2-standard-8',
  'n1-standard-1', 'n1-standard-2', 'n1-standard-4',
  'n2-standard-2', 'n2-standard-4',
  'c2-standard-4', 'c2-standard-8',
];

const inputClass = "w-full px-4 py-3 rounded-lg border border-border bg-surface focus:outline-hidden focus:border-brand-primary transition-colors text-sm";
const labelClass = "text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1";

export const CostCalculator = () => {
  const [cloudProvider, setCloudProvider] = useState<CloudProvider>('aws');
  const [service, setService] = useState<string>('ec2');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Compute / VM params
  const [instanceType, setInstanceType] = useState('t2.micro');
  const [vmSize, setVmSize] = useState('Standard_B1s');
  const [machineType, setMachineType] = useState('e2-micro');
  const [region, setRegion] = useState('us-east-1');
  const [hours, setHours] = useState(720);
  const [os, setOs] = useState('linux');

  // Storage params
  const [storageGb, setStorageGb] = useState(100);
  const [accessFrequency, setAccessFrequency] = useState('frequent');

  // Functions / Lambda params
  const [lambdaRequests, setLambdaRequests] = useState(1000000);
  const [durationMs, setDurationMs] = useState(200);
  const [memoryMb, setMemoryMb] = useState(128);

  const providerConfig = PROVIDER_CONFIGS[cloudProvider];

  const handleProviderChange = (provider: CloudProvider) => {
    setCloudProvider(provider);
    const firstService = PROVIDER_CONFIGS[provider].services[0].id;
    setService(firstService);
    const firstRegion = PROVIDER_CONFIGS[provider].regions[0].value;
    setRegion(firstRegion);
    setResult(null);
    setError('');
  };

  const isComputeService = service === 'ec2' || service === 'virtual_machines' || service === 'compute_engine';
  const isStorageService = service === 's3' || service === 'blob_storage' || service === 'cloud_storage';
  const isFunctionsService = service === 'lambda' || service === 'functions' || service === 'cloud_functions';

  const buildParams = () => {
    if (isComputeService) {
      const base = { region, hours, operating_system: os };
      if (cloudProvider === 'aws') return { ...base, instance_type: instanceType };
      if (cloudProvider === 'azure') return { ...base, vm_size: vmSize };
      return { ...base, machine_type: machineType };
    }
    if (isStorageService) {
      return { storage_gb: storageGb, region, access_frequency: accessFrequency };
    }
    if (isFunctionsService) {
      return { requests: lambdaRequests, duration_ms: durationMs, memory_mb: memoryMb, region };
    }
    return {};
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${baseUrl}/calculate-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_provider: cloudProvider, service, parameters: buildParams() })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getServiceLabel = () => {
    const svc = providerConfig.services.find(s => s.id === service);
    return svc ? svc.label : service.toUpperCase();
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black mb-1">{providerConfig.label} Cost Calculator</h1>
        <p className="text-sm text-ink-muted font-medium">Estimate costs for {providerConfig.label} services with real-time pricing.</p>
      </div>

      {/* Cloud provider selector */}
      <div className="flex gap-3">
        {(Object.keys(PROVIDER_CONFIGS) as CloudProvider[]).map(provider => (
          <button
            key={provider}
            onClick={() => handleProviderChange(provider)}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all ${
              cloudProvider === provider
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                : 'bg-panel border border-border text-ink-muted hover:bg-surface'
            }`}
          >
            <Cloud size={18} />
            {PROVIDER_CONFIGS[provider].label}
          </button>
        ))}
      </div>

      {/* Service selector */}
      <div className="flex gap-3">
        {providerConfig.services.map(s => (
          <button
            key={s.id}
            onClick={() => { setService(s.id); setResult(null); setError(''); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all ${
              service === s.id
                ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30'
                : 'bg-panel border border-border text-ink-muted hover:bg-surface'
            }`}
          >
            <s.icon size={18} />
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="panel-card p-8 flex flex-col gap-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calculator size={20} className="text-brand-primary" />
            {getServiceLabel()} Parameters
          </h2>

          {isComputeService && (
            <>
              <div>
                <label className={labelClass}>
                  {cloudProvider === 'aws' ? 'Instance Type' : cloudProvider === 'azure' ? 'VM Size' : 'Machine Type'}
                </label>
                {cloudProvider === 'aws' && (
                  <select value={instanceType} onChange={e => setInstanceType(e.target.value)} className={inputClass}>
                    {AWS_INSTANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
                {cloudProvider === 'azure' && (
                  <select value={vmSize} onChange={e => setVmSize(e.target.value)} className={inputClass}>
                    {AZURE_VM_SIZES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
                {cloudProvider === 'gcp' && (
                  <select value={machineType} onChange={e => setMachineType(e.target.value)} className={inputClass}>
                    {GCP_MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className={labelClass}>Region</label>
                <select value={region} onChange={e => setRegion(e.target.value)} className={inputClass}>
                  {providerConfig.regions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Hours per Month</label>
                <input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} min={1} max={8760} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Operating System</label>
                <select value={os} onChange={e => setOs(e.target.value)} className={inputClass}>
                  <option value="linux">Linux</option>
                  <option value="windows">Windows</option>
                </select>
              </div>
            </>
          )}

          {isStorageService && (
            <>
              <div>
                <label className={labelClass}>Storage (GB)</label>
                <input type="number" value={storageGb} onChange={e => setStorageGb(Number(e.target.value))} min={1} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Region</label>
                <select value={region} onChange={e => setRegion(e.target.value)} className={inputClass}>
                  {providerConfig.regions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Access Frequency</label>
                <select value={accessFrequency} onChange={e => setAccessFrequency(e.target.value)} className={inputClass}>
                  <option value="frequent">Frequent</option>
                  <option value="infrequent">Infrequent</option>
                  <option value="rare">Rare</option>
                </select>
              </div>
            </>
          )}

          {isFunctionsService && (
            <>
              <div>
                <label className={labelClass}>Requests per Month</label>
                <input type="number" value={lambdaRequests} onChange={e => setLambdaRequests(Number(e.target.value))} min={1} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Avg Duration (ms)</label>
                <input type="number" value={durationMs} onChange={e => setDurationMs(Number(e.target.value))} min={1} max={900000} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Memory (MB)</label>
                <select value={memoryMb} onChange={e => setMemoryMb(Number(e.target.value))} className={inputClass}>
                  {[128, 256, 512, 1024, 2048, 3072, 4096].map(m => (
                    <option key={m} value={m}>{m} MB</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Region</label>
                <select value={region} onChange={e => setRegion(e.target.value)} className={inputClass}>
                  {providerConfig.regions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </>
          )}

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <><RefreshCw size={18} className="animate-spin" /> Calculating...</>
            ) : (
              <><DollarSign size={18} /> Calculate Cost</>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-6">
          {error && (
            <div className="panel-card p-6 border-danger/30">
              <p className="text-danger font-bold text-sm">{error}</p>
            </div>
          )}

          {result && (
            <>
              <div className="panel-card p-8 shadow-lg shadow-success/10 border-success/20">
                <div className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Estimated Monthly Cost</div>
                <div className="text-4xl font-black text-ink-heading tracking-tight">
                  ${result.cost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-base font-bold text-ink-muted ml-2">{result.currency}</span>
                </div>
                {result.cache_hit && (
                  <span className="inline-block mt-3 px-2 py-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 rounded">Cached Result</span>
                )}
              </div>

              {result.recommendation && (
                <div className="panel-card p-8">
                  <h3 className="text-sm font-bold text-ink-heading mb-3 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" /> AI Recommendation
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-line">{result.recommendation}</p>
                </div>
              )}

              <div className="panel-card p-8">
                <h3 className="text-sm font-bold text-ink-heading mb-4 uppercase tracking-widest">Breakdown</h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(result.details || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-sm text-ink-muted capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-bold text-ink-heading">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!result && !error && (
            <div className="panel-card p-12 flex flex-col items-center justify-center text-center">
              <Calculator size={48} className="text-border mb-4" />
              <p className="text-ink-muted font-medium">Configure parameters and click Calculate to see estimated costs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
