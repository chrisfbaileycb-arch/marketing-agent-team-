import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, setDoc, getDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// ---------------------------------------------------------------------------
// Types the pages depend on. Every persisted record carries ownerUid so the
// Firestore rules can scope everything to one operator.
// ---------------------------------------------------------------------------
export interface Agent {
  id: string; name: string; status: 'active' | 'idle' | 'paused' | 'running'; efficiency: number; campaignId?: string;
  schedule?: 'nightly' | 'off'; mode?: 'vertical' | 'scout'; vertical?: string; region?: string; minPayout?: number; notes?: string; channels?: string[];
}
export interface Campaign { id: string; name: string; budget: number; payout: number; status: 'active' | 'paused'; bannerUrl?: string }
export interface Offer {
  id: string; name: string; category: string; payout: number; commission: string; epc: number | null; hot: boolean; imageUrl: string;
  signupUrl?: string; network?: string; status?: string; payoutUnit?: string;
}
export interface AdSpendRequest { id: string; agentId: string; amount: number; reason: string; status: 'pending' | 'approved' | 'denied' }
export type ProtectedSurface = 'dashboard' | 'campaigns' | 'workflows';
export interface HttpsLayer {
  id: string; name: string; type: 'residential' | 'datacenter' | 'mobile'; ipAddress: string; protectedSurface: ProtectedSurface;
  apiKeyRequired: boolean; status: 'active' | 'paused'; trafficUsed: number; sslVersion: string; latency: number;
}
export interface Certificate { id: string; domain: string; issuer: string; status: 'valid' | 'expiring' | 'expired'; expiryDate: string }
export interface MarketingProject {
  id: string; name: string; platform: 'Shopify' | 'HubSpot' | 'Meta Ads' | 'Google Ads' | 'Custom Webhook';
  status: 'connected' | 'disconnected'; webhookUrl?: string; hasToken: boolean;
}
export interface AffiliateSale {
  id: string; campaignName: string; product: string; amount: number; commission: number; status: 'pending' | 'approved' | 'paid'; agentName: string;
}
export interface WorkflowLog { id: string; timestamp: Date; message: string; type: 'info' | 'success' | 'warning' | 'error' }
export interface IncomingWebhook {
  id: string; name: string; token: string; targetAgentId: string; targetCampaignId: string; status: 'active' | 'paused';
  triggerCount: number; lastTriggeredAt: Date | null;
}
export interface Proposal {
  id: string; type: 'opportunity' | 'affiliate_program' | 'marketing_content'; status: 'awaiting_approval' | 'approved' | 'rejected' | 'applied';
  title: string; summary: string; data: any; createdAt: Date | null; taskId: string; agentId?: string;
}
export type SecurityHeaders = Record<string, boolean>;

