import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Zap, Plus, Check, Lock } from 'lucide-react';
import Layout from '../components/Layout';

interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  locked: boolean;
}

const initialSkills: Skill[] = [
  { id: '1', name: 'High-Ticket Discovery', description: 'Autonomous scanning for offers with $500+ payouts.', enabled: true, locked: false },
  { id: '2', name: 'Landing Page Optimizer', description: 'A/B test and auto-optimize landing page variants.', enabled: true, locked: false },
  { id: '3', name: 'Traffic Source Scaler', description: 'Identify and scale winning traffic sources automatically.', enabled: false, locked: false },
  { id: '4', name: 'Competitor Intel', description: 'Monitor competitor ads and landing pages in real-time.', enabled: false, locked: true },
  { id: '5', name: 'Fraud Detection', description: 'AI-powered click fraud detection and blocking.', enabled: true, locked: false },
  { id: '6', name: 'Predictive Bidding', description: 'ML-driven bid optimization across ad networks.', enabled: false, locked: true },
];

const Skills: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>(initialSkills);

  const toggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => {
      if (s.id === id && !s.locked) {
        toast.info(`Skill "${s.name}" ${s.enabled ? 'disabled' : 'enabled'}.`);
        return { ...s, enabled: !s.enabled };
      }
      return s;
    }));
  };

  return (
    <Layout>
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Agent Skills</h1>
            <p className="text-slate-500 mt-1">Configure autonomous capabilities for your agents.</p>
          </div>
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> Install Skill
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill, i) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  skill.enabled ? 'bg-brand-50 text-brand-500' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Zap className="w-6 h-6" />
                </div>
                {skill.locked && (
                  <div className="p-2 bg-slate-100 text-slate-400 rounded-lg">
                    <Lock className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{skill.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{skill.description}</p>
              </div>
              <button
                onClick={() => toggleSkill(skill.id)}
                disabled={skill.locked}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  skill.enabled 
                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                    : skill.locked 
                      ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {skill.enabled ? <><Check className="w-4 h-4" /> Enabled</> : skill.locked ? <><Lock className="w-4 h-4" /> Premium</> : 'Enable Skill'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Skills;