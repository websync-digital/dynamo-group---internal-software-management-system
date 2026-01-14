
import React from 'react';
import { db } from '../db';
import { InstallmentPlan } from '../types';
import { Clock, Send, Bell, Calendar, Mail, MessageSquare } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const Installments = () => {
  const [installments] = React.useState<InstallmentPlan[]>(db.getInstallments());
  const clients = db.getClients();
  const [generating, setGenerating] = React.useState<string | null>(null);

  const simulateReminder = async (inst: InstallmentPlan, type: 'email' | 'sms') => {
    setGenerating(inst.id);
    const client = clients.find(c => c.id === inst.clientId);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Draft a polite, professional ${type} reminder for Dynamo Group client ${client?.fullName || 'Client'}. 
      Their installment payment of ₦${(inst.totalAmount / 12).toLocaleString()} is due on ${inst.nextDueDate}. 
      Mention that payment should be made to our official bank account. Keep it brief.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      alert(`Simulated ${type} sent:\n\n${response.text}`);
    } catch (error) {
      console.error(error);
      alert(`Error simulating reminder. Manual template: Dear ${client?.fullName}, your payment of ₦${(inst.totalAmount / 12).toLocaleString()} is due on ${inst.nextDueDate}.`);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Installment & Reminders</h1>
          <p className="text-gray-500 text-sm">Automated tracking for flexible payment plans.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center space-x-2">
            <Bell className="text-green-600" size={18} />
            <h3 className="font-bold text-gray-800">Active Installment Plans</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-gray-400 uppercase tracking-wider font-bold border-b">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Total Value</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Frequency</th>
                  <th className="px-6 py-4">Next Due Date</th>
                  <th className="px-6 py-4">Reminders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {installments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No active installment plans found. Add one when assigning a plot to a client.
                    </td>
                  </tr>
                ) : installments.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{clients.find(c => c.id === inst.clientId)?.fullName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">₦{inst.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600">₦{inst.remainingAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold uppercase">{inst.frequency}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{inst.nextDueDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          disabled={generating === inst.id}
                          onClick={() => simulateReminder(inst, 'email')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                          title="Send Email Reminder"
                        >
                          <Mail size={18} />
                        </button>
                        <button 
                          disabled={generating === inst.id}
                          onClick={() => simulateReminder(inst, 'sms')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                          title="Send SMS Reminder"
                        >
                          <MessageSquare size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Installments;
