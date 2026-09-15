import React from 'react';
    import { motion } from 'framer-motion';
    import { User, Mail, Shield, Key, LogOut, ExternalLink } from 'lucide-react';
    import Layout from '../components/Layout';
    import AccountIndicator from '../components/AccountIndicator';

    const Profile: React.FC = () => {
      return (
        <Layout>
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="mb-12">
              <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Account Context</h1>
              <p className="text-slate-500">Manage your profile and verify your recovery destination.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                {/* Profile Card */}
                <section className="bg-white border border-slate-200 rounded-3xl p-8">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                      <User className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Alex Smith</h2>
                      <p className="text-slate-500">Member since January 2024</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Email Address</p>
                          <p className="font-medium text-slate-900">alex.smith@example.com</p>
                        </div>
                      </div>
                      <button className="text-indigo-600 text-sm font-bold hover:underline">Change</button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Account Type</p>
                          <p className="font-medium text-slate-900">Professional Plan</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Active</span>
                    </div>
                  </div>
                </section>

                {/* Security Section */}
                <section className="bg-white border border-slate-200 rounded-3xl p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Security & Privacy</h3>
                  <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-slate-400" />
                        <span className="font-medium text-slate-700">Update Password</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-slate-400" />
                        <span className="font-medium text-slate-700">Two-Factor Authentication</span>
                      </div>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Disabled</span>
                    </button>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                {/* Recovery Status Sidebar */}
                <div className="bg-indigo-600 rounded-3xl p-8 text-white">
                  <h3 className="font-bold text-lg mb-4">Recovery Status</h3>
                  <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                    You are currently logged into your primary account. Any content recovered will be attached here.
                  </p>
                  <AccountIndicator email="alex.smith@example.com" isCorrect={true} />
                  <button className="w-full mt-6 bg-white/10 hover:bg-white/20 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                    Switch Account <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-900 rounded-3xl p-8 text-white">
                  <h3 className="font-bold text-lg mb-4">Need Help?</h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Can't find your downloaded folder or having trouble with the import?
                  </p>
                  <a href="#" className="flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                    Visit Help Center <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      );
    };

    export default Profile;