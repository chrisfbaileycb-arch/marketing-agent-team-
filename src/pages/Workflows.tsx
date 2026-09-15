import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  Workflow, 
  Play, 
  Cpu, 
  Database, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Plus, 
  Link2, 
  Link2Off, 
  Settings, 
  RefreshCw, 
  ArrowUpRight,
  Sparkles,
  Layers,
  Webhook,
  Copy,
  Check,
  Code,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Zap,
  ShoppingBag,
  Users
} from 'lucide-react';
import Layout from '../components/Layout';
import { useApp, type MarketingProject, type IncomingWebhook } from '../context/AppContext';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface PlatformTemplate {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
  setupSteps: string[];
  payload: string;
}

const PLATFORM_TEMPLATES: PlatformTemplate[] = [
  {
    id: 'zapier',
    name: 'Zapier',
    icon: Zap,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    description: 'Trigger agent workflows automatically when a new lead is captured, a spreadsheet row is added, or an email is received in Zapier.',
    setupSteps: [
      'Create a new Zap and choose your trigger app (e.g., Typeform, Google Sheets).',
      'Add a "Webhooks by Zapier" action step and select "Custom Request" or "POST".',
      'Paste your unique AffiliateAgent Webhook URL into the URL field.',
      'Set the Payload Type to "json" and map your trigger data to the template fields below.'
    ],
    payload: JSON.stringify({
      event: "lead_created",
      lead_email: "{{input_data.email}}",
      lead_name: "{{input_data.name}}",
      source: "Zapier Integration",
      value: 150.00
    }, null, 2)
  },
  {
    id: 'make',
    name: 'Make.com',
    icon: Layers,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    description: 'Connect complex multi-step scenarios in Make.com (formerly Integromat) to execute high-yield affiliate workflows on demand.',
    setupSteps: [
      'Add an "HTTP" module to your Make scenario and select "Make a request".',
      'Enter your unique AffiliateAgent Webhook URL in the URL field.',
      'Set the Method to "POST" and Body type to "Raw" (JSON).',
      'Map your scenario variables into the JSON payload template below.'
    ],
    payload: JSON.stringify({
      event: "deal_closed_won",
      deal_id: "{{1.dealId}}",
      amount: "{{1.amount}}",
      customer_email: "{{1.contactEmail}}",
      source: "Make.com Scenario"
    }, null, 2)
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: Cpu,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Trigger autonomous marketing agents directly from HubSpot Workflows when deals are won or contacts reach specific lifecycle stages.',
    setupSteps: [
      'In HubSpot, create a contact-based or deal-based Workflow.',
      'Set your enrollment triggers (e.g., Deal Stage is Closed Won).',
      'Add an action: "Trigger a webhook".',
      'Select "POST" as the method, paste your Webhook URL, and customize the JSON body using the template.'
    ],
    payload: JSON.stringify({
      event: "deal_stage_updated",
      portal_id: 1234567,
      deal_id: "{{deal.hs_object_id}}",
      deal_name: "{{deal.dealname}}",
      amount: "{{deal.amount}}",
      customer_email: "{{contact.email}}",
      source: "HubSpot Workflow"
    }, null, 2)
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: ShoppingBag,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    description: 'Instantly scale affiliate campaigns and record commissions when customers place orders or create accounts on your Shopify store.',
    setupSteps: [
      'Go to Shopify Admin > Settings > Notifications.',
      'Scroll down to the Webhooks section and click "Create webhook".',
      'Select "Order creation" as the Event and "JSON" as the Format.',
      'Paste your unique Webhook URL and save. Shopify will automatically send the payload structure below.'
    ],
    payload: JSON.stringify({
      event: "order_created",
      order_id: "{{order.id}}",
      total_price: "{{order.total_price}}",
      customer_email: "{{order.email}}",
      currency: "{{order.currency}}",
      source: "Shopify Webhook"
    }, null, 2)
  }
];

