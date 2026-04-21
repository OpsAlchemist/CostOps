import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface UserData {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

export const UserManagement = () => {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboard, setShowOnboard] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', email: '', role: 'user' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/admin/users`);
      if (res.ok) setUsers(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await authFetch(`${BASE_URL}/admin/onboard-user`, {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        setSuccess('User created successfully');
        setShowOnboard(false);
        setNewUser({ username: '', password: '', name: '', email: '', role: 'user' });
        fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Failed to create user');
      }
    } catch { setError('Unable to connect to server'); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await authFetch(`${BASE_URL}/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) { setSuccess('User deleted'); fetchUsers(); }
      else { const d = await res.json().catch(() => ({})); setError(d.detail || 'Failed to delete'); }
    } catch { setError('Unable to connect'); }
    setDeleteConfirm(null);
  };

  const inputClass = "px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium focus:outline-hidden focus:border-brand-primary w-full";

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black mb-1">User Management</h1>
          <p className="text-sm text-ink-muted font-medium">Manage users and roles.</p>
        </div>
        <button onClick={() => setShowOnboard(true)} className="btn-primary flex items-center gap-2">
          <UserPlus size={18} /> Onboard User
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-bold">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-bold">{success}</div>}

      {showOnboard && (
        <div className="panel-card p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">New User</h2>
            <button onClick={() => setShowOnboard(false)}><X size={20} /></button>
          </div>
          <form onSubmit={handleOnboard} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className={inputClass} required />
            <input placeholder="Email" type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className={inputClass} required />
            <input placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className={inputClass} required />
            <input placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className={inputClass} required />
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className={inputClass}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn-primary">Create User</button>
          </form>
        </div>
      )}

      <div className="panel-card">
        <div className="p-8 border-b border-border flex items-center gap-2">
          <Users size={20} className="text-brand-primary" />
          <h2 className="text-lg font-bold">All Users ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">ID</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Username</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Name</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Email</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Role</th>
                <th className="px-8 py-4 text-[10px] font-bold text-ink-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-8 py-4 text-sm text-ink-muted">{u.id}</td>
                  <td className="px-8 py-4 text-sm font-bold text-ink-heading">{u.username}</td>
                  <td className="px-8 py-4 text-sm text-ink-heading">{u.name}</td>
                  <td className="px-8 py-4 text-sm text-ink-muted">{u.email}</td>
                  <td className="px-8 py-4">
                    <span className={`tag-badge ${u.role === 'admin' ? 'tag-blue' : 'tag-green'}`}>{u.role}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    {deleteConfirm === u.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-danger font-bold">Delete?</span>
                        <button onClick={() => handleDelete(u.id)} className="p-1 text-danger hover:bg-danger/10 rounded"><Check size={16} /></button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-1 text-ink-muted hover:bg-surface rounded"><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(u.id)} className="p-2 rounded-lg bg-surface border border-border hover:border-danger group transition-all">
                        <Trash2 size={16} className="text-ink-muted group-hover:text-danger" />
                      </button>
                    )}
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
