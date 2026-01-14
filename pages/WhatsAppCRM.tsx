import React from 'react';
import { db } from '../db';
import { Client } from '../types';
import { MessageSquare, Send, Search, Phone, History, MoreVertical } from 'lucide-react';

const WhatsAppCRM = () => {
  const [clients] = React.useState<Client[]>(db.getClients());
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(clients[0] || null);
  const [message, setMessage] = React.useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !message.trim()) return;
    
    const whatsappUrl = `https://wa.me/${selectedClient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setMessage('');
  };

  return (
    <div className="h-[calc(100vh-160px)] flex bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Client List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {clients.map(client => (
            <div 
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedClient?.id === client.id ? 'bg-green-50 border-r-4 border-green-600' : ''
              }`}
            >
              <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold shrink-0">
                {client.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{client.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{client.phone}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedClient ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  {selectedClient.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedClient.fullName}</h3>
                  <p className="text-xs text-green-600 font-medium">Online (System Tracked)</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-gray-400">
                <Phone size={20} className="cursor-pointer hover:text-green-600" />
                <History size={20} className="cursor-pointer hover:text-green-600" />
                <MoreVertical size={20} className="cursor-pointer hover:text-green-600" />
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-gray-200 text-gray-500 text-[10px] font-bold uppercase rounded-full">
                  Today
                </span>
              </div>
              <div className="max-w-[70%] bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-sm">
                Hello {selectedClient.fullName}, this is from Dynamo Group management. We wanted to check in on your recent inquiry.
                <p className="text-[10px] text-gray-400 mt-1">10:45 AM</p>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <input 
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message to open in WhatsApp..."
                  className="flex-1 p-3 bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <button 
                  type="submit"
                  className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a client to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppCRM;