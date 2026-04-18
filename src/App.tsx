import React, { useState } from 'react';
import { CompetitionList } from './components/CompetitionList';
import { HallOfFameCard } from './components/HallOfFameCard';
import { Competition, hallOfFame } from './data';
import { Toaster, toast } from 'sonner';
import { Trophy, Home, User, Bell, Sparkles, X, Calendar, Target, ExternalLink, FileText, Copy, Check, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';

import { AIAssistant } from './components/AIAssistant';
import { SubmitContest } from './components/SubmitContest';
import { ProfileView } from './components/ProfileView';
import { NotificationCenter } from './components/NotificationCenter';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'hall' | 'profile'>('home');
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbCompetitions, setDbCompetitions] = useState<Competition[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<string[]>([]);
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();

  const fetchSubscriptions = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch('/api/subscriptions', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUserSubscriptions(data.map((s: any) => s.competition_id));
      } else if (response.status === 401) {
        logout(true);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    }
  };

  const fetchCompetitions = async () => {
    try {
      const response = await fetch('/api/competitions');
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setDbCompetitions(data);
        }
      } else {
        const errorText = await response.text();
        console.warn(`Fetch returned status ${response.status}: ${errorText}`);
      }
    } catch (err: any) {
      console.error('Failed to fetch competitions:', err);
      // Only toast on sync, but for initial load maybe just a warning if it's empty
    }
  };

  React.useEffect(() => {
    fetchCompetitions();
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptions();
    } else {
      setUserSubscriptions([]);
    }
  }, [isAuthenticated]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync-competitions', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        toast.success(`🎉 ${data.message} (共 ${data.count} 项)`);
        fetchCompetitions(); // Refresh after sync
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error('同步失败：' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAISuccess = (data: any) => {
    // In a real app, this would update local state or Supabase
    toast.success(`成功识别赛事：${data.title}`);
    setActiveTab('home');
    // Scroll to top or show a success overlay
  };

  // Portfolio Generation logic (keeping mock for demo but making it safer)
  const generateMarkdown = () => {
    const name = user?.username || '极客同学';
    return `
# ${name} 的竞赛作品集

## 🎓 个人背景
- **电子邮箱**: ${user?.email || '未登录'}
- **专业**: 计算机科学与技术 (示例)
- **技能标签**: React / TypeScript / AI / 算法

## 🏆 获奖记录
- **2025 蓝桥杯全国软件大赛** | 一等奖 | *2025-06*
- **2024 “互联网+”大学生创新创业大赛** | 银奖 | *2024-10*

---
*生成自：高校竞赛中心 Geek Hub*
`.trim();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setIsCopied(true);
    toast.success('作品集 Markdown 已复制到剪贴板');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleSubscription = async (compId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      toast.error('请先登录后再订阅');
      return;
    }

    try {
      const response = await fetch(`/api/competitions/${compId}/subscribe`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        if (data.subscribed) {
          setUserSubscriptions(prev => [...prev, compId]);
          toast.success('订阅成功！截止前 3 天我们将通过通知中心提醒你。');
        } else {
          setUserSubscriptions(prev => prev.filter(id => id !== compId));
          toast.info('已取消订阅');
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error('操作失败：' + err.message);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-16">
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-4">
                    🤖 AI 深度解析录入
                  </h2>
                  <p className="text-gray-400 font-medium max-w-lg mx-auto">
                    粘贴任何凌乱的竞赛网页、公告或详情，由 DeepSeek 智能模型自动为你提取核心结构化数据。
                  </p>
                </div>
                <AIAssistant onSuccess={handleAISuccess} />
              </div>
            </section>
            
            <div className="pt-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">精选赛事库</h3>
                <div className="h-0.5 flex-1 bg-gray-100 mx-8"></div>
              </div>
              <CompetitionList 
                onItemClick={setSelectedComp} 
                competitions={dbCompetitions.length > 0 ? dbCompetitions : undefined} 
              />
            </div>
          </div>
        );
      case 'hall':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {hallOfFame.map(hall => (
              <HallOfFameCard key={hall.id} entry={hall} onClick={() => {}} />
            ))}
          </div>
        );
      case 'profile':
        return <ProfileView onGeneratePortfolio={() => setShowPortfolio(true)} />;
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-100 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">
            Geek Hub Initializing...
          </p>
        </div>
      </div>
    );
  }

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
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
            >
              提交竞赛
            </button>
          </div>

          <div className="flex items-center gap-4">
            {activeTab === 'home' && (
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="hidden lg:flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 hover:bg-amber-100 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? '同步中...' : '同步权威赛事'}
              </button>
            )}

            <NotificationCenter />
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => setActiveTab('profile')}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-black">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-blue-700">{user?.username}</span>
                </div>
                <button 
                  onClick={logout}
                  className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs"
              >
                登录 / 注册
              </Button>
            )}
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
            <Dialog.Title className="sr-only">竞赛详情</Dialog.Title>
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
                    {selectedComp.ai_suggestion && (
                      <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">DeepSeek 备赛建议</span>
                        </div>
                        <p className="text-xs text-blue-900/70 font-bold leading-relaxed italic">
                          “{selectedComp.ai_suggestion}”
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">核心技术栈</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedComp.techStack) && selectedComp.techStack.map(tech => (
                        <span key={tech} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs font-bold border border-gray-100 italic">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button 
                      className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl text-lg font-black shadow-lg shadow-blue-100"
                      onClick={() => {
                        if (!isAuthenticated) {
                          setShowAuthModal(true);
                          toast.error('请先登录后再报名');
                          return;
                        }
                        window.open(selectedComp.registrationUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-5 h-5 mr-3" />
                      前往官网报名
                    </Button>
                    <Button
                      variant="outline"
                      className={`h-14 px-6 rounded-2xl border-2 transition-all ${
                        userSubscriptions.includes(selectedComp.id)
                          ? 'border-red-100 text-red-500 hover:bg-red-50'
                          : 'border-blue-100 text-blue-600 hover:bg-blue-50'
                      }`}
                      onClick={() => handleToggleSubscription(selectedComp.id)}
                    >
                      <Bell className={`w-6 h-6 ${userSubscriptions.includes(selectedComp.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Portfolio Generator Dialog */}
      <Dialog.Root open={showPortfolio} onOpenChange={setShowPortfolio}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl bg-white rounded-[32px] shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 duration-200 focus:outline-none flex flex-col max-h-[90vh]">
            <Dialog.Title className="sr-only">作品集生成器</Dialog.Title>
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <Dialog.Title className="text-xl font-black text-gray-900 tracking-tight">作品集生成器</Dialog.Title>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">PORTFOLIO MARKDOWN DRAFT</p>
              </div>
              <Dialog.Close className="text-gray-400 hover:text-gray-900 bg-white p-2 rounded-full shadow-sm transition-colors border border-gray-100">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            <div className="p-8 overflow-y-auto no-scrollbar bg-white">
              <div className="bg-gray-900 rounded-2xl p-6 relative group">
                <button 
                  onClick={copyToClipboard}
                  className="absolute right-4 top-4 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white p-2.5 rounded-xl transition-all border border-white/10 flex items-center gap-2 text-xs font-bold"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? '已复制' : '复制代码'}
                </button>
                <pre className="text-blue-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {generateMarkdown()}
                </pre>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <h5 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-2">使用提示</h5>
                  <p className="text-xs text-blue-900/60 leading-relaxed font-medium">
                    Markdown 格式已根据简历标准优化。你可以直接将其复制到 Notion、GitHub Profile 或导出为 PDF。
                  </p>
                </div>
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                  <h5 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-2">数据来源</h5>
                  <p className="text-xs text-amber-900/60 leading-relaxed font-medium">
                    目前基于你的“荣誉勋章”与“个人档案”自动抓取。保持档案更新，作品集将更硬核。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex gap-4">
              <Button 
                onClick={copyToClipboard}
                className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-3"
              >
                <Copy className="w-5 h-5" />
                复制全部内容
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Submit Contest Modal */}
      <Dialog.Root open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4 z-[101] animate-in zoom-in-95 fade-in duration-200 focus:outline-none focus-visible:ring-0">
            <Dialog.Title className="sr-only">提交新竞赛</Dialog.Title>
            <SubmitContest onClose={() => setShowSubmitModal(false)} />
            <Dialog.Close asChild>
              <button 
                className="absolute top-4 right-8 p-2 text-gray-400 hover:text-gray-900 transition-colors bg-white rounded-full border border-gray-100 shadow-sm"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
