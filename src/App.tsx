import React from 'react';
import { CompetitionList } from './components/CompetitionList';
import { Toaster } from 'sonner';
import { Trophy, Home, User, Bell, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#FDFDFF] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      <Toaster position="top-center" richColors />
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-16 sm:h-20">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-gray-900 leading-none">GEEK HUB</span>
              <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase opacity-70">高校竞赛中心</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500">
            <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">探索竞赛</a>
            <a href="#" className="hover:text-gray-900 transition-colors">卷王榜</a>
            <a href="#" className="hover:text-gray-900 transition-colors">我的订阅</a>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 border-2 border-white shadow-md cursor-pointer"></div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-12 md:py-24 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 opacity-30 blur-3xl w-[500px] h-[500px] bg-blue-400 rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5" />
              2026 赛季全国竞赛地图已开启
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight mb-8">
              每一个奖项，<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">都是通往卓越的入场券。</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed max-w-xl">
              为极客而生的一站式竞赛治理平台。从赛事订阅到系统级提醒，我们不只是聚合信息，更是你的备赛指挥部。
            </p>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-24">
        <CompetitionList />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-gray-300" />
            <span className="text-sm font-bold text-gray-400 tracking-tighter">COLLEGE COMPETITION HUB © 2026</span>
          </div>
          <div className="flex gap-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">隐私政策</a>
            <a href="#" className="hover:text-blue-600 transition-colors">服务条款</a>
            <a href="#" className="hover:text-blue-600 transition-colors">关于我们</a>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Navigation (Mobile Only) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-white/90 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-[32px] h-16 flex items-center justify-around px-8 z-50">
        <Home className="w-6 h-6 text-blue-600" />
        <Trophy className="w-6 h-6 text-gray-300" />
        <Bell className="w-6 h-6 text-gray-300" />
        <User className="w-6 h-6 text-gray-300" />
      </div>
    </div>
  );
}
