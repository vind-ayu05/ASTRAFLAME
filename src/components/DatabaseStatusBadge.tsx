// DatabaseStatusBadge: indicator in top navigation showing Dual-Database Architecture
// (Primary Supabase PostgreSQL + Secondary Analytical PostgreSQL + Outbox Synchronization Pipeline).
// Clicking opens a diagnostic drawer with dual connection health, outbox queue metrics, and Supabase Auth.

import { useState } from 'react';
import { Database, CheckCircle, RefreshCw, X, Server, ShieldCheck, User, LogIn, LogOut, ArrowRightLeft, Activity } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext.tsx';

export function DatabaseStatusBadge() {
  const { status, dualHealth, triggerSync, loading, refresh, user, signIn, signUp, signOut } = useDatabase();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'sync' | 'auth'>('status');
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  const handleTriggerSync = async () => {
    setSyncing(true);
    await triggerSync();
    setSyncing(false);
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

  const isPrimaryConnected = dualHealth ? dualHealth.primary.connected : status.connected;
  const isSecondaryConnected = dualHealth ? dualHealth.secondary.connected : false;
  const syncInfo = dualHealth?.synchronization;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        title={status.message}
        aria-label="Dual Database Architecture Status"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-subtle bg-bg-card px-2.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
      >
        <Database size={14} className={isPrimaryConnected ? 'text-emerald-400' : 'text-amber-400'} />
        <span className="hidden lg:inline text-[11px] font-mono">
          {isPrimaryConnected ? 'Dual DB' : 'DB Ready'}
        </span>
        <div className="flex items-center gap-1">
          <span
            title="Primary Supabase DB"
            className={`h-1.5 w-1.5 rounded-full ${
              isPrimaryConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span
            title="Secondary Analytical DB"
            className={`h-1.5 w-1.5 rounded-full ${
              isSecondaryConnected ? 'bg-cyan-400' : 'bg-gray-500'
            }`}
          />
        </div>
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
                  Dual-Database Architecture
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
                Dual DB Status
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sync')}
                className={`px-3 py-1.5 font-medium border-b-2 transition-colors flex items-center gap-1 ${
                  activeTab === 'sync'
                    ? 'border-brand-orange text-text-primary'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                <ArrowRightLeft size={12} />
                <span>Sync Pipeline</span>
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

            {/* Tab 1: Dual Database Status */}
            {activeTab === 'status' && (
              <div className="space-y-3 text-xs">
                {/* Primary DB Box */}
                <div className="rounded-lg border border-subtle/70 bg-bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server size={14} className="text-brand-orange" />
                      <span className="font-semibold text-text-primary">Primary Database (Authoritative)</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                      isPrimaryConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isPrimaryConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {isPrimaryConnected ? 'Connected' : 'Standby Seed'}
                    </span>
                  </div>
                  <p className="text-text-secondary text-[11px]">
                    Supabase PostgreSQL: Source of truth for users, experiments, evidence records, and active scenarios.
                  </p>
                  {dualHealth?.primary.latencyMs && (
                    <p className="font-mono text-[10px] text-text-muted">
                      Latency: {dualHealth.primary.latencyMs}ms | Engine: pg.Pool & Prisma ORM
                    </p>
                  )}
                </div>

                {/* Secondary DB Box */}
                <div className="rounded-lg border border-subtle/70 bg-bg-card p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-cyan-400" />
                      <span className="font-semibold text-text-primary">Secondary Database (Analytical)</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                      isSecondaryConnected ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isSecondaryConnected ? 'bg-cyan-400' : 'bg-gray-400'}`} />
                      {isSecondaryConnected ? 'Connected' : 'Standby'}
                    </span>
                  </div>
                  <p className="text-text-secondary text-[11px]">
                    Separate PostgreSQL: Handles heavy aggregations, historical statistics, flammability indices, and dashboard reporting.
                  </p>
                  {dualHealth?.secondary.latencyMs ? (
                    <p className="font-mono text-[10px] text-text-muted">
                      Latency: {dualHealth.secondary.latencyMs}ms | Pool: {dualHealth.secondary.pool?.idle || 0} idle connections
                    </p>
                  ) : (
                    <p className="text-[10px] text-text-muted">
                      Configured via <code className="bg-black/30 px-1 py-0.5 rounded">SECONDARY_DATABASE_URL</code>
                    </p>
                  )}
                </div>

                {/* Routing Policy Card */}
                <div className="rounded-lg border border-subtle p-3 bg-bg-card space-y-1">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <ShieldCheck size={13} className="text-brand-orange" />
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Intelligent Routing Matrix</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-text-secondary pt-1">
                    <span>• Writes: Primary Only</span>
                    <span>• Evidence Lookups: Primary</span>
                    <span>• Dashboard Analytics: {isSecondaryConnected ? 'Secondary' : 'Primary Fallback'}</span>
                    <span>• Historical Spread: {isSecondaryConnected ? 'Secondary' : 'Primary Fallback'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Synchronization Pipeline */}
            {activeTab === 'sync' && (
              <div className="space-y-3 text-xs">
                <div className="rounded-lg border border-subtle/70 bg-bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">Transactional Outbox Worker</span>
                    <span className="font-mono text-[11px] text-text-muted">
                      Mode: {syncInfo?.mode || 'Standby In-Memory Queue'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded bg-bg-subtle border border-subtle/50 text-center">
                      <p className="text-[10px] text-text-muted uppercase">Pending</p>
                      <p className="font-mono text-base font-semibold text-amber-400">{syncInfo?.pendingJobs ?? 0}</p>
                    </div>
                    <div className="p-2 rounded bg-bg-subtle border border-subtle/50 text-center">
                      <p className="text-[10px] text-text-muted uppercase">Synced</p>
                      <p className="font-mono text-base font-semibold text-emerald-400">{syncInfo?.syncedJobs ?? 0}</p>
                    </div>
                    <div className="p-2 rounded bg-bg-subtle border border-subtle/50 text-center">
                      <p className="text-[10px] text-text-muted uppercase">Failed</p>
                      <p className="font-mono text-base font-semibold text-red-400">{syncInfo?.failedJobs ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                    <span>Last Sync: {syncInfo?.lastSyncTimestamp ? new Date(syncInfo.lastSyncTimestamp).toLocaleTimeString() : 'Recent'}</span>
                    <button
                      type="button"
                      onClick={handleTriggerSync}
                      disabled={syncing}
                      className="px-2.5 py-1 rounded bg-brand-orange/10 border border-brand-orange/30 text-brand-orange hover:bg-brand-orange/20 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
                      <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                  </div>
                </div>

                <div className="rounded border border-subtle/50 p-3 bg-bg-card text-text-secondary text-[11px] space-y-1">
                  <p className="font-semibold text-text-primary">Guaranteed Properties:</p>
                  <p>✔ <strong>Non-blocking Writes:</strong> Writes commit to Primary immediately without blocking on Secondary.</p>
                  <p>✔ <strong>Idempotency:</strong> Payload hashing prevents duplicated aggregate metrics.</p>
                  <p>✔ <strong>Failure Isolation:</strong> If Secondary goes offline, Primary continues operating without interruption.</p>
                </div>
              </div>
            )}

            {/* Tab 3: Supabase Auth */}
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

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] text-text-secondary mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="researcher@nasa.gov"
                          className="w-full rounded border border-subtle bg-bg-card px-2.5 py-1.5 text-xs text-text-primary focus:border-brand-orange focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-secondary mb-1">Password</label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded border border-subtle bg-bg-card px-2.5 py-1.5 text-xs text-text-primary focus:border-brand-orange focus:outline-none"
                        />
                      </div>
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