const Workflows: React.FC = () => {
  const { 
    agents, 
    campaigns, 
    marketingProjects, 
    affiliateSales, 
    workflowLogs, 
    incomingWebhooks,
    connectProject, 
    disconnectProject, 
    addAffiliateSale, 
    addWorkflowLog, 
    clearWorkflowLogs,
    requestAdSpend,
    addIncomingWebhook,
    deleteIncomingWebhook,
    toggleIncomingWebhookStatus,
    recordWebhookTrigger,
    enqueueTask,
    user
  } = useApp();

  const [activeTab, setActiveTab] = useState<'execution' | 'webhooks'>('execution');

  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  
  // API Connection Form
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectPlatform, setProjectPlatform] = useState<MarketingProject['platform']>('Shopify');
  const [apiToken, setApiToken] = useState('');

  // Webhook Form
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookName, setWebhookName] = useState('');
  const [webhookAgent, setWebhookAgent] = useState('');
  const [webhookCampaign, setWebhookCampaign] = useState('');

  // Webhook Simulator
  const [selectedWebhookForSim, setSelectedWebhookForSim] = useState('');
  const [simPayload, setSimPayload] = useState('{\n  "event": "lead_created",\n  "lead_email": "customer@example.com",\n  "source": "Zapier Integration",\n  "value": 450\n}');
  const [copiedWebhookId, setCopiedWebhookId] = useState<string | null>(null);

  // Pre-configured Templates State
  const [selectedTemplatePlatform, setSelectedTemplatePlatform] = useState('zapier');

  // Playwright Settings
  const [headless, setHeadless] = useState(true);
  const [autoRetry, setAutoRetry] = useState(true);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [workflowLogs]);

  const handleConnectProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !apiToken) {
      toast.error('Please fill in all fields to connect your marketing project.');
      return;
    }
    connectProject(projectName, projectPlatform, apiToken);
    toast.success(`Successfully connected to ${projectName} via API.`);
    setProjectName('');
    setApiToken('');
    setShowConnectForm(false);
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookName || !webhookAgent || !webhookCampaign) {
      toast.error('Please fill in all fields to generate a webhook.');
      return;
    }
    addIncomingWebhook(webhookName, webhookAgent, webhookCampaign);
    toast.success(`Webhook "${webhookName}" generated successfully.`);
    setWebhookName('');
    setWebhookAgent('');
    setWebhookCampaign('');
    setShowWebhookForm(false);
  };

  const handleCopyWebhookUrl = (webhook: IncomingWebhook) => {
    const url = `${window.location.origin}/api/v1/webhooks/trigger?token=${webhook.token}`;
    navigator.clipboard.writeText(url);
    setCopiedWebhookId(webhook.id);
    toast.success('Webhook URL copied to clipboard.');
    setTimeout(() => setCopiedWebhookId(null), 2000);
  };

  const triggerWorkflowExecution = async () => {
    if (!selectedAgent || !selectedCampaign) {
      toast.error('Please select both an Agent and a Campaign to execute.');
      return;
    }
    const agent = agents.find(a => a.id === selectedAgent);
    const campaign = campaigns.find(c => c.id === selectedCampaign);
    if (!agent || !campaign) return;
    const isScout = agent.mode === 'scout';
    if (!isScout && !agent.vertical) {
      toast.error(`Agent "${agent.name}" has no vertical set. Edit the agent and give it one (e.g. "residential solar").`);
      return;
    }

    setIsExecuting(true);
    setExecutionProgress(0);
    clearWorkflowLogs();
    addWorkflowLog('info', isScout ? `Queuing market scout for ${agent.name} ($${agent.minPayout ?? 250}+ commissions, ${agent.region || 'US'})` : `Queuing research task for ${agent.name}: ${agent.vertical} (${agent.region || 'US'})`);

    try {
      const taskId = await enqueueTask({
        skill: isScout ? 'opportunity_scout' : 'affiliate_research',
        agentId: agent.id,
        campaignId: campaign.id,
        dryRun: !headless,
        input: isScout
          ? { minCommission: agent.minPayout ?? 250, region: agent.region || 'United States', notes: agent.notes || '' }
          : { vertical: agent.vertical, region: agent.region || 'United States', minPayout: agent.minPayout ?? campaign.payout ?? 100, notes: agent.notes || '' },
      });
      addWorkflowLog('success', `Task queued. ID: ${taskId}`);
      setCurrentStepText('Waiting for the backend…');

      const { onSnapshot, doc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      let lastStep = '';
      const unsubscribe = onSnapshot(doc(db, 'workflow_tasks', taskId), (snapshot) => {
        const data = snapshot.data();
        if (!data) return;
        if (typeof data.progress === 'number') setExecutionProgress(data.progress);
        if (data.currentStep && data.currentStep !== lastStep) {
          lastStep = data.currentStep;
          setCurrentStepText(data.currentStep);
          addWorkflowLog('info', data.currentStep);
        }
        if (data.status === 'awaiting_approval' || data.status === 'completed') {
          setIsExecuting(false);
          const n = data.result?.count ?? 0;
          addWorkflowLog('success', n ? `${n} ${isScout ? 'opportunit' + (n === 1 ? 'y' : 'ies') : 'program(s)'} found — review on the Approvals page.` : 'Task completed.');
          toast.success(n ? `${n} ready for your review` : 'Task completed');
          unsubscribe();
        } else if (data.status === 'failed') {
          setIsExecuting(false);
          addWorkflowLog('error', `Failed: ${data.error}`);
          toast.error(`Task failed: ${data.error}`);
          unsubscribe();
        }
      });
    } catch (error) {
      console.error(error);
      addWorkflowLog('error', 'Could not queue the task. Are you signed in?');
      toast.error('Could not queue the task.');
      setIsExecuting(false);
    }
  };

const triggerWebhookWorkflow = async (webhook: IncomingWebhook, payload: string) => {
    const agent = agents.find(a => a.id === webhook.targetAgentId);
    const campaign = campaigns.find(c => c.id === webhook.targetCampaignId);

    if (!agent || !campaign) {
      toast.error('Target Agent or Campaign not found.');
      return;
    }

    setActiveTab('execution'); // Switch to execution tab to show logs in real-time!
    setIsExecuting(true);
    setExecutionProgress(0);
    clearWorkflowLogs();

    // Record the trigger in global state
    recordWebhookTrigger(webhook.id);

    try {
      // Dynamically import Firebase to avoid cluttering top-level imports
      const { collection, addDoc, onSnapshot, doc } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      addWorkflowLog('info', 'Connecting to secure Firebase backend...');
      
      // Create task document in Firestore
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(payload); } catch { parsed = { prompt: payload }; }
      const { skill, ...input } = parsed as { skill?: string } & Record<string, unknown>;
      const taskRef = await addDoc(collection(db, 'workflow_tasks'), {
        ownerUid: user?.uid,
        webhookId: webhook.id,
        agentId: agent.id,
        campaignId: campaign.id,
        skill: skill || 'llm_prompt',
        input: skill ? input : { prompt: `Summarize this incoming event for the operator and suggest one next action:\n${payload}` },
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
      });

      addWorkflowLog('success', `Task securely queued in Firestore. Task ID: ${taskRef.id}`);
      setCurrentStepText('Waiting for Cloud Function execution...');

      // Set up real-time listener
      const unsubscribe = onSnapshot(doc(db, 'workflow_tasks', taskRef.id), (snapshot) => {
        const data = snapshot.data();
        if (data) {
          if (data.progress !== undefined) setExecutionProgress(data.progress);
          if (data.currentStep) {
             setCurrentStepText(data.currentStep);
             addWorkflowLog('info', data.currentStep);
          }
          
          if (data.status === 'completed' || data.status === 'awaiting_approval') {
            setIsExecuting(false);
            const text = data.result?.text ? String(data.result.text).slice(0, 400) : '';
            addWorkflowLog('success', text ? `Backend result: ${text}` : 'Backend task finished. Check Approvals if it produced proposals.');
            toast.success('Webhook task finished.');
            unsubscribe();
          } else if (data.status === 'failed') {
            setIsExecuting(false);
            addWorkflowLog('error', `Execution failed: ${data.error}`);
            toast.error(`Workflow execution failed: ${data.error}`);
            unsubscribe();
          }
        }
      });
    } catch (error) {
      console.error('Error triggering workflow:', error);
      toast.error('Failed to trigger workflow in backend');
      addWorkflowLog('error', 'Failed to connect to Firebase backend.');
      setIsExecuting(false);
    }
  };

  // Chart Data
  const chartData = affiliateSales.map((sale, index) => ({
    name: `Sale ${affiliateSales.length - index}`,
    commission: sale.commission,
  })).reverse();

  const totalCommissions = affiliateSales.reduce((acc, s) => acc + s.commission, 0);
  const totalSalesValue = affiliateSales.reduce((acc, s) => acc + s.amount, 0);

  return (
    <Layout>
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-100 rounded-full text-xs font-bold text-brand-600 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Deluxe Executable System
            </div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Agent Workflows</h1>
            <p className="text-slate-500 mt-1">Execute end-to-end affiliate workflows, connect external marketing APIs, and track real-time commissions.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                setShowConnectForm(!showConnectForm);
                setShowWebhookForm(false);
              }}
              className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-brand-500" /> Connect Marketing API
            </button>
            <button 
              onClick={() => {
                setShowWebhookForm(!showWebhookForm);
                setShowConnectForm(false);
              }}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Webhook className="w-4 h-4 text-brand-400" /> Create Webhook
            </button>
          </div>
        </div>

        {/* Connect API Form */}
        {showConnectForm && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleConnectProject}
            className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-900">Connect External Marketing Project</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Shopify Storefront"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Platform</label>
                <select
                  value={projectPlatform}
                  onChange={(e) => setProjectPlatform(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white"
                >
                  <option value="Shopify">Shopify</option>
                  <option value="HubSpot">HubSpot CRM</option>
                  <option value="Meta Ads">Meta Ads Manager</option>
                  <option value="Google Ads">Google Ads Manager</option>
                  <option value="Custom Webhook">Custom Webhook API</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">API Token / Key</label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-600 transition-all">
                Establish Connection
              </button>
              <button type="button" onClick={() => setShowConnectForm(false)} className="text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all">
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {/* Create Webhook Form */}
        {showWebhookForm && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreateWebhook}
            className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Webhook className="w-5 h-5 text-brand-500" />
              Generate Incoming Webhook Endpoint
            </h2>
            <p className="text-sm text-slate-500">
              Create a unique webhook URL that external platforms (Zapier, Make, HubSpot, or custom backends) can call to trigger agent workflows automatically.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Webhook Name</label>
                <input
                  type="text"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  placeholder="e.g. Zapier Lead Trigger"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Agent</label>
                <select
                  value={webhookAgent}
                  onChange={(e) => setWebhookAgent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white"
                >
                  <option value="">-- Choose Agent --</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Campaign</label>
                <select
                  value={webhookCampaign}
                  onChange={(e) => setWebhookCampaign(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white"
                >
                  <option value="">-- Choose Campaign --</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-600 transition-all">
                Generate Webhook
              </button>
              <button type="button" onClick={() => setShowWebhookForm(false)} className="text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all">
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-brand-50 text-brand-500 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                +100% ROI
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Commissions</p>
            <h3 className="text-2xl font-bold text-slate-900">${totalCommissions.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-blue-500 text-xs font-bold bg-blue-50 px-2 py-1 rounded-lg">
                Active
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Sales Value</p>
            <h3 className="text-2xl font-bold text-slate-900">${totalSalesValue.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                <Link2 className="w-6 h-6" />
              </div>
              <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                {marketingProjects.filter(p => p.status === 'connected').length} Connected
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">API Connections</p>
            <h3 className="text-2xl font-bold text-slate-900">{marketingProjects.length} Projects</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
                <Webhook className="w-6 h-6" />
              </div>
              <span className="text-purple-500 text-xs font-bold bg-purple-50 px-2 py-1 rounded-lg">
                {incomingWebhooks.filter(w => w.status === 'active').length} Active
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Incoming Webhooks</p>
            <h3 className="text-2xl font-bold text-slate-900">{incomingWebhooks.length} Endpoints</h3>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('execution')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'execution'
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Workflow className="w-4 h-4" />
            Workflow Execution
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'webhooks'
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Webhook className="w-4 h-4" />
            Webhook Integrations
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'execution' ? (
            <motion.div
              key="execution"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Workflow Executor & Live Terminal */}
              <div className="lg:col-span-2 space-y-8">
                {/* Workflow Executor */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Workflow className="w-6 h-6 text-brand-500" />
                    Execute Deluxe Workflow
                  </h2>
                  <p className="text-sm text-slate-500">
                    Select an autonomous agent and a target campaign. The agent will execute a full marketing workflow using Playwright browser automation, connect to your marketing APIs, and drive affiliate sales.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Select Agent</label>
                      <select
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white"
                      >
                        <option value="">-- Choose Agent --</option>
                        {agents.map(agent => (
                          <option key={agent.id} value={agent.id}>{agent.name} ({agent.status})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Select Campaign</label>
                      <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white"
                      >
                        <option value="">-- Choose Campaign --</option>
                        {campaigns.map(campaign => (
                          <option key={campaign.id} value={campaign.id}>{campaign.name} - Payout: ${campaign.payout}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {isExecuting ? (
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm font-bold text-slate-700">
                        <span>Executing Workflow...</span>
                        <span>{executionProgress}%</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-brand-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${executionProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 italic">{currentStepText}</p>
                    </div>
                  ) : (
                    <button
                      onClick={triggerWorkflowExecution}
                      className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                    >
                      <Play className="w-5 h-5 fill-current" /> Execute Full Marketing Workflow
                    </button>
                  )}
                </div>

                {/* Live Terminal Logs */}
                <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-brand-400" />
                      <span className="text-xs font-mono font-bold text-slate-200">Playwright & API Execution Logs</span>
                    </div>
                    <button 
                      onClick={clearWorkflowLogs}
                      className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Clear Logs
                    </button>
                  </div>
                  <div className="p-6 h-64 overflow-y-auto font-mono text-xs space-y-2">
                    {workflowLogs.length === 0 ? (
                      <p className="text-slate-600 italic">No logs recorded. Execute a workflow to see real-time Playwright automation steps.</p>
                    ) : (
                      workflowLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2">
                          <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span className={`font-bold ${
                            log.type === 'success' ? 'text-emerald-400' :
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
                          }`}>
                            {log.type.toUpperCase()}:
                          </span>
                          <span className="text-slate-300">{log.message}</span>
                        </div>
                      ))
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                </div>

                {/* Affiliate Sales & Commissions Tracker */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-6 h-6 text-brand-500" />
                    Commissions Dashboard
                  </h2>

                  <div className="bg-white rounded-3xl border border-slate-100 p-6">
                    <div className="h-64 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#5a64e3" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#5a64e3" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip />
                          <Area type="monotone" dataKey="commission" stroke="#5a64e3" fillOpacity={1} fill="url(#colorCommission)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                            <th className="py-3 px-4">Campaign</th>
                            <th className="py-3 px-4">Agent</th>
                            <th className="py-3 px-4">Sale Amount</th>
                            <th className="py-3 px-4">Commission</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                          {affiliateSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-4 font-bold text-slate-900">{sale.campaignName}</td>
                              <td className="py-4 px-4 text-slate-500">{sale.agentName}</td>
                              <td className="py-4 px-4 text-slate-900">${sale.amount}</td>
                              <td className="py-4 px-4 font-bold text-brand-500">${sale.commission}</td>
                              <td className="py-4 px-4">
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase">
                                  {sale.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: API Connections & Playwright Settings */}
              <div className="space-y-8">
                {/* API Connections */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Link2 className="w-6 h-6 text-brand-500" />
                    API Connections
                  </h2>

                  <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
                    {marketingProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            project.status === 'connected' ? 'bg-brand-50 text-brand-500' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Database className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{project.name}</h4>
                            <p className="text-xs text-slate-400">{project.platform} • Connected</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            disconnectProject(project.id);
                            toast.info(`Disconnected from ${project.name}.`);
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Link2Off className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Run settings */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-brand-500" />
                    Run Settings
                  </h2>

                  <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Write results</h4>
                          <p className="text-xs text-slate-400">Off = dry run: logs only, no proposals created</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={headless} 
                          onChange={(e) => setHeadless(e.target.checked)}
                          className="w-4 h-4 text-brand-500 border-slate-300 rounded focus:ring-brand-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Auto-Retry on Fail</h4>
                          <p className="text-xs text-slate-400">Automatically restart failed tasks</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={autoRetry} 
                          onChange={(e) => setAutoRetry(e.target.checked)}
                          className="w-4 h-4 text-brand-500 border-slate-300 rounded focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Playwright automation scripts are fully compiled and executed inside secure sandbox environments to guarantee 100% uptime and bypass detection.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="webhooks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Webhook Endpoints List & Templates */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Webhook className="w-6 h-6 text-brand-500" />
                    Active Webhook Endpoints
                  </h2>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {incomingWebhooks.length} Endpoints
                  </span>
                </div>

                <div className="space-y-4">
                  {incomingWebhooks.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                        <Webhook className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">No Webhooks Configured</h3>
                        <p className="text-slate-500 text-sm mt-1">Generate your first incoming webhook endpoint to trigger workflows from external platforms.</p>
                      </div>
                      <button
                        onClick={() => setShowWebhookForm(true)}
                        className="bg-brand-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-brand-600 transition-all"
                      >
                        Create Webhook
                      </button>
                    </div>
                  ) : (
                    incomingWebhooks.map((webhook) => {
                      const agent = agents.find(a => a.id === webhook.targetAgentId);
                      const campaign = campaigns.find(c => c.id === webhook.targetCampaignId);
                      return (
                        <div key={webhook.id} className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                webhook.status === 'active' ? 'bg-brand-50 text-brand-500' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <Webhook className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 text-sm">{webhook.name}</h3>
                                <p className="text-xs text-slate-400">
                                  Target: <strong className="text-slate-600">{agent?.name || 'Unknown Agent'}</strong> • Campaign: <strong className="text-slate-600">{campaign?.name || 'Unknown Campaign'}</strong>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  toggleIncomingWebhookStatus(webhook.id);
                                  toast.info(`Webhook "${webhook.name}" ${webhook.status === 'active' ? 'paused' : 'activated'}.`);
                                }}
                                className="text-slate-400 hover:text-brand-500 transition-colors"
                              >
                                {webhook.status === 'active' ? (
                                  <ToggleRight className="w-10 h-10 text-brand-500" />
                                ) : (
                                  <ToggleLeft className="w-10 h-10 text-slate-300" />
                                )}
                              </button>
                              <button 
                                onClick={() => {
                                  deleteIncomingWebhook(webhook.id);
                                  toast.info(`Webhook "${webhook.name}" deleted.`);
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Webhook URL Display */}
                          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <code className="text-xs text-slate-600 font-mono truncate flex-1">
                              {window.location.origin}/api/v1/webhooks/trigger?token={webhook.token}
                            </code>
                            <button
                              onClick={() => handleCopyWebhookUrl(webhook)}
                              className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                            >
                              {copiedWebhookId === webhook.id ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2">
                            <div className="p-2 bg-slate-50 rounded-xl text-center">
                              <p className="text-[10px] text-slate-400 font-medium">Trigger Count</p>
                              <p className="text-xs font-bold text-slate-700">{webhook.triggerCount} times</p>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-xl text-center col-span-2">
                              <p className="text-[10px] text-slate-400 font-medium">Last Triggered</p>
                              <p className="text-xs font-bold text-slate-700">
                                {webhook.lastTriggeredAt ? new Date(webhook.lastTriggeredAt).toLocaleString() : 'Never'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pre-configured Platform Templates */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-brand-500" />
                      Pre-configured Platform Templates
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Simplify integration setup with pre-configured webhook templates and step-by-step guides for popular platforms.
                    </p>
                  </div>

                  {/* Platform Tabs */}
                  <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-2xl">
                    {PLATFORM_TEMPLATES.map((tpl) => {
                      const Icon = tpl.icon;
                      const isSelected = selectedTemplatePlatform === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setSelectedTemplatePlatform(tpl.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <span className={`p-1 rounded-lg ${tpl.bgColor} ${tpl.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          {tpl.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Template Details */}
                  {(() => {
                    const tpl = PLATFORM_TEMPLATES.find(t => t.id === selectedTemplatePlatform);
                    if (!tpl) return null;
                    const Icon = tpl.icon;
                    return (
                      <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-lg ${tpl.bgColor} ${tpl.color}`}>
                              <Icon className="w-4 h-4" />
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{tpl.name} Integration</h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{tpl.description}</p>
                        </div>

                        {/* Setup Steps */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Setup Instructions</h5>
                          <ol className="space-y-2">
                            {tpl.setupSteps.map((step, idx) => (
                              <li key={idx} className="flex gap-3 text-xs text-slate-600 leading-relaxed">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-50 text-brand-600 font-bold text-[10px] shrink-0">
                                  {idx + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Payload Template */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended JSON Payload</h5>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(tpl.payload);
                                  toast.success(`${tpl.name} template payload copied!`);
                                }}
                                className="text-xs text-brand-500 hover:text-brand-600 font-bold flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" /> Copy Template
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSimPayload(tpl.payload);
                                  const activeWh = incomingWebhooks.find(w => w.status === 'active');
                                  if (activeWh) {
                                    setSelectedWebhookForSim(activeWh.id);
                                  }
                                  toast.success(`Loaded ${tpl.name} template into Webhook Simulator!`);
                                }}
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" /> Load into Simulator
                              </button>
                            </div>
                          </div>
                          <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                            {tpl.payload}
                          </pre>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Developer Documentation */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Code className="w-5 h-5 text-brand-500" />
                    Developer Documentation
                  </h3>
                  <p className="text-sm text-slate-500">
                    Integrate your webhook endpoints with external platforms. Send a POST request with a JSON payload to trigger the workflow.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">cURL Example</h4>
                      <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto">
{`curl -X POST "${window.location.origin}/api/v1/webhooks/trigger?token=YOUR_WEBHOOK_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "lead_created",
    "lead_email": "customer@example.com",
    "source": "Zapier Integration",
    "value": 450
  }'`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">JavaScript Fetch Example</h4>
                      <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto">
{`fetch("${window.location.origin}/api/v1/webhooks/trigger?token=YOUR_WEBHOOK_TOKEN", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    event: "lead_created",
    lead_email: "customer@example.com",
    source: "Zapier Integration",
    value: 450
  })
})
.then(res => res.json())
.then(data => console.log(data));`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Webhook Simulator */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-brand-500" />
                    Webhook Simulator
                  </h3>
                  <p className="text-sm text-slate-500">
                    Simulate an incoming webhook request from an external platform to test your workflow trigger in real-time.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Select Webhook Endpoint</label>
                      <select
                        value={selectedWebhookForSim}
                        onChange={(e) => setSelectedWebhookForSim(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white text-sm"
                      >
                        <option value="">-- Choose Webhook --</option>
                        {incomingWebhooks.filter(w => w.status === 'active').map(webhook => (
                          <option key={webhook.id} value={webhook.id}>{webhook.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">JSON Payload</label>
                      <textarea
                        value={simPayload}
                        onChange={(e) => setSimPayload(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all font-mono text-xs bg-slate-50"
                      />
                    </div>

                    <button
                      onClick={() => {
                        const webhook = incomingWebhooks.find(w => w.id === selectedWebhookForSim);
                        if (!webhook) {
                          toast.error('Please select an active webhook endpoint to simulate.');
                          return;
                        }
                        try {
                          JSON.parse(simPayload);
                        } catch (e) {
                          toast.error('Invalid JSON payload.');
                          return;
                        }
                        triggerWebhookWorkflow(webhook, simPayload);
                      }}
                      disabled={!selectedWebhookForSim}
                      className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4 fill-current" /> Simulate Incoming Request
                    </button>
                  </div>
                </div>

                {/* Quick Help */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-brand-400" />
                    How Webhooks Work
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    When an external platform sends a POST request to your unique webhook URL, our system automatically parses the payload, resolves the target agent and campaign, and triggers the Playwright browser automation workflow to execute marketing tasks and record commissions.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Workflows;