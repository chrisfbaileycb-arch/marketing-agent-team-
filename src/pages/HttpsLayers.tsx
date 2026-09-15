import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  Shield,
  Plus,
  Globe,
  Server,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Wifi,
  KeyRound,
  ShieldCheck,
  LayoutDashboard,
  Target,
  Workflow,
  LockKeyhole,
  Route,
} from 'lucide-react';
import Layout from '../components/Layout';
import { type ProtectedSurface, useApp } from '../context/AppContext';

const SURFACE_CONFIG: Record<ProtectedSurface, {
  label: string;
  path: string;
  description: string;
  icon: typeof LayoutDashboard;
}> = {
  dashboard: {
    label: 'Dashboard',
    path: '/',
    description: 'Member dashboard and overview data.',
    icon: LayoutDashboard,
  },
  campaigns: {
    label: 'Campaigns',
    path: '/campaigns',
    description: 'Campaign budget, performance, and activation controls.',
    icon: Target,
  },
  workflows: {
    label: 'Workflows',
    path: '/workflows',
    description: 'Workflow execution, webhooks, and connected APIs.',
    icon: Workflow,
  },
};

const HttpsLayers: React.FC = () => {
  const {
    httpsLayers,
    certificates,
    securityHeaders,
    toggleHttpsLayer,
    toggleLayerApiKeyRequirement,
    addHttpsLayer,
    addCertificate,
    toggleSecurityHeader,
  } = useApp();

  const [showProxyForm, setShowProxyForm] = useState(false);
  const [proxyName, setProxyName] = useState('');
  const [proxyType, setProxyType] = useState<'residential' | 'datacenter' | 'mobile'>('datacenter');
  const [proxyIp, setProxyIp] = useState('');
  const [protectedSurface, setProtectedSurface] = useState<ProtectedSurface>('dashboard');
  const [apiKeyRequired, setApiKeyRequired] = useState(true);

  const [showCertForm, setShowCertForm] = useState(false);
  const [certDomain, setCertDomain] = useState('');
  const [certIssuer, setCertIssuer] = useState("Let's Encrypt Authority X3");

  const handleAddProxy = (event: React.FormEvent) => {
    event.preventDefault();

    if (!proxyName || !proxyIp) {
      toast.error('Please fill in all HTTPS layer fields.');
      return;
    }

    const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;

    if (!ipPattern.test(proxyIp)) {
      toast.error('Please enter a valid IP address.');
      return;
    }

    addHttpsLayer(proxyName, proxyType, proxyIp, protectedSurface, apiKeyRequired);
    toast.success(`HTTPS layer "${proxyName}" deployed for ${SURFACE_CONFIG[protectedSurface].label}.`);
    setProxyName('');
    setProxyIp('');
    setProtectedSurface('dashboard');
    setApiKeyRequired(true);
    setShowProxyForm(false);
  };

  const handleAddCert = (event: React.FormEvent) => {
    event.preventDefault();

    if (!certDomain) {
      toast.error('Please enter a domain name.');
      return;
    }

    addCertificate(certDomain, certIssuer);
    toast.success(`SSL Certificate provisioned for ${certDomain}.`);
    setCertDomain('');
    setShowCertForm(false);
  };

  const activeLayers = httpsLayers.filter((layer) => layer.status === 'active');
  const protectedSurfaces = (Object.keys(SURFACE_CONFIG) as ProtectedSurface[]).map((surface) => {
    const layers = httpsLayers.filter((layer) => layer.protectedSurface === surface);
    const activeLayer = layers.find((layer) => layer.status === 'active');

    return {
      surface,
      layers,
      activeLayer,
    };
  });

  return (
    <Layout>
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-100 rounded-full text-xs font-bold text-brand-600 mb-2">
              <Shield className="w-3.5 h-3.5" />
              Edge Security Active
            </div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">HTTPS Security Layers</h1>
            <p className="text-slate-500 mt-1">
              Segment secure access for dashboard, campaign, and workflow surfaces before connecting backend API gates.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setShowProxyForm(!showProxyForm);
                setShowCertForm(false);
              }}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add HTTPS Layer
            </button>
            <button
              onClick={() => {
                setShowCertForm(!showCertForm);
                setShowProxyForm(false);
              }}
              className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-brand-500" /> Provision SSL
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {protectedSurfaces.map(({ surface, layers, activeLayer }) => {
            const config = SURFACE_CONFIG[surface];
            const Icon = config.icon;

            return (
              <div key={surface} className="bg-white rounded-3xl border border-slate-100 p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-brand-50 text-brand-500 rounded-2xl flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${
                    activeLayer
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {activeLayer ? 'Protected' : 'No Active Layer'}
                  </span>
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{config.label}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">{config.path}</p>
                  <p className="text-sm text-slate-500 mt-3 leading-relaxed">{config.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">{layers.length} configured layer{layers.length === 1 ? '' : 's'}</span>
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    activeLayer?.apiKeyRequired ? 'text-brand-500' : 'text-slate-400'
                  }`}>
                    <LockKeyhole className="w-3.5 h-3.5" />
                    {activeLayer?.apiKeyRequired ? 'API Key Gate' : 'Session Access'}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {showProxyForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAddProxy}
            className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6 shadow-sm"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">Deploy Route-Specific HTTPS Layer</h2>
              <p className="text-sm text-slate-500 mt-1">
                Assign secure transport and an optional API key requirement to an individual application surface.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Layer Name</label>
                <input
                  type="text"
                  value={proxyName}
                  onChange={(event) => setProxyName(event.target.value)}
                  placeholder="e.g. Workflow Production Edge"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Protected Surface</label>
                <select
                  value={protectedSurface}
                  onChange={(event) => setProtectedSurface(event.target.value as ProtectedSurface)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white"
                >
                  <option value="dashboard">Dashboard (/)</option>
                  <option value="campaigns">Campaigns (/campaigns)</option>
                  <option value="workflows">Workflows (/workflows)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Layer Type</label>
                <select
                  value={proxyType}
                  onChange={(event) => setProxyType(event.target.value as 'residential' | 'datacenter' | 'mobile')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white"
                >
                  <option value="datacenter">Datacenter (High Speed)</option>
                  <option value="residential">Residential (High Trust)</option>
                  <option value="mobile">Mobile (Distributed Access)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Gateway IP Address</label>
                <input
                  type="text"
                  value={proxyIp}
                  onChange={(event) => setProxyIp(event.target.value)}
                  placeholder="e.g. 185.220.101.5"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={apiKeyRequired}
                  onChange={(event) => setApiKeyRequired(event.target.checked)}
                  className="w-4 h-4 text-brand-500 border-slate-300 rounded focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-bold text-slate-900">Require API Key</span>
                  <span className="block text-xs text-slate-400 mt-1">Gate backend requests for this surface.</span>
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-600 transition-all">
                Deploy Layer
              </button>
              <button type="button" onClick={() => setShowProxyForm(false)} className="text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all">
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {showCertForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAddCert}
            className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-900">Provision SSL Certificate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Custom Domain</label>
                <input
                  type="text"
                  value={certDomain}
                  onChange={(event) => setCertDomain(event.target.value)}
                  placeholder="e.g. workflow.yourdomain.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Certificate Authority</label>
                <select
                  value={certIssuer}
                  onChange={(event) => setCertIssuer(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white"
                >
                  <option value="Let's Encrypt Authority X3">Let's Encrypt (Free, Auto-renew)</option>
                  <option value="DigiCert SHA2 Secure Server CA">DigiCert (Enterprise, High Trust)</option>
                  <option value="Sectigo RSA Domain Validation Secure Server CA">Sectigo (Standard DV)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-600 transition-all">
                Provision Certificate
              </button>
              <button type="button" onClick={() => setShowCertForm(false)} className="text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all">
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Route className="w-6 h-6 text-brand-500" />
                  Route HTTPS Layers
                </h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {activeLayers.length} Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {httpsLayers.map((layer) => {
                  const surface = SURFACE_CONFIG[layer.protectedSurface];
                  const SurfaceIcon = surface.icon;

                  return (
                    <div key={layer.id} className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            layer.status === 'active' ? 'bg-brand-50 text-brand-500' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Globe className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{layer.name}</h3>
                            <p className="text-xs text-slate-400 font-mono">{layer.ipAddress}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            toggleHttpsLayer(layer.id);
                            toast.info(`HTTPS layer "${layer.name}" ${layer.status === 'active' ? 'deactivated' : 'activated'}.`);
                          }}
                          className="text-slate-400 hover:text-brand-500 transition-colors"
                          aria-label={`${layer.status === 'active' ? 'Deactivate' : 'Activate'} ${layer.name}`}
                        >
                          {layer.status === 'active' ? (
                            <ToggleRight className="w-10 h-10 text-brand-500" />
                          ) : (
                            <ToggleLeft className="w-10 h-10 text-slate-300" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                        <SurfaceIcon className="w-4 h-4 text-brand-500" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium uppercase">Protected Route</p>
                          <p className="text-xs font-bold text-slate-700">{surface.label} <span className="font-mono text-slate-400">{surface.path}</span></p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-slate-50 rounded-xl text-center">
                          <p className="text-[10px] text-slate-400 font-medium">Type</p>
                          <p className="text-xs font-bold text-slate-700 capitalize">{layer.type}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl text-center">
                          <p className="text-[10px] text-slate-400 font-medium">Latency</p>
                          <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-0.5">
                            <Wifi className="w-3 h-3 text-emerald-500" />
                            {layer.latency}ms
                          </p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl text-center">
                          <p className="text-[10px] text-slate-400 font-medium">Traffic</p>
                          <p className="text-xs font-bold text-slate-700">{layer.trafficUsed}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <span className="text-xs text-slate-400">SSL: <strong className="text-slate-600">{layer.sslVersion}</strong></span>
                        <button
                          onClick={() => {
                            toggleLayerApiKeyRequirement(layer.id);
                            toast.success(`${surface.label} API key gate ${layer.apiKeyRequired ? 'disabled' : 'enabled'}.`);
                          }}
                          className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            layer.apiKeyRequired ? 'text-brand-500 hover:text-brand-600' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <LockKeyhole className="w-3.5 h-3.5" />
                          {layer.apiKeyRequired ? 'API Key Required' : 'API Key Optional'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-6 h-6 text-brand-500" />
                SSL Certificates
              </h2>

              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-50">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          cert.status === 'valid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{cert.domain}</h4>
                          <p className="text-xs text-slate-400">Issuer: {cert.issuer}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-slate-400">Expires</p>
                          <p className="text-xs font-bold text-slate-700">{cert.expiryDate}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                          cert.status === 'valid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {cert.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-brand-500" />
                Security Headers
              </h2>

              <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6">
                <p className="text-sm text-slate-500">
                  Enforce secure browser behaviors across every protected application surface.
                </p>

                <div className="space-y-4">
                  {[
                    { key: 'hsts' as const, label: 'HSTS', description: 'Force secure HTTPS connections' },
                    { key: 'csp' as const, label: 'Content Security Policy', description: 'Restrict resource loading origins' },
                    { key: 'xFrameOptions' as const, label: 'X-Frame-Options', description: 'Prevent clickjacking iframe embeds' },
                    { key: 'xContentTypeOptions' as const, label: 'X-Content-Type-Options', description: 'Block MIME-type sniffing' },
                  ].map((header) => (
                    <div key={header.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{header.label}</h4>
                        <p className="text-xs text-slate-400">{header.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          toggleSecurityHeader(header.key);
                          toast.success(`${header.label} header ${securityHeaders[header.key] ? 'disabled' : 'enabled'}.`);
                        }}
                        className="text-slate-400 hover:text-brand-500 transition-colors"
                        aria-label={`Toggle ${header.label}`}
                      >
                        {securityHeaders[header.key] ? (
                          <ToggleRight className="w-10 h-10 text-brand-500" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-slate-300" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-slate-900 rounded-3xl p-8 text-white space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-400" />
                Surface Security Coverage
              </h3>

              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-brand-400">{activeLayers.length}/3</span>
                <span className="text-slate-400 text-sm">active route layers</span>
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>SSL Handshake Success</span>
                  <span className="font-bold text-emerald-400">99.98%</span>
                </div>
                <div className="flex justify-between">
                  <span>Encrypted Traffic</span>
                  <span className="font-bold text-emerald-400">100%</span>
                </div>
                <div className="flex justify-between">
                  <span>API Key Gates Enabled</span>
                  <span className="font-bold text-white">{activeLayers.filter((layer) => layer.apiKeyRequired).length}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Each layer can be mapped to a dedicated backend gateway, allowing API key validation and usage limits to be enforced independently for dashboard, campaign, and workflow traffic.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HttpsLayers;