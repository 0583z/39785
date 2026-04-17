import React, { useState } from 'react';
import { CompetitionList } from './components/CompetitionList';
import { HallOfFameCard } from './components/HallOfFameCard';
import { Competition, hallOfFame } from './data';
import { Toaster, toast } from 'sonner';
import { Trophy, Home, User, Bell, Sparkles, X, Calendar, Target, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'hall' | 'profile'>('home');
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <CompetitionList onItemClick={setSelectedComp} />;
      case 'hall':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {hallOfFame.map(hall => (
              <HallOfFameCard key={hall.id} entry={hall} onClick={() => {}} />
            ))}
          </div>
        );
      case 'profile':
        return (
          <div className="max-w-2xl mx-auto bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-xl border-4 border-white"></div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">极客同学</h2>
                <p className="text-gray-400 font-medium">还没有填写任何获奖记录哦 🏆</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[ { l: '订阅', v: '0' }, { l: '专注', v: '0m' }, { l: '荣誉', v: '0' } ].map(i => (
                <div key={i.l} className="bg-gray-50 rounded-2xl p-4 text-center">
                  <div className="text-xl font-black text-gray-900">{i.v}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{i.l}</div>
                </div>
              ))}
            </div>
            <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold shadow-lg shadow-blue-100">
              编辑个人资料 (建设中)
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      <Toaster position="top-center" richColors />
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-16 sm:h-20">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-gray-900 leading-none">GEEK HUB</span>
              <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase opacity-70">高校竞赛中心</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500">
            <button 
              onClick={() => setActiveTab('home')}
              className={`transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'hover:text-gray-900'}`}
            >
              探索竞赛
            </button>
            <button 
              onClick={() => setActiveTab('hall')}
              className={`transition-colors ${activeTab === 'hall' ? 'text-blue-600' : 'hover:text-gray-900'}`}
            >
              卷王榜
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'hover:text-gray-900'}`}
            >
              我的档案
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors relative"
              onClick={() => toast.info('通知中心暂无新消息')}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div 
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setActiveTab('profile')}
            ></div>
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
      <main className="max-w-7xl mx-auto px-6 pb-24 min-h-[50vh]">
        {renderContent()}
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
        <button onClick={() => setActiveTab('home')}>
          <Home className={`w-6 h-6 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-300'}`} />
        </button>
        <button onClick={() => setActiveTab('hall')}>
          <Trophy className={`w-6 h-6 ${activeTab === 'hall' ? 'text-blue-600' : 'text-gray-300'}`} />
        </button>
        <button onClick={() => setActiveTab('profile')}>
          <User className={`w-6 h-6 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-300'}`} />
        </button>
      </div>

      {/* Competition Detail Dialog */}
      <Dialog.Root open={!!selectedComp} onOpenChange={(open) => !open && setSelectedComp(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[32px] shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 duration-200 focus:outline-none">
            {selectedComp && (
              <div className="flex flex-col max-h-[85vh]">
                <div className="bg-blue-600 p-8 text-white relative">
                  <Dialog.Close className="absolute right-4 top-4 text-white/60 hover:text-white bg-white/10 p-2 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </Dialog.Close>
                  <div className="flex gap-2 mb-3">
                    <Badge className="bg-white/20 text-white border-none text-[10px] font-black uppercase tracking-widest">{selectedComp.level}</Badge>
                    <Badge className="bg-white/20 text-white border-none text-[10px] font-black uppercase tracking-widest">{selectedComp.category}</Badge>
                  </div>
                  <Dialog.Title className="text-2xl font-black leading-tight tracking-tight">{selectedComp.name}</Dialog.Title>
                </div>
                
                <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">截止日期</div>
                        <div className="text-sm font-bold text-gray-900">{selectedComp.deadline.split('T')[0]}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">历史获奖率</div>
                        <div className="text-sm font-bold text-gray-900">{(selectedComp.historicalAwardRatio * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      竞赛简介
                    </h4>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      {selectedComp.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">核心技术栈</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedComp.techStack.map(tech => (
                        <span key={tech} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs font-bold border border-gray-100 italic">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button 
                      className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl text-lg font-black shadow-lg shadow-blue-100"
                      onClick={() => window.open(selectedComp.registrationUrl, '_blank')}
                    >
                      <ExternalLink className="w-5 h-5 mr-3" />
                      前往官网报名
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
