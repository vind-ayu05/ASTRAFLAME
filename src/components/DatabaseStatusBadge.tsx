// DatabaseStatusBadge: subtle indicator in top navigation showing Supabase & PostgreSQL connection status.
// Clicking opens a diagnostic drawer with connection health, table status, and Supabase Auth session management.

import { useState } from 'react';
import { Database, CheckCircle, AlertCircle, RefreshCw, X, Server, ShieldCheck, User, LogIn, LogOut } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext.tsx';

export function DatabaseStatusBadge() {
  const { status, loading, refresh, user, signIn, signUp, signOut } = useDatabase();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'auth'>('status');
  const [refreshing, setRefreshing] = useState(false);

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthSubmitting(true);

    try {
      if (authMode === 'login') {
        await signIn(email, password);
        setAuthSuccess('Signed in successfully');
      } else {
        await signUp(email, password);
        setAuthSuccess('Account created & signed in successfully');
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const isConnected = status.connected;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        title={status.message}
        aria-label="Database Connection Status"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-subtle bg-bg-card px-2.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
      >
        <Database size={14} className={isConnected ? 'text-emerald-400' : 'text-amber-400'} />
        <span className="hidden lg:inline text-[11px] font-mono">
          {isConnected ? (status.provider === 'supabase' ? 'Supabase' : 'Postgres') : 'DB Ready'}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
          }`}
        />
        {user && <span className="h-2 w-2 rounded-full bg-brand-orange" title={`User: ${user.email || 'Active'}`} />}
      </button>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="db-status-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="card max-w-lg w-full p-6 space-y-4 shadow-xl border border-subtle bg-bg-elevated text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-brand-orange" />
                <h2 id="db-status-title" className="font-display text-base font-semibold text-text-primary">
                  Database & Auth Integration
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-subtle text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('status')}
                className={`px-3 py-1.5 font-medium border-b-2 transition-colors ${
                  activeTab === 'status'
                    ? 'border-brand-orange text-text-primary'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                Database Diagnostics
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('auth')}
                className={`px-3 py-1.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'auth'
                    ? 'border-brand-orange text-text-primary'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                <User size={12} />
                <span>Supabase Auth {user ? '(Active)' : ''}</span>
              </button>
            </div>

            {/* Tab 1: Database Status */}
            {activeTab === 'status' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 rounded-lg border border-subtle/50 bg-bg-card p-3">
                  {isConnected ? (
                    <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-text-primary">
                      {isConnected ? 'Database Connected' : 'Seed Data Active (Standby)'}
                    </p>
                    <p className="text-text-secondary mt-0.5">{status.message}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-subtle p-2.5 bg-bg-card">
                    <div className="flex items-center gap-1.5 text-text-secondary mb-1">
                      <Server size={13} className="text-brand-orange" />
                      <span className="font-medium">Primary Provider</span>
                    </div>
                    <p className="font-mono text-text-primary text-[11px]">
                      Supabase PostgreSQL
                    </p>
                  </div>
                  <div className="rounded border border-subtle p-2.5 bg-bg-card">
                    <div className="flex items-center gap-1.5 text-text-secondary mb-1">
                      <ShieldCheck size={13} className="text-brand-orange" />
                      <span className="font-medium">Direct Access ORM</span>
                    </div>
                    <p className="font-mono text-text-primary text-[11px]">
                      Prisma ORM / pg Pool
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-subtle p-3 bg-bg-card space-y-1.5">
                  <p className="font-semibold text-text-primary text-[11px] uppercase tracking-wider">
                    Schema Tables (Same Supabase Database)
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-text-secondary">
                    <span>• evidence_records ({status.recordCount})</span>
                    <span>• sources ({status.sourceCount})</span>
                    <span>• experiments (4)</span>
                    <span>• materials (4)</span>
                    <span>• scenarios (active)</span>
                    <span>• measurements (active)</span>
                    <span>• users (RLS protected)</span>
                    <span>• audit_logs (provenance)</span>
                  </div>
                </div>

                {!isConnected && (
                  <div className="rounded border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200 text-[11px] leading-relaxed">
                    <p className="font-semibold">Ready to connect live Supabase & PostgreSQL?</p>
                    <p className="mt-1">
                      Enter your <code className="font-mono bg-black/40 px-1 py-0.5 rounded">SUPABASE_URL</code>,{' '}
                      <code className="font-mono bg-black/40 px-1 py-0.5 rounded">SUPABASE_ANON_KEY</code>, and{' '}
                      <code className="font-mono bg-black/40 px-1 py-0.5 rounded">DATABASE_URL</code> in your{' '}
                      <code className="font-mono bg-black/40 px-1 py-0.5 rounded">.env</code> file.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Supabase Auth */}
            {activeTab === 'auth' && (
              <div className="space-y-4 text-xs">
                {user ? (
                  <div className="rounded-lg border border-subtle bg-bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle size={16} />
                      <span className="font-semibold">Authenticated Researcher</span>
                    </div>
                    <p className="text-text-secondary">
                      Signed in as: <span className="font-mono font-medium text-text-primary">{user.email || user.id}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-subtle text-xs text-text-secondary hover:text-text-primary hover:border-red-500/40"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setAuthError(null); }}
                        className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                          authMode === 'login'
                            ? 'border-brand-orange bg-brand-orange/10 text-brand-orange font-medium'
                            : 'border-subtle text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('register'); setAuthError(null); }}
                        className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                          authMode === 'register'
                            ? 'border-brand-orange bg-brand-orange/10 text-brand-orange font-medium'
                            : 'border-subtle text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        Register
                      </button>
                    </div>

                    {authError && (
                      <p className="text-xs text-red-400 rounded bg-red-400/10 border border-red-400/20 p-2">
                        {authError}
                      </p>
                    )}
                    {authSuccess && (
                      <p className="text-xs text-emerald-400 rounded bg-emerald-400/10 border border-emerald-400/20 p-2">
                        {authSuccess}
                      </p>
                    )}

                    <div>
                      <label className="block text-[11px] font-medium text-text-secondary mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="researcher@nasa.gov"
                        className="w-full rounded border border-subtle bg-bg-card px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-orange"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-text-secondary mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded border border-subtle bg-bg-card px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-orange"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full py-2 px-3 rounded bg-brand-orange text-[#090B0E] font-semibold text-xs transition-colors hover:bg-brand-orange-2 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <LogIn size={13} />
                      <span>{authSubmitting ? 'Authenticating...' : authMode === 'login' ? 'Sign In' : 'Create Researcher Account'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary disabled:opacity-50"
              >
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-md bg-brand-orange text-black font-medium hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
