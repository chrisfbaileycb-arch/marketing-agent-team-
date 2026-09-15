import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle2, XCircle, ExternalLink, ClipboardCopy, Send, ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp, type Proposal } from '../context/AppContext';

type Tab = 'awaiting_approval' | 'approved' | 'applied' | 'rejected';

const TABS: { key: Tab; label: string }[] = [
  { key: 'awaiting_approval', label: 'Needs your decision' },
  { key: 'approved', label: 'Approved — apply next' },
  { key: 'applied', label: 'Applied' },
  { key: 'rejected', label: 'Skipped' },
];

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

const ProgramCard: React.FC<{ p: Proposal }> = ({ p }) => {
  const { decideProposal } = useApp();
  const [open, setOpen] = useState(false);
  const d = p.data ?? {};
  const app = d.application;

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4" aria-labelledby={`p-${p.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={`p-${p.id}`} className="text-xl font-serif font-bold text-slate-900">{p.title}</h2>
          <p className="text-slate-600 mt-1">{d.merchant} via {d.network} · {d.vertical}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">
            {money(d.estimatedPayoutLow ?? 0)}–{money(d.estimatedPayoutHigh ?? 0)}
          </p>
          <p className="text-sm text-slate-500">{String(d.payoutUnit ?? '').replace(/_/g, ' ')} · fit {d.fitScore}/100</p>
        </div>
      </div>

      <p className="text-slate-800">{d.commissionStructure}</p>
      <p className="text-slate-600 text-sm">{d.fitRationale}</p>

      {Array.isArray(d.complianceNotes) && d.complianceNotes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-semibold text-amber-900 mb-1">Before you promote this</p>
          <ul className="list-disc pl-5 text-sm text-amber-900 space-y-1">
            {d.complianceNotes.map((n: string, i: number) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
      >
        {open ? <ChevronUp className="w-4 h-4" aria-hidden /> : <ChevronDown className="w-4 h-4" aria-hidden />}
        {open ? 'Hide details' : 'Show approval requirements, payment terms and sources'}
      </button>

      {open && (
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-slate-900 mb-1">Approval requirements</p>
            <ul className="list-disc pl-5 text-slate-700 space-y-1">
              {(d.approvalRequirements ?? []).map((r: string, i: number) => <li key={i}>{r}</li>)}
              {(!d.approvalRequirements || d.approvalRequirements.length === 0) && <li>Not listed</li>}
            </ul>
            <p className="font-semibold text-slate-900 mt-3 mb-1">Payment terms</p>
            <p className="text-slate-700">{d.paymentTerms || 'Not listed'}</p>
            <p className="text-slate-700 mt-1">Cookie window: {d.cookieWindowDays ?? 'unknown'} days</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-1">Sources</p>
            <ul className="space-y-1">
              {(d.sources ?? []).map((s: string, i: number) => (
                <li key={i}>
                  <a href={s} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline break-all inline-flex items-center gap-1">
                    {s} <ExternalLink className="w-3 h-3" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {app && (
        <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3" aria-label="Drafted application">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-900">Your application, drafted</p>
            <button
              type="button"
              onClick={() => copy(app.answers.map((a: any) => `${a.question}\n${a.answer}`).join('\n\n'), 'All answers')}
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              <ClipboardCopy className="w-4 h-4" aria-hidden /> Copy all
            </button>
          </div>
          <ul className="space-y-3">
            {app.answers.map((a: any, i: number) => (
              <li key={i}>
                <p className="text-sm font-medium text-slate-800">{a.question}</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{a.answer}</p>
              </li>
            ))}
          </ul>
          <div className="text-sm">
            <p className="font-medium text-slate-800">Before you apply</p>
            <ul className="list-disc pl-5 text-slate-700">{app.checklistBeforeApplying.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-800">Don't do these with this program</p>
            <ul className="list-disc pl-5 text-slate-700">{app.redFlagsToAvoid.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        {p.status === 'awaiting_approval' && (
          <>
            <button type="button" onClick={() => decideProposal(p.id, 'approved').then(() => toast.success('Approved — drafting your application'))}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500">
              <CheckCircle2 className="w-4 h-4" aria-hidden /> Approve and draft application
            </button>
            <button type="button" onClick={() => decideProposal(p.id, 'rejected').then(() => toast.info('Skipped'))}
              className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500">
              <XCircle className="w-4 h-4" aria-hidden /> Skip
            </button>
          </>
        )}
        {p.status === 'approved' && (
          <>
            {d.signupUrl && (
              <a href={d.signupUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500">
                <ExternalLink className="w-4 h-4" aria-hidden /> Open signup page
              </a>
            )}
            <button type="button" onClick={() => decideProposal(p.id, 'applied').then(() => toast.success('Marked as applied'))}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500">
              <Send className="w-4 h-4" aria-hidden /> I submitted the application
            </button>
            {!app && <p className="text-sm text-slate-500 self-center">Application draft is being written…</p>}
          </>
        )}
      </div>
    </article>
  );
};

const ContentCard: React.FC<{ p: Proposal }> = ({ p }) => {
  const { decideProposal } = useApp();
  const c = p.data?.content ?? {};
  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <h2 className="text-xl font-serif font-bold text-slate-900">{p.title}</h2>
      <p className="text-slate-600">{p.summary}</p>
      {c.landingPage && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
          <p className="text-lg font-bold text-slate-900">{c.landingPage.headline}</p>
          <p className="text-slate-700">{c.landingPage.subheadline}</p>
          <p className="text-slate-700 whitespace-pre-wrap">{c.landingPage.body}</p>
          <p className="font-semibold text-slate-900">Button: {c.landingPage.cta}</p>
          <p className="text-xs text-slate-600 border-t border-slate-200 pt-2">Disclosure: {c.landingPage.requiredDisclosure}</p>
        </div>
      )}
      {p.status === 'awaiting_approval' && (
        <div className="flex gap-3">
          <button type="button" onClick={() => decideProposal(p.id, 'approved').then(() => toast.success('Approved'))}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500">
            <CheckCircle2 className="w-4 h-4" aria-hidden /> Approve and send to marketing platform
          </button>
          <button type="button" onClick={() => decideProposal(p.id, 'rejected')}
            className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500">
            <XCircle className="w-4 h-4" aria-hidden /> Skip
          </button>
        </div>
      )}
    </article>
  );
};

const Approvals: React.FC = () => {
  const { proposals } = useApp();
  const [tab, setTab] = useState<Tab>('awaiting_approval');
  const counts = useMemo(() => proposals.reduce<Record<string, number>>((m, p) => ({ ...m, [p.status]: (m[p.status] || 0) + 1 }), {}), [proposals]);
  const shown = proposals.filter((p) => p.status === tab);

  return (
    <Layout>
      <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Approvals</h1>
          <p className="text-slate-500 mt-1">Everything the agents found overnight lands here. Nothing moves until you say so.</p>
        </div>

        <div role="tablist" aria-label="Proposal status" className="flex flex-wrap gap-2 border-b border-slate-200">
          {TABS.map((t) => (
            <button key={t.key} role="tab" type="button" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-t ${
                tab === t.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
              {t.label}{counts[t.key] ? ` (${counts[t.key]})` : ''}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" aria-hidden />
            <p className="text-slate-700 font-medium">Nothing here yet.</p>
            <p className="text-slate-500 text-sm mt-1">
              {tab === 'awaiting_approval'
                ? 'Set an agent to run nightly with a vertical, or start a research task from Workflows.'
                : 'Decisions you make will show up in this tab.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {shown.map((p) => p.type === 'affiliate_program' ? <ProgramCard key={p.id} p={p} /> : <ContentCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Approvals;
