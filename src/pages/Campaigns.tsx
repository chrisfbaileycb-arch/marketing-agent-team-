import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Target, Plus, Play, Pause, DollarSign, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

const Campaigns: React.FC = () => {
  const { campaigns, agents, adSpendRequests, addCampaign, toggleCampaignStatus, approveAdSpend, denyAdSpend } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [payout, setPayout] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !budget || !payout) {
      toast.error('Please fill in all fields.');
      return;
    }
    addCampaign(name, parseFloat(budget), parseFloat(payout));
    toast.success('Campaign created successfully.');
    setName('');
    setBudget('');
    setPayout('');
    setShowForm(false);
  };

  const pendingRequests = adSpendRequests.filter(r => r.status === 'pending');

  return (
    <Layout>
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Campaigns</h1>
            <p className="text-slate-500 mt-1">Manage your affiliate campaigns and ad spend.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>

        {showForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6"
          >
            <h2 className="text-xl font-bold text-slate-900">Create New Campaign</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Enterprise SaaS Launch"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Budget ($)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="5000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Payout per Sale ($)</label>
                <input
                  type="number"
                  value={payout}
                  onChange={(e) => setPayout(e.target.value)}
                  placeholder="180"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-600 transition-all">
                Create Campaign
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all">
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Active Campaigns</h2>
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const assignedAgents = agents.filter(a => a.campaignId === campaign.id);
                return (
                  <div key={campaign.id} className="bg-white rounded-3xl border border-slate-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-50 text-brand-500 rounded-2xl flex items-center justify-center">
                          <Target className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{campaign.name}</h3>
                          <p className="text-sm text-slate-500">{assignedAgents.length} agents assigned</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                        campaign.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                        campaign.status === 'paused' ? 'bg-amber-50 text-amber-600' : 
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500 font-medium">Budget</p>
                        <p className="font-bold text-slate-900 flex items-center gap-1"><DollarSign className="w-3 h-3" />{campaign.budget.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500 font-medium">Payout</p>
                        <p className="font-bold text-slate-900 flex items-center gap-1"><DollarSign className="w-3 h-3" />{campaign.payout}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-500 font-medium">Projected ROI</p>
                        <p className="font-bold text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+{(campaign.payout * 10 / campaign.budget * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        toggleCampaignStatus(campaign.id);
                        toast.info(`Campaign ${campaign.status === 'active' ? 'paused' : 'activated'}.`);
                      }}
                      className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      {campaign.status === 'active' ? <><Pause className="w-4 h-4" /> Pause Campaign</> : <><Play className="w-4 h-4" /> Activate Campaign</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Pending Ad Spend</h2>
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              {pendingRequests.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No pending requests.</p>
              ) : (
                pendingRequests.map((req) => {
                  const agent = agents.find(a => a.id === req.agentId);
                  return (
                    <div key={req.id} className="p-4 bg-slate-50 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{agent?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">${req.amount} • {req.reason}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { approveAdSpend(req.id); toast.success('Request approved.'); }} className="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => { denyAdSpend(req.id); toast.info('Request denied.'); }} className="flex-1 bg-white text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1">
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

export default Campaigns;