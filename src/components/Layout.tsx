import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  ShoppingBag, 
  Zap, 
  TrendingUp,
  Shield,
  Workflow,
  ClipboardCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, signIn, signOutUser, proposals } = useApp();
  const pending = proposals.filter((p) => p.status === 'awaiting_approval').length;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Campaigns', path: '/campaigns', icon: Target },
    { name: 'Agents', path: '/agents', icon: Users },
    { name: 'Workflows', path: '/workflows', icon: Workflow },
    { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
    { name: 'Skills', path: '/skills', icon: Zap },
    { name: 'HTTPS Layers', path: '/https-layers', icon: Shield },
    { name: 'Approvals', path: '/approvals', icon: ClipboardCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">AffiliateAgent</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    location.pathname === item.path 
                      ? 'text-brand-500' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                  {item.path === '/approvals' && pending > 0 && (
                    <span className="ml-1 min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-brand-500 text-white text-[11px] font-bold text-center" aria-label={`${pending} awaiting approval`}>{pending}</span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-slate-600" title={`UID: ${user.uid}`}>{user.email}</span>
                <button type="button" onClick={signOutUser} className="p-2 text-slate-400 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg" aria-label="Sign out">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button type="button" onClick={signIn} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500">
                <LogIn className="w-4 h-4" aria-hidden />
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {user ? children : (
          <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
            <h1 className="text-2xl font-serif font-bold text-slate-900">Sign in to open your workspace</h1>
            <p className="text-slate-600">This tool is locked to a single owner account. Sign in with the Google account whose UID is set in <code>firestore.rules</code> and <code>functions/.env</code>.</p>
            <button type="button" onClick={signIn} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500">Sign in with Google</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;