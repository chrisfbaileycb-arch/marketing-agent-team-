import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  ShoppingBag, 
  Zap, 
  Bell, 
  Plus,
  TrendingUp,
  Shield,
  Workflow
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Campaigns', path: '/campaigns', icon: Target },
    { name: 'Agents', path: '/agents', icon: Users },
    { name: 'Workflows', path: '/workflows', icon: Workflow },
    { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
    { name: 'Skills', path: '/skills', icon: Zap },
    { name: 'HTTPS Layers', path: '/https-layers', icon: Shield },
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
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};

export default Layout;