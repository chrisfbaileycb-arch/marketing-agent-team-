import React, { useState } from 'react';
import { Link } from 'react-router-dom';
    import { motion, AnimatePresence } from 'framer-motion';
    import { toast } from 'react-toastify';
    import { 
      CheckCircle2, 
      AlertCircle, 
      ArrowRight, 
      ArrowLeft, 
      Loader2, 
      FileCheck,
      ShieldCheck,
      Info
    } from 'lucide-react';
    import Layout from '../components/Layout';
    import UploadZone from '../components/UploadZone';
    import AccountIndicator from '../components/AccountIndicator';

    type Step = 'upload' | 'verify' | 'processing' | 'success';

    const Recovery: React.FC = () => {
      const [currentStep, setCurrentStep] = useState<Step>('upload');
      const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
      const [isProcessing, setIsProcessing] = useState(false);

      const handleFilesSelected = (files: File[]) => {
        setUploadedFiles(files);
      };

      const startVerification = () => {
        if (uploadedFiles.length === 0) {
          toast.error("Please upload your recovery folder first.");
          return;
        }
        setCurrentStep('verify');
      };

      const handleImport = () => {
        setIsProcessing(true);
        setCurrentStep('processing');
        
        // Simulate processing
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStep('success');
          toast.success("Content successfully attached to your account!");
        }, 3000);
      };

      return (
        <Layout>
          <div className="max-w-3xl mx-auto px-6 py-16">
            {/* Progress Header */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-serif font-bold text-slate-900">Content Recovery</h1>
                <span className="text-sm font-medium text-slate-500">
                  Step {currentStep === 'upload' ? '1' : currentStep === 'verify' ? '2' : '3'} of 3
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-600"
                  initial={{ width: '33%' }}
                  animate={{ 
                    width: currentStep === 'upload' ? '33%' : currentStep === 'verify' ? '66%' : '100%' 
                  }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {currentStep === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex gap-4">
                    <Info className="w-6 h-6 text-blue-600 shrink-0" />
                    <p className="text-sm text-blue-800 leading-relaxed">
                      <strong>Pro Tip:</strong> If you have a large folder, we recommend zipping it first for a faster upload. We support .zip, .tar, and individual file selections.
                    </p>
                  </div>

                  <UploadZone onFilesSelected={handleFilesSelected} />

                  <div className="flex justify-end">
                    <button
                      onClick={startVerification}
                      disabled={uploadedFiles.length === 0}
                      className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Continue to Verification <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 'verify' && (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6">
                    <h2 className="text-xl font-bold text-slate-900">Confirm Account Context</h2>
                    <p className="text-slate-500">
                      Please ensure the email below is the account you want to attach the recovered content to.
                    </p>
                    
                    <AccountIndicator email="alex.smith@example.com" isCorrect={true} />

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-indigo-600" />
                        Import Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Total Files</span>
                          <span className="font-semibold text-slate-900">{uploadedFiles.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Estimated Size</span>
                          <span className="font-semibold text-slate-900">
                            {(uploadedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Destination</span>
                          <span className="font-semibold text-slate-900">Primary Workspace</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between gap-4">
                    <button
                      onClick={() => setCurrentStep('upload')}
                      className="px-8 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button
                      onClick={handleImport}
                      className="flex-grow sm:flex-grow-0 bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                      Confirm & Import Content
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 space-y-8"
                >
                  <div className="relative w-24 h-24 mx-auto">
                    <Loader2 className="w-24 h-24 text-indigo-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-indigo-600" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Attaching Content...</h2>
                    <p className="text-slate-500">This usually takes less than a minute. Please don't close this window.</p>
                  </div>
                  <div className="max-w-xs mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-600"
                      animate={{ x: [-100, 300] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-8"
                >
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">Recovery Complete!</h2>
                    <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                      Your content has been successfully attached to <strong>alex.smith@example.com</strong>. You can now access these files in your main dashboard.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link
                      to="/"
                      className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                    >
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setUploadedFiles([]);
                        setCurrentStep('upload');
                      }}
                      className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                    >
                      Recover More Content
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Layout>
      );
    };

    export default Recovery;