import React from 'react';
import { Lock, Award } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLogin: () => void;
}

const DynamoLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`${className} bg-green-600 rounded-lg shadow-lg shadow-green-900/20 flex items-center justify-center`}>
    <div className="w-1/2 h-1/2 border-t-2 border-l-2 border-white/40 rounded-sm italic font-black text-[8px] text-white/20 select-none">D</div>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Design */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600/10 rounded-[2.5rem] border border-green-600/20 mb-4 transition-transform hover:scale-105 duration-500">
              <DynamoLogo className="w-12 h-12 shadow-2xl shadow-green-600/40" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Welcome Admin</h1>
              <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.35em]">Dynamo Group • Executive Terminal</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Authorized Email</label>
                <div className="relative group">
                  <input 
                    autoFocus
                    type="email" 
                    placeholder="admin@dynamogroup.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border-2 border-white/5 focus:border-green-600 p-5 px-6 rounded-2xl text-white font-bold placeholder:text-gray-600 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Secure Passcode</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-white/5 border-2 ${error ? 'border-red-500 animate-shake' : 'border-white/5 focus:border-green-600'} p-5 pl-14 rounded-2xl text-white font-bold placeholder:text-gray-600 outline-none transition-all shadow-inner`}
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-[10px] font-black block text-center mt-2 animate-in slide-in-from-top-1">{error}</p>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-green-500 transition-all shadow-2xl shadow-green-900/20 active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              {loading ? 'Authenticating...' : 'Initialize Node'} <DynamoLogo className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </form>

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
              <Award size={12} /> Encrypted Session • Dynamo HQ
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-gray-700 font-black text-[9px] uppercase tracking-[0.4em]">
          Internal Management System v2.1
        </p>
      </div>
    </div>
  );
};

export default Login;
