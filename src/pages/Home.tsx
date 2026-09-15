import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  ArrowUpRight,
  ChevronRight,
  Activity,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';

const FALLBACK_IMAGE_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg width="1200" height="480" viewBox="0 0 1200 480" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="480" fill="#1E293B"/>
    <rect x="515" y="120" width="170" height="170" rx="44" fill="#5A64E3"/>
    <path d="M566 230V194C566 184.059 574.059 176 584 176H616C625.941 176 634 184.059 634 194V230M550 244H650C659.941 244 668 252.059 668 262V272H532V262C532 252.059 540.059 244 550 244Z" stroke="white" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="600" y="354" fill="#CBD5E1" font-family="Arial, sans-serif" font-size="28" font-weight="700" text-anchor="middle">AffiliateAgent Campaign</text>
  </svg>
`)}`;

const data = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 5000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

const Home: React.FC = () => {
  const { agents, adSpendRequests, campaigns, approveAdSpend, denyAdSpend, scoutDiscoveryFilters } = useApp();

  const averagePayout = campaigns.length
    ? campaigns.reduce((acc, campaign) => acc + campaign.payout, 0) / campaigns.length
    : 0;

  const stats = [
    { label: 'Total Revenue', value: '$42,890.00', trend: '+24.2%', icon: TrendingUp, color: 'text-brand-500', bg: 'bg-brand-50' },
    { label: 'Active Agents', value: agents.filter((agent) => agent.status === 'running').length, trend: `+${Math.max(agents.length - 1, 0)}`, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'High-Ticket Offers', value: campaigns.length, trend: `$${scoutDiscoveryFilters.minimumPayout.toLocaleString()}+`, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Avg. Payout', value: `$${averagePayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, trend: '+12.1%', icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const pendingRequests = adSpendRequests.filter((request) => request.status === 'pending');

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== FALLBACK_IMAGE_URL) {
      event.currentTarget.src = FALLBACK_IMAGE_URL;
    }
  };

  const handleApprove = (id: string) => {
    approveAdSpend(id);
    toast.success('Ad spend request approved.');
  };

  const handleDeny = (id: string) => {
    denyAdSpend(id);
    toast.info('Ad spend request denied.');
  };

  return (
    <Layout>
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
        <section className="relative rounded-[32px] overflow-hidden bg-[#1a1c2e] text-white min-h-[480px] flex items-center">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <Area type="monotone" dataKey="value" stroke="#5a64e3" fill="#5a64e3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="relative z-10 px-12 py-16 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 border border-brand-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-brand-300 mb-6">
              <ShieldCheck className="w-3 h-3" />
              High-Ticket Discovery Active
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Scaling <span className="text-brand-400">High-Yield</span> Affiliate Assets.
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-xl leading-relaxed">
              Scout Agent is qualifying commercial energy, enterprise SaaS, and business finance opportunities with ${scoutDiscoveryFilters.minimumPayout.toLocaleString()}–${scoutDiscoveryFilters.maximumPayout.toLocaleString()} commission potential.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/marketplace" className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-brand-500/20">
                Review $10k Payouts <ArrowUpRight className="w-5 h-5" />
              </Link>
              <Link to="/agents" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold transition-all">
                View Agent Logs
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">{stat.trend}</span>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Premium Opportunities</h2>
              <Link to="/marketplace" className="text-brand-500 text-sm font-bold flex items-center gap-1 hover:underline">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.slice(0, 2).map((item) => (
                <div key={item.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative h-36 w-full bg-slate-800 overflow-hidden">
                    <img
                      src={item.bannerUrl}
                      alt={`${item.name} campaign`}
                      onError={handleImageError}
                      className="h-36 w-full object-cover rounded-t-xl bg-slate-800 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold uppercase">
                      High-Ticket Campaign
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-slate-900 mb-2 group-hover:text-brand-500 transition-colors">{item.name}</h4>
                    <p className="text-slate-500 text-sm mb-4">Qualified enterprise pipeline with ${item.budget.toLocaleString()} budget allocated.</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <span className="text-brand-500 font-bold">${item.payout.toLocaleString()} / conversion</span>
                      <span className="text-slate-400 text-xs">High-intent qualified lead</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Ad Spend Requests</h2>
              <Link to="/campaigns" className="text-brand-500 text-sm font-bold hover:underline">View All</Link>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              {pendingRequests.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No pending requests.</p>
              ) : (
                pendingRequests.slice(0, 3).map((request) => {
                  const agent = agents.find((item) => item.id === request.agentId);
                  return (
                    <div key={request.id} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100">
                          <Activity className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{agent?.name || 'Unknown Agent'}</p>
                          <p className="text-xs text-slate-500">Scaling Request • ${request.amount}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(request.id)} className="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => handleDeny(request.id)} className="flex-1 bg-white text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" /> Deny
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;