interface AppContextType {
  user: User | null; loading: boolean; signIn: () => Promise<void>; signOutUser: () => Promise<void>;
  agents: Agent[]; campaigns: Campaign[]; offers: Offer[]; adSpendRequests: AdSpendRequest[];
  httpsLayers: HttpsLayer[]; certificates: Certificate[]; securityHeaders: SecurityHeaders;
  marketingProjects: MarketingProject[]; affiliateSales: AffiliateSale[]; workflowLogs: WorkflowLog[];
  incomingWebhooks: IncomingWebhook[]; proposals: Proposal[];
  scoutDiscoveryFilters: { minimumPayout: number; maximumPayout: number };
  addAgent: (name: string, extra?: Partial<Agent>) => Promise<void>; deleteAgent: (id: string) => Promise<void>;
  updateAgent: (id: string, patch: Partial<Agent>) => Promise<void>;
  requestAdSpend: (agentId: string, amount: number, reason: string) => Promise<void>;
  approveAdSpend: (id: string) => Promise<void>; denyAdSpend: (id: string) => Promise<void>;
  addCampaign: (name: string, budget: number, payout: number) => Promise<void>; toggleCampaignStatus: (id: string) => Promise<void>;
  toggleHttpsLayer: (id: string) => Promise<void>; toggleLayerApiKeyRequirement: (id: string) => Promise<void>;
  addHttpsLayer: (name: string, type: HttpsLayer['type'], ip: string, surface: ProtectedSurface, apiKeyRequired: boolean) => Promise<void>;
  addCertificate: (domain: string, issuer: string) => Promise<void>; toggleSecurityHeader: (key: string) => Promise<void>;
  connectProject: (name: string, platform: MarketingProject['platform'], apiToken: string, webhookUrl?: string) => Promise<void>;
  disconnectProject: (id: string) => Promise<void>;
  addAffiliateSale: (sale: Omit<AffiliateSale, 'id'>) => Promise<void>;
  addWorkflowLog: (type: WorkflowLog['type'], message: string) => void; clearWorkflowLogs: () => void;
  addIncomingWebhook: (name: string, agentId: string, campaignId: string) => Promise<void>;
  deleteIncomingWebhook: (id: string) => Promise<void>; toggleIncomingWebhookStatus: (id: string) => Promise<void>;
  recordWebhookTrigger: (id: string) => Promise<void>;
  decideProposal: (id: string, status: Proposal['status']) => Promise<void>;
  enqueueTask: (task: { skill: string; agentId?: string; campaignId?: string; input: Record<string, unknown>; dryRun?: boolean }) => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_HEADERS: SecurityHeaders = { hsts: true, csp: true, xfo: true, referrer: true, permissions: false };

/** Subscribe to an owner-scoped collection and keep it in state. */
function useOwnedCollection<T extends { id: string }>(uid: string | undefined, name: string, order?: string) {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    if (!uid) { setItems([]); return; }
    const base = collection(db, name);
    const q = order
      ? query(base, where('ownerUid', '==', uid), orderBy(order, 'desc'))
      : query(base, where('ownerUid', '==', uid));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => {
        const data = d.data();
        const norm: Record<string, unknown> = { id: d.id, ...data };
        for (const k of ['createdAt', 'lastTriggeredAt', 'decidedAt']) {
          const v = data[k];
          if (v && typeof v.toDate === 'function') norm[k] = v.toDate();
        }
        return norm as T;
      }));
    }, (err) => console.error(`snapshot ${name}:`, err));
  }, [uid, name, order]);
  return items;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([]);
  const [securityHeaders, setSecurityHeaders] = useState<SecurityHeaders>(DEFAULT_HEADERS);
  const uid = user?.uid;

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }), []);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'users', uid);
    getDoc(ref).then((s) => {
      if (!s.exists()) setDoc(ref, { ownerUid: uid, securityHeaders: DEFAULT_HEADERS, createdAt: serverTimestamp() });
    });
    return onSnapshot(ref, (s) => { const d = s.data(); if (d?.securityHeaders) setSecurityHeaders(d.securityHeaders); });
  }, [uid]);

  const agents = useOwnedCollection<Agent>(uid, 'agents');
  const campaigns = useOwnedCollection<Campaign>(uid, 'campaigns');
  const offers = useOwnedCollection<Offer>(uid, 'offers');
  const adSpendRequests = useOwnedCollection<AdSpendRequest>(uid, 'adSpendRequests');
  const httpsLayers = useOwnedCollection<HttpsLayer>(uid, 'httpsLayers');
  const certificates = useOwnedCollection<Certificate>(uid, 'certificates');
  const marketingProjects = useOwnedCollection<MarketingProject>(uid, 'marketingProjects');
  const affiliateSales = useOwnedCollection<AffiliateSale>(uid, 'affiliateSales');
  const incomingWebhooks = useOwnedCollection<IncomingWebhook>(uid, 'incomingWebhooks');
  const proposals = useOwnedCollection<Proposal>(uid, 'proposals', 'createdAt');

  const own = useCallback(() => { if (!uid) throw new Error('Sign in first'); return uid; }, [uid]);
  const add = useCallback(async (col: string, data: Record<string, unknown>) => {
    const ref = await addDoc(collection(db, col), { ...data, ownerUid: own(), createdAt: serverTimestamp() });
    return ref.id;
  }, [own]);
  const patch = useCallback((col: string, id: string, data: Record<string, unknown>) => updateDoc(doc(db, col, id), data as any), []);
  const remove = useCallback((col: string, id: string) => deleteDoc(doc(db, col, id)), []);

  const value: AppContextType = useMemo(() => ({
    user, loading,
    signIn: async () => { await signInWithPopup(auth, new GoogleAuthProvider()); },
    signOutUser: () => signOut(auth),
    agents, campaigns, offers, adSpendRequests, httpsLayers, certificates, securityHeaders,
    marketingProjects, affiliateSales, workflowLogs, incomingWebhooks, proposals,
    scoutDiscoveryFilters: { minimumPayout: 100, maximumPayout: 10000 },

    addAgent: async (name, extra = {}) => { await add('agents', { name, status: 'active', efficiency: 0, schedule: 'off', ...extra }); },
    deleteAgent: (id) => remove('agents', id),
    updateAgent: (id, p) => patch('agents', id, p),
    requestAdSpend: async (agentId, amount, reason) => { await add('adSpendRequests', { agentId, amount, reason, status: 'pending' }); },
    approveAdSpend: (id) => patch('adSpendRequests', id, { status: 'approved' }),
    denyAdSpend: (id) => patch('adSpendRequests', id, { status: 'denied' }),

    addCampaign: async (name, budget, payout) => { await add('campaigns', { name, budget, payout, status: 'active' }); },
    toggleCampaignStatus: async (id) => {
      const c = campaigns.find((x) => x.id === id); if (c) await patch('campaigns', id, { status: c.status === 'active' ? 'paused' : 'active' });
    },

    toggleHttpsLayer: async (id) => {
      const l = httpsLayers.find((x) => x.id === id); if (l) await patch('httpsLayers', id, { status: l.status === 'active' ? 'paused' : 'active' });
    },
    toggleLayerApiKeyRequirement: async (id) => {
      const l = httpsLayers.find((x) => x.id === id); if (l) await patch('httpsLayers', id, { apiKeyRequired: !l.apiKeyRequired });
    },
    addHttpsLayer: async (name, type, ipAddress, protectedSurface, apiKeyRequired) => {
      await add('httpsLayers', { name, type, ipAddress, protectedSurface, apiKeyRequired, status: 'active', trafficUsed: 0, sslVersion: 'TLS 1.3', latency: 0 });
    },
    addCertificate: async (domain, issuer) => {
      const expiry = new Date(); expiry.setDate(expiry.getDate() + 90);
      await add('certificates', { domain, issuer, status: 'valid', expiryDate: expiry.toISOString().slice(0, 10) });
    },
    toggleSecurityHeader: async (key) => {
      const next = { ...securityHeaders, [key]: !securityHeaders[key] };
      setSecurityHeaders(next);
      await setDoc(doc(db, 'users', own()), { securityHeaders: next }, { merge: true });
    },

    connectProject: async (name, platform, apiToken, webhookUrl) => {
      // Token is stored on the owner-only document. Acceptable for a single-operator tool;
      // move to Secret Manager if this is ever shared.
      await add('marketingProjects', { name, platform, status: 'connected', apiToken, webhookUrl: webhookUrl || '', hasToken: !!apiToken });
    },
    disconnectProject: (id) => remove('marketingProjects', id),

    addAffiliateSale: async (sale) => { await add('affiliateSales', sale); },
    addWorkflowLog: (type, message) => setWorkflowLogs((l) => [...l, { id: crypto.randomUUID(), timestamp: new Date(), type, message }]),
    clearWorkflowLogs: () => setWorkflowLogs([]),

    addIncomingWebhook: async (name, targetAgentId, targetCampaignId) => {
      const bytes = new Uint8Array(24); crypto.getRandomValues(bytes);
      const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      await add('incomingWebhooks', { name, token, targetAgentId, targetCampaignId, status: 'active', triggerCount: 0, lastTriggeredAt: null });
    },
    deleteIncomingWebhook: (id) => remove('incomingWebhooks', id),
    toggleIncomingWebhookStatus: async (id) => {
      const w = incomingWebhooks.find((x) => x.id === id); if (w) await patch('incomingWebhooks', id, { status: w.status === 'active' ? 'paused' : 'active' });
    },
    recordWebhookTrigger: async (id) => {
      const w = incomingWebhooks.find((x) => x.id === id);
      if (w) await patch('incomingWebhooks', id, { triggerCount: (w.triggerCount || 0) + 1, lastTriggeredAt: serverTimestamp() });
    },

    decideProposal: (id, status) => patch('proposals', id, { status, decidedAt: serverTimestamp() }),
    enqueueTask: (task) => add('workflow_tasks', { ...task, status: 'pending', progress: 0 }),
  }), [user, loading, agents, campaigns, offers, adSpendRequests, httpsLayers, certificates, securityHeaders,
       marketingProjects, affiliateSales, workflowLogs, incomingWebhooks, proposals, add, patch, remove, own]);

  return <AppContext.Provider value={value}>{!loading && children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
export const useAppContext = useApp;
