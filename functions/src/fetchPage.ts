/**
 * Read a public web page as text. Plain HTTP first; if the result is thin
 * (JS-rendered, blocked, or empty) fall back to headless Chromium.
 *
 * This is a reader, not an actor: no clicking, no form filling, no logins.
 */
import * as functions from 'firebase-functions';

export interface PageText {
  url: string;
  finalUrl: string;
  title: string;
  text: string;
  via: 'http' | 'browser' | 'failed';
  error?: string;
}

const UA = 'Mozilla/5.0 (compatible; MoneyMakingTeamResearchBot/1.0; +affiliate-research; contact via site owner)';
const MAX_CHARS = 20_000;
const THIN_THRESHOLD = 1_200;   // fewer chars of real text than this → try the browser

function htmlToText(html: string): { title: string; text: string } {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim();
  let t = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(nav|footer|header|aside)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h[1-6]|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
  return { title, text: t.slice(0, MAX_CHARS) };
}

async function viaHttp(url: string): Promise<PageText> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,*/*' }, redirect: 'follow', signal: ctrl.signal });
    const html = await res.text();
    const { title, text } = htmlToText(html);
    return { url, finalUrl: res.url || url, title, text, via: 'http', ...(res.ok ? {} : { error: `HTTP ${res.status}` }) };
  } finally {
    clearTimeout(timer);
  }
}

async function viaBrowser(url: string): Promise<PageText> {
  const chromium = (await import('@sparticuz/chromium')).default;
  const { chromium: pw } = await import('playwright-core');
  const executablePath = process.env.CHROME_PATH || (await chromium.executablePath());
  const browser = await pw.launch({ executablePath, args: chromium.args, headless: true });
  try {
    const page = await browser.newPage({ userAgent: UA, viewport: { width: 1280, height: 900 } });
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      return ['image', 'media', 'font'].includes(type) ? route.abort() : route.continue();
    });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 25_000 });
    const title = await page.title();
    // evaluated in the browser; string form so the functions tsconfig needn't include "dom"
    const text: string = await page.evaluate(`(() => {
      document.querySelectorAll('script,style,noscript,nav,footer,header,aside').forEach(n => n.remove());
      return document.body ? document.body.innerText : '';
    })()`);
    return { url, finalUrl: page.url(), title, text: text.replace(/\n\s*\n+/g, '\n').trim().slice(0, MAX_CHARS), via: 'browser' };
  } finally {
    await browser.close();
  }
}

export async function fetchPageText(url: string, opts: { allowBrowser?: boolean } = {}): Promise<PageText> {
  const allowBrowser = opts.allowBrowser ?? (process.env.RESEARCH_BROWSER_FALLBACK !== 'false');
  let first: PageText;
  try {
    first = await viaHttp(url);
    if (first.text.length >= THIN_THRESHOLD && !first.error) return first;
  } catch (e) {
    first = { url, finalUrl: url, title: '', text: '', via: 'failed', error: e instanceof Error ? e.message : String(e) };
  }
  if (!allowBrowser) return first;
  try {
    functions.logger.info(`[fetch] ${url} thin via http (${first.text.length} chars${first.error ? `, ${first.error}` : ''}); trying browser`);
    const b = await viaBrowser(url);
    return b.text.length > first.text.length ? b : first;
  } catch (e) {
    functions.logger.warn(`[fetch] browser failed for ${url}: ${e instanceof Error ? e.message : e}`);
    return { ...first, via: first.text ? first.via : 'failed', error: first.error || (e instanceof Error ? e.message : String(e)) };
  }
}
