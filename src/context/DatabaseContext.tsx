// Database Context for ASTRAFLAME
// Provides live database records, sync, and mutation operations across the entire application.

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ExperimentRecord, SourceRecord } from '../types/index.ts';
import {
  getLiveRecords,
  getLiveSources,
  getLiveScenarios,
  createLiveRecord,
  updateLiveRecord,
  deleteLiveRecord,
  saveLiveScenario,
  deleteLiveScenario,
  checkConnectivity,
  getDashboardStatistics,
} from '../services/databaseService.ts';
import type { DatabaseStatus, SavedScenario, DashboardStats } from '../services/databaseService.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { setDynamicRecords } from '../data/records.ts';
import { setDynamicSources } from '../data/sources.ts';

interface DatabaseContextValue {
  records: ExperimentRecord[];
  sources: SourceRecord[];
  scenarios: SavedScenario[];
  stats: DashboardStats;
  status: DatabaseStatus;
  loading: boolean;
  error: string | null;
  user: { id: string; email?: string } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  addRecord: (rec: ExperimentRecord) => Promise<ExperimentRecord>;
  updateRecord: (id: string, updates: Partial<ExperimentRecord>) => Promise<ExperimentRecord>;
  deleteRecord: (id: string) => Promise<boolean>;
  saveScenario: (scenario: Omit<SavedScenario, 'id'>) => Promise<SavedScenario>;
  deleteScenario: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<ExperimentRecord[]>([]);
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRecords: 25,
    totalExperiments: 4,
    totalSources: 8,
    totalMaterials: 4,
    totalScenarios: 4,
    tier1FlightRecords: 9,
    tier2LiteratureRecords: 16,
  });
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [status, setStatus] = useState<DatabaseStatus>({
    connected: false,
    provider: 'fallback',
    message: 'Initializing database...',
    recordCount: 0,
    sourceCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [recs, srcs, scens, connStatus, dashStats] = await Promise.all([
        getLiveRecords(),
        getLiveSources(),
        getLiveScenarios(),
        checkConnectivity(),
        getDashboardStatistics(),
      ]);

      setRecords(recs);
      setSources(srcs);
      setScenarios(scens);
      setStats(dashStats);
      setStatus({
        ...connStatus,
        recordCount: recs.length,
        sourceCount: srcs.length,
      });

      // Synchronize in-memory singletons so non-React components (chatEngine, sed-engine) get live records
      setDynamicRecords(recs);
      setDynamicSources(srcs);
    } catch (err: any) {
      console.error('[DatabaseProvider] Error loading database:', err);
      setError(err.message || 'Failed to initialize database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Setup Supabase Realtime subscriptions if configured
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
        } else {
          setUser(null);
        }
      });

      const channel = supabase
        .channel('db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'evidence_records' },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, [loadData]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) setUser({ id: data.user.id, email: data.user.email });
      return;
    }
    setUser({ id: 'local-researcher', email });
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) setUser({ id: data.user.id, email: data.user.email });
      return;
    }
    setUser({ id: 'local-researcher', email });
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  }, []);

  const addRecord = useCallback(
    async (rec: ExperimentRecord): Promise<ExperimentRecord> => {
      const created = await createLiveRecord(rec);
      setRecords((prev) => {
        const next = [...prev.filter((r) => r.record_id !== created.record_id), created];
        setDynamicRecords(next);
        return next;
      });
      return created;
    },
    []
  );

  const updateRecord = useCallback(
    async (id: string, updates: Partial<ExperimentRecord>): Promise<ExperimentRecord> => {
      const updated = await updateLiveRecord(id, updates);
      setRecords((prev) => {
        const next = prev.map((r) => (r.record_id === id ? { ...r, ...updated } : r));
        setDynamicRecords(next);
        return next;
      });
      return updated;
    },
    []
  );

  const deleteRecord = useCallback(async (id: string): Promise<boolean> => {
    const ok = await deleteLiveRecord(id);
    setRecords((prev) => {
      const next = prev.filter((r) => r.record_id !== id);
      setDynamicRecords(next);
      return next;
    });
    return ok;
  }, []);

  const saveScenario = useCallback(
    async (scenario: Omit<SavedScenario, 'id'>): Promise<SavedScenario> => {
      const saved = await saveLiveScenario(scenario);
      setScenarios((prev) => [saved, ...prev]);
      return saved;
    },
    []
  );

  const deleteScenario = useCallback(async (id: string): Promise<boolean> => {
    const ok = await deleteLiveScenario(id);
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    return ok;
  }, []);

  const value = useMemo(
    () => ({
      records,
      sources,
      scenarios,
      stats,
      status,
      loading,
      error,
      user,
      signIn,
      signUp,
      signOut,
      addRecord,
      updateRecord,
      deleteRecord,
      saveScenario,
      deleteScenario,
      refresh: loadData,
    }),
    [records, sources, scenarios, stats, status, loading, error, user, signIn, signUp, signOut, addRecord, updateRecord, deleteRecord, saveScenario, deleteScenario, loadData]
  );

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return ctx;
}
