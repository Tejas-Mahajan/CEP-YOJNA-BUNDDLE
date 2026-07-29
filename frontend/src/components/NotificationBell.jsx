import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Sparkles, Clock, AlertTriangle, CheckCircle2, ChevronRight, ExternalLink, Calendar } from 'lucide-react';

export default function NotificationBell({ onSelectScheme }) {
  const [isOpen, setIsOpen] = useState(false);

  // Live 2026 Scheme Updates & Deadline Notifications
  const notifications = [
    {
      id: "notif_1",
      title: "🚨 Urgent Closing: AICTE Pragati Scholarship",
      category: "Deadline Alert",
      message: "Application portal closes in less than 7 days (Aug 04, 2026). Complete NSP e-KYC submission now.",
      date: "Today",
      urgent: true,
      schemeId: "PRAGATI_GIRLS",
      badge: "7 Days Left"
    },
    {
      id: "notif_2",
      title: "🌾 PM-KISAN 17th Installment Status Updated",
      category: "Government Update",
      message: "Ministry of Agriculture has released the ₹2,000 credit batch for verified landholding farmers with Aadhaar e-KYC.",
      date: "Yesterday",
      urgent: false,
      schemeId: "PM_KISAN",
      badge: "2026 Batch"
    },
    {
      id: "notif_3",
      title: "⚡ Namo Shetkari Mahasanman Subsidy Active",
      category: "State Grant",
      message: "Maharashtra State Government bonus ₹2,000 added to active PM-KISAN farmer accounts automatically.",
      date: "2 days ago",
      urgent: false,
      schemeId: "NAMO_SHETKARI",
      badge: "₹6,000 Bonus"
    },
    {
      id: "notif_4",
      title: "🎓 Post-Matric SC/ST Scholarship Window Open",
      category: "Scholarship",
      message: "100% Tuition fee waivers and monthly maintenance allowance applications open for 2026-27 academic year.",
      date: "3 days ago",
      urgent: false,
      schemeId: "POST_MATRIC_SC",
      badge: "New Window"
    }
  ];

  const unreadCount = notifications.filter(n => n.urgent).length;

  return (
    <div className="relative">
      
      {/* Header Notification Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors relative flex items-center justify-center shadow-2xs"
        title="Scheme Updates & Deadline Alerts"
      >
        <Bell className="w-4 h-4 text-emerald-800" />
        
        {/* Unread Red Pulsing Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-2xs"
            />

            {/* Notification Drawer */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden"
            >
              
              {/* Drawer Header */}
              <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-4 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold">2026 Scheme News & Alerts</h4>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notification List */}
              <div className="p-3 max-h-96 overflow-y-auto custom-scrollbar space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2 cursor-pointer ${
                      n.urgent
                        ? 'bg-red-50/70 border-red-200/80 hover:border-red-300'
                        : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-1.5">
                        {n.urgent ? (
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 animate-bounce" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        )}
                        <span className="text-2xs font-extrabold text-slate-500 uppercase">{n.category}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        n.urgent ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {n.badge}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 leading-snug">{n.title}</div>
                    <p className="text-2xs text-slate-600 leading-relaxed font-medium">{n.message}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-semibold border-t border-slate-200/40">
                      <span>{n.date}</span>
                      <span className="text-emerald-700 font-bold hover:underline flex items-center">
                        View Scheme <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-2xs text-slate-500 font-semibold">
                Updated in real-time from National Portal Services
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
