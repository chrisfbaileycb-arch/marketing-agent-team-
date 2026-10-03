import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Users, Plus, Trash2, Activity, Zap, Cpu } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

const Agents: React.FC = () => {
  const { agents, campaigns, addAgent, deleteAgent, updateAgent, requestAdSpend } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [vertical, setVertical] = useState('');
  const [region, setRegion] = useState('United States');
  const [minPayout, setMinPayout] = useState('100');
  const [nightly, setNightly] = useState(true);
  const [mode, setMode] = useState<'vertical' | 'scout'>('scout');
  const [intel, setIntel] = useState('');
  const [showSpendForm, setShowSpendForm] = useState<string | null>(null);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendReason, setSpendReason] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Please enter an agent name.');
      return;
    }
    if (mode === 'vertical' && !vertical) {
      toast.error('Give the agent a vertical to research (e.g. "residential solar").');
      return;
    }
    addAgent(name, { mode, vertical: mode === 'vertical' ? vertical : '', region, minPayout: parseFloat(minPayout) || (mode === 'scout' ? 250 : 100), schedule: nightly ? 'nightly' : 'off', intel: intel.trim() });
    toast.success(nightly ? 'Agent deployed. It will research overnight; results land on Approvals.' : 'Agent deployed.');
    setName(''); setVertical(''); setIntel('');
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
            <fieldset className="space-y-2">
              <legend className="text-sm font-bold text-slate-700 mb-2">What this agent does</legend>
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 cursor-pointer">
                <input type="radio" name="mode" value="scout" checked={mode === 'scout'} onChange={() => { setMode('scout'); setMinPayout('250'); }} className="mt-1" />
                <span><span className="font-semibold text-slate-900">Scout for opportunities I haven't thought of</span><br />
                <span className="text-sm text-slate-600">Scans the whole market for high-ticket commission programs and brings back theses. You approve the ones worth researching.</span></span>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 cursor-pointer">
                <input type="radio" name="mode" value="vertical" checked={mode === 'vertical'} onChange={() => { setMode('vertical'); setMinPayout('100'); }} className="mt-1" />
                <span><span className="font-semibold text-slate-900">Research a vertical I name</span><br />
                <span className="text-sm text-slate-600">Finds and verifies the actual programs in one category, with real page reads.</span></span>
              </label>
            </fieldset>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="agent-name" className="block text-sm font-bold text-slate-700 mb-2">Agent name</label>
                <input id="agent-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Solar Scout"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" />
              </div>
              <div className={mode === 'scout' ? 'opacity-50' : ''}>
                <label htmlFor="agent-vertical" className="block text-sm font-bold text-slate-700 mb-2">{mode === 'scout' ? 'Vertical (not needed for a scout)' : 'What it researches'}</label>
                <input id="agent-vertical" type="text" value={vertical} onChange={(e) => setVertical(e.target.value)} placeholder="e.g. residential solar installation" disabled={mode === 'scout'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" />
              </div>
              <div>
                <label htmlFor="agent-region" className="block text-sm font-bold text-slate-700 mb-2">Region</label>
                <input id="agent-region" type="text" value={region} onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" />
              </div>
              <div>
                <label htmlFor="agent-minpayout" className="block text-sm font-bold text-slate-700 mb-2">{mode === 'scout' ? 'Minimum commission worth my time ($)' : 'Ignore programs paying less than ($)'}</label>
                <input id="agent-minpayout" type="number" min="0" value={minPayout} onChange={(e) => setMinPayout(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" />
              </div>
            </div>
            {mode === 'scout' && (
              <div>
                <label htmlFor="agent-intel" className="block text-sm font-bold text-slate-700 mb-2">Things you've seen that it should chase down</label>
                <textarea id="agent-intel" value={intel} onChange={(e) => setIntel(e.target.value)} rows={3}
                  placeholder="e.g. Intuit developer portal offered $500 per QuickBooks signup in July — check if that's still running and what else is in that partner program"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" />
                <p className="text-xs text-slate-500 mt-1">The scout can't see behind partner-portal logins. What you've seen there is the best lead it gets.</p>
              </div>
            )}
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={nightly} onChange={(e) => setNightly(e.target.checked)} className="w-4 h-4 text-brand-500 border-slate-300 rounded focus:ring-brand-500" />
              Run every night and queue what it finds for my approval
            </label>
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
                      <p className="text-xs text-slate-500">{agent.mode === 'scout' ? `Scout · $${agent.minPayout ?? 250}+ commissions` : (agent.vertical || 'No vertical set')}{agent.region ? ` · ${agent.region}` : ''}</p>
                      <button type="button"
                        onClick={() => updateAgent(agent.id, { schedule: agent.schedule === 'nightly' ? 'off' : 'nightly' })}
                        className={`mt-1 text-xs font-semibold rounded-full px-2 py-0.5 focus-visible:ring-2 focus-visible:ring-brand-500 ${agent.schedule === 'nightly' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                        aria-pressed={agent.schedule === 'nightly'}>
                        {agent.schedule === 'nightly' ? 'Nightly run on' : 'Nightly run off'}
                      </button>
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