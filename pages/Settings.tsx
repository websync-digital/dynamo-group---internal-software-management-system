
import React from 'react';
import { db } from '../db';
import { SmsSettings } from '../types';
import { Settings as SettingsIcon, Save, MessageSquare, Zap, Shield, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = React.useState<SmsSettings>({ apiUrl: '', apiKey: '', senderId: 'DYNAMO', isConfigured: false, template: '' });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    const fetchSettings = async () => {
      const data = await db.getSmsSettings();
      setSettings(data);
      setIsLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await db.saveSmsSettings(settings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Configuration</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-[10px] tracking-widest flex items-center gap-2">
            <Zap className="text-orange-500" size={14} /> Global Admin & API Controls
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
          settings.isConfigured ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
        }`}>
          {settings.isConfigured ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {settings.isConfigured ? 'API Mode Active' : 'Native Mode (Fallback)'}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SMS API Hub */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gray-900 text-white rounded-2xl">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 leading-none">Universal SMS Connector</h3>
                <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest italic">One-click automation engine</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Provider API Endpoint</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
                    <Shield size={18} />
                  </div>
                  <input 
                    type="url" 
                    placeholder="e.g. https://api.termii.com/api/send"
                    value={settings.apiUrl}
                    onChange={e => setSettings({...settings, apiUrl: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Secret API Key (Restricted)</label>
                <input 
                  type="password" 
                  placeholder="Paste your provider key here..."
                  value={settings.apiKey}
                  onChange={e => setSettings({...settings, apiKey: e.target.value})}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-medium text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Sender Identity (SID)</label>
                <input 
                  type="text" 
                  placeholder="e.g. DYNAMO-GRP"
                  value={settings.senderId}
                  onChange={e => setSettings({...settings, senderId: e.target.value})}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-black text-sm uppercase tracking-widest"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Operational Mode</label>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                  <button 
                    type="button" 
                    onClick={() => setSettings({...settings, isConfigured: true})}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      settings.isConfigured ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    API Automation
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSettings({...settings, isConfigured: false})}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      !settings.isConfigured ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    Native Link
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">SMS Reminder Template</label>
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded cursor-help" title="Use {name}, {amount}, and {date} as auto-fill variables.">
                  <HelpCircle size={12} />
                  Available Tags
                </div>
              </div>
              <textarea 
                rows={3}
                value={settings.template}
                onChange={e => setSettings({...settings, template: e.target.value})}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-green-500 outline-none transition-all text-sm font-medium leading-relaxed"
                placeholder="Write your message template..."
              />
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button 
                type="submit"
                disabled={isSaving}
                className={`flex items-center space-x-2 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl ${
                  saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-black'
                }`}
              >
                {saveStatus === 'success' ? <CheckCircle size={18} /> : <Save size={18} />}
                <span>{isSaving ? 'Configuring...' : saveStatus === 'success' ? 'Settings Locked' : 'Synchronize Configuration'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Documentation / Guidance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white border border-gray-100 rounded-2xl space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 1: Get Access</h4>
            <p className="text-xs text-gray-600 font-medium">Create an account with Termii, Vonage, or SendChamp and obtain your secret API keys.</p>
          </div>
          <div className="p-6 bg-white border border-gray-100 rounded-2xl space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 2: Sync API</h4>
            <p className="text-xs text-gray-600 font-medium">Paste the endpoint URL and Keys above. Ensure "API Automation" mode is selected.</p>
          </div>
          <div className="p-6 bg-white border border-gray-100 rounded-2xl space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step 3: Test Sync</h4>
            <p className="text-xs text-gray-600 font-medium">Navigate to any client or installment and send an SMS. The system will now route it through the API.</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
