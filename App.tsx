import React, { Suspense, lazy } from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppProvider } from './src/context/AppContext';

const Home = lazy(() => import('./src/pages/Home.tsx'));
const Campaigns = lazy(() => import('./src/pages/Campaigns.tsx'));
const Agents = lazy(() => import('./src/pages/Agents.tsx'));
const Workflows = lazy(() => import('./src/pages/Workflows.tsx'));
const Marketplace = lazy(() => import('./src/pages/Marketplace.tsx'));
const Skills = lazy(() => import('./src/pages/Skills.tsx'));
const HttpsLayers = lazy(() => import('./src/pages/HttpsLayers.tsx'));
const NotFound = lazy(() => import('./src/pages/NotFound.tsx'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
  </div>
);

const App: React.FC = () => {
  return (
    <Theme appearance="light" radius="large" scaling="100%">
      <AppProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/https-layers" element={<HttpsLayers />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <ToastContainer position="bottom-right" theme="light" />
        </Router>
      </AppProvider>
    </Theme>
  );
}

export default App;