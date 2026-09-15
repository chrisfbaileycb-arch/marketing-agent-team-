import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Users, Plus, Trash2, Activity, Zap, Cpu } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

const Agents: React.FC = () => {
  const { agents, campaigns, addAgent, deleteAgent, requestAdSpend } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [showSpendForm, setShowSpendForm] = useState<string | null>(null);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendReason, setSpendReason] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Please enter an agent name.');
      return;
    }
    addAgent(name);
    toast.success('Agent deployed successfully.');
    setName('');
    setShowForm(false);
  };

  const handleSpendRequest = (agentId: string) => {
    if (!spendAmount || !spendReason) {
      toast.error('Please fill in amount and reason.');
      return;
    }
    requestAdSpend(agentId, parseFloat(spendAmount), spendReason);
    toast.success('Ad spend request submitted.');
    setSpendAmount('');
    setSpendReason('');
    setShowSpendForm(null);
  };

  return (
    <Layout>
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Agent Management</h1>
            <p className="text-slate-500 mt-1">Deploy and monitor your autonomous affiliate agents.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Deploy Agent
          </button>
        </div>

        {showForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleCreate}
            className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6"
          >
            <h2 className="text-xl font-bold text-slate-900">Deploy New Agent</h2>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Agent Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Scout Delta"
                className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-600 transition-all">
                Deploy
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all">
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const campaign = campaigns.find(c => c.id === agent.campaignId);
            return (
              <motion.div 
                key={agent.id}
                layout
                className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-50 text-brand-500 rounded-2xl flex items-center justify-center">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{agent.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{agent.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { deleteAgent(agent.id); toast.info('Agent terminated.'); }}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    agent.status === 'running' ? 'bg-emerald-500 animate-pulse' : 
                    agent.status === 'idle' ? 'bg-amber-500' : 'bg-red-500'
                  }`}></span>
                  <span className="text-sm font-medium text-slate-700 capitalize">{agent.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium">Efficiency</p>
                    <p className="font-bold text-slate-900 flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" />{agent.efficiency}%</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium">Assigned</p>
                    <p className="font-bold text-slate-900 text-sm truncate">{campaign?.name || 'Unassigned'}</p>
                  </div>
                </div>

                {showSpendForm === agent.id ? (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                    <input
                      type="number"
                      value={spendAmount}
                      onChange={(e) => setSpendAmount(e.target.value)}
                      placeholder="Amount ($)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-500"
                    />
                    <input
                      type="text"
                      value={spendReason}
                      onChange={(e) => setSpendReason(e.target.value)}
                      placeholder="Reason for spend"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-500"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSpendRequest(agent.id)} className="flex-1 bg-brand-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-brand-600">
                        Submit
                      </button>
                      <button onClick={() => setShowSpendForm(null)} className="flex-1 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-100">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowSpendForm(agent.id)}
                    className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Activity className="w-4 h-4" /> Request Ad Spend
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Agents;