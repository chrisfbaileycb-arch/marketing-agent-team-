import React from 'react';
    import { User, CheckCircle2, AlertCircle } from 'lucide-react';

    interface AccountIndicatorProps {
      email: string;
      isCorrect: boolean;
    }

    const AccountIndicator: React.FC<AccountIndicatorProps> = ({ email, isCorrect }) => {
      return (
        <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
          isCorrect 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
            : 'bg-amber-50 border-amber-100 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCorrect ? 'bg-emerald-200' : 'bg-amber-200'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Current Account</p>
              <p className="font-medium">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <span className="text-sm font-medium hidden sm:inline">Verified Profile</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </>
            ) : (
              <>
                <span className="text-sm font-medium hidden sm:inline">Action Required</span>
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </>
            )}
          </div>
        </div>
      );
    };

    export default AccountIndicator;