/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { competitions as initialCompetitions, hallOfFame, Competition, HallOfFame } from './data';
import { CompetitionCard } from './components/CompetitionCard';
import { HallOfFameCard } from './components/HallOfFameCard';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Toaster, toast } from 'sonner';
import { Search, Filter, Trophy, Home, User, Bell, X, ExternalLink, Calendar, Target, Users, Lightbulb, Sparkles, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import * as Dialog from '@radix-ui/react-dialog';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('全部');
  const [selectedLevel, setSelectedLevel] = useState('全部');
  const [selectedTimeRange, setSelectedTimeRange] = useState('全部');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [selectedHall, setSelectedHall] = useState<HallOfFame | null>(null);
  const [userGoal, setUserGoal] = useState<'保研' | '就业'>('保研');
  const [userMajor, setUserMajor] = useState<string>('');
  const [userName, setUserName] = useState('张伟');
  const [userGrade, setUserGrade] = useState('大三');
  const [followedIds, setFollowedIds] = useState<number[]>([]);
  const [registeredIds, setRegisteredIds] = useState<number[]>([]);
  const [certificates, setCertificates] = useState<{id: string, name: string, date: string, level: string}[]>([
    { id: '1', name: '第十四届蓝桥杯全国软件和信息技术专业人才大赛', date: '2023-06', level: '国家级二等奖' },
    { id: '2', name: '2023年全国大学生数学建模竞赛', date: '2023-09', level: '省级一等奖' }
  ]);
  
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isListViewOpen, setIsListViewOpen] = useState(false);
  const [listType, setListType] = useState<'followed' | 'registered' | 'certs'>('followed');

  // Local state for all competitions (initial + user submitted)
  const [allCompetitions, setAllCompetitions] = useState<Competition[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedComps = localStorage.getItem('user_competitions');
    const savedGoal = localStorage.getItem('user_goal') as '保研' | '就业';
    const savedMajor = localStorage.getItem('user_major');
    const savedName = localStorage.getItem('user_name');
    const savedGrade = localStorage.getItem('user_grade');
    const savedFollowed = localStorage.getItem('user_followed');
    const savedRegistered = localStorage.getItem('user_registered');

    if (savedGoal) setUserGoal(savedGoal);
    if (savedName) setUserName(savedName);
    if (savedGrade) setUserGrade(savedGrade);
    if (savedFollowed) setFollowedIds(JSON.parse(savedFollowed));
    if (savedRegistered) setRegisteredIds(JSON.parse(savedRegistered));
    
    if (savedMajor) {
      setUserMajor(savedMajor);
    } else {
      setIsFirstTime(true);
    }

    if (savedComps) {
      try {
        const userComps = JSON.parse(savedComps);
        setAllCompetitions([...initialCompetitions, ...userComps]);
      } catch (e) {
        setAllCompetitions(initialCompetitions);
      }
    } else {
      setAllCompetitions(initialCompetitions);
    }
  }, []);

  const handleOnboardingComplete = (major: string, goal: '保研' | '就业') => {
    setUserMajor(major);
    setUserGoal(goal);
    localStorage.setItem('user_major', major);
    localStorage.setItem('user_goal', goal);
    setIsFirstTime(false);
    toast.success('设置成功！', {
      description: `已为您开启 ${major} 专业 ${goal} 导向的智能推荐。`
    });
  };

  const toggleFollow = (id: number) => {
    setFollowedIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem('user_followed', JSON.stringify(next));
      if (!prev.includes(id)) toast.success('已加入关注列表');
      return next;
    });
  };

  const toggleRegister = (id: number) => {
    setRegisteredIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem('user_registered', JSON.stringify(next));
      if (!prev.includes(id)) toast.success('报名成功！已同步至个人中心');
      return next;
    });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_name', userName);
    localStorage.setItem('user_grade', userGrade);
    setIsEditProfileOpen(false);
    toast.success('个人信息已更新');
  };

  const majors = ['全部', '计算机', '设计', '自动化', '数学', '电子', '机械'];
  const levels = ['全部', '国家级', '省级'];
  const timeRanges = ['全部', '一周内截止', '一月内截止'];

  const filteredCompetitions = useMemo(() => {
    return allCompetitions.filter(comp => {
      const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesMajor = selectedMajor === '全部' || 
                           comp.major.includes(selectedMajor) || 
                           comp.major.includes('不限');
      
      const matchesLevel = selectedLevel === '全部' || comp.level === selectedLevel;

      let matchesTime = true;
      if (selectedTimeRange !== '全部') {
        const deadline = new Date(comp.deadline);
        const now = new Date();
        const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 3600 * 24);
        if (selectedTimeRange === '一周内截止') matchesTime = diffDays <= 7 && diffDays >= 0;
        if (selectedTimeRange === '一月内截止') matchesTime = diffDays <= 30 && diffDays >= 0;
      }

      return matchesSearch && matchesMajor && matchesLevel && matchesTime;
    });
  }, [searchQuery, selectedMajor, selectedLevel, selectedTimeRange, allCompetitions]);

  // Form state for new submission
  const [newComp, setNewComp] = useState({
    name: '',
    level: '省级' as '国家级' | '省级',
    category: '',
    major: '不限',
    techStack: '',
    deadline: '',
    registrationUrl: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComp.name || !newComp.deadline) {
      toast.error('请填写必填项');
      return;
    }

    const submission: Competition = {
      id: `user-${Date.now()}`,
      name: newComp.name,
      level: newComp.level,
      category: newComp.category || '综合',
      major: [newComp.major],
      techStack: newComp.techStack.split(',').map(s => s.trim()).filter(Boolean),
      deadline: `${newComp.deadline}T23:59:59`,
      registrationUrl: newComp.registrationUrl || 'https://example.com',
      historicalAwardRatio: 0.1,
      description: newComp.description || '由用户投稿的竞赛信息。',
      targetGoal: '通用'
    };

    const updatedUserComps = [...(JSON.parse(localStorage.getItem('user_competitions') || '[]')), submission];
    localStorage.setItem('user_competitions', JSON.stringify(updatedUserComps));
    setAllCompetitions(prev => [...prev, submission]);
    
    setIsSubmitOpen(false);
    setNewComp({
      name: '',
      level: '省级',
      category: '',
      major: '不限',
      techStack: '',
      deadline: '',
      registrationUrl: '',
      description: ''
    });
    toast.success('投稿成功！', {
      description: '您的竞赛信息已保存至本地，审核通过后将同步至云端。'
    });
  };

  const recommendedCompetitions = useMemo(() => {
    return allCompetitions
      .filter(comp => {
        const goalMatch = comp.targetGoal === userGoal || comp.targetGoal === '通用';
        const majorMatch = comp.major.includes(userMajor) || comp.major.includes('不限');
        return goalMatch && majorMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.deadline).getTime();
        const dateB = new Date(b.deadline).getTime();
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [allCompetitions, userGoal, userMajor]);

  return (
    <div className="min-h-screen bg-bg-gray flex flex-col max-w-md mx-auto border-x border-border-color shadow-2xl relative h-screen overflow-hidden">
      {/* Mobile Header */}
      <header className="bg-academy-blue text-white p-6 pt-12 rounded-b-[32px] shadow-lg shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">高校竞赛中心</h1>
            <p className="text-blue-100/70 text-xs mt-1">College Competition Hub</p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200" />
          <input 
            type="text" 
            placeholder="搜索竞赛名称..." 
            className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 placeholder:text-blue-200/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden relative">
            <TabsContent value="home" className="m-0 h-full flex flex-col overflow-hidden relative">
              <div className="px-4 pt-4 flex-1 flex flex-col overflow-hidden">
                {/* Recommendation Entry */}
                <div 
                  className="mb-4 shrink-0 bg-orange-50 border border-orange-100 rounded-xl p-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all flex items-center gap-3"
                  onClick={() => setIsRecommendationOpen(true)}
                >
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-orange-200">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-text-dark">智能推荐竞赛</h2>
                      <Badge variant="outline" className="h-4 px-1 text-[8px] border-orange-200 text-orange-600 bg-white">AI</Badge>
                    </div>
                    <p className="text-text-muted text-[10px] truncate">目标：{userGoal} | 专业：{userMajor || '未设置'}</p>
                  </div>
                  <div className="text-orange-600">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>

                {/* Filter Trigger */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-academy-blue rounded-full" />
                    <h2 className="text-sm font-bold text-text-dark">热门竞赛推荐</h2>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-full border-border-color text-text-muted text-xs gap-1.5 px-3"
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    筛选分类
                    {(selectedMajor !== '全部' || selectedLevel !== '全部' || selectedTimeRange !== '全部') && (
                      <span className="w-1.5 h-1.5 bg-alert-red rounded-full" />
                    )}
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                  <div className="space-y-3">
                    {filteredCompetitions.length > 0 ? (
                      filteredCompetitions.map(comp => (
                        <CompetitionCard 
                          key={comp.id} 
                          competition={comp} 
                          onClick={setSelectedComp}
                          onFollow={toggleFollow}
                          onRegister={toggleRegister}
                          isFollowed={followedIds.includes(comp.id)}
                          isRegistered={registeredIds.includes(comp.id)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-20 text-text-muted">
                        <p className="text-sm">未找到匹配的竞赛</p>
                        <Button 
                          variant="link" 
                          className="text-academy-blue text-xs mt-2"
                          onClick={() => {
                            setSelectedMajor('全部');
                            setSelectedLevel('全部');
                            setSelectedTimeRange('全部');
                          }}
                        >
                          重置筛选条件
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Floating Action Button */}
              <button 
                className="absolute right-6 bottom-28 w-14 h-14 bg-academy-blue text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform z-40"
                onClick={() => setIsSubmitOpen(true)}
              >
                <Plus className="w-8 h-8" />
              </button>
            </TabsContent>

            <TabsContent value="hall" className="m-0 h-full flex flex-col overflow-hidden">
              <div className="px-4 pt-4 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-1 mb-4 shrink-0">
                  <h2 className="text-lg font-bold text-academy-blue">卷王榜 (Hall of Fame)</h2>
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 border-none">Top Projects</Badge>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                  <div className="space-y-3">
                    {hallOfFame.map(entry => (
                      <HallOfFameCard 
                        key={entry.id} 
                        entry={entry} 
                        onClick={setSelectedHall}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="m-0 h-full overflow-y-auto no-scrollbar">
              <div className="p-4 space-y-4 pb-24">
                <div className="bg-white rounded-2xl p-6 border border-border-color shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-academy-blue flex items-center justify-center text-white text-xl font-bold">
                        {userName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-dark">{userName}</h3>
                        <p className="text-sm text-text-muted">{userMajor || '未设置专业'} | {userGrade}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-academy-blue hover:bg-academy-blue/5 h-8 px-3 rounded-lg flex items-center gap-1"
                      onClick={() => setIsEditProfileOpen(true)}
                    >
                      <Plus className="w-3.5 h-3.5 rotate-45" />
                      编辑
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                    <div 
                      className="p-3 bg-bg-gray rounded-xl cursor-pointer active:scale-95 transition-all hover:bg-gray-200"
                      onClick={() => {
                        setListType('followed');
                        setIsListViewOpen(true);
                      }}
                    >
                      <div className="text-lg font-bold text-academy-blue">{followedIds.length}</div>
                      <div className="text-[10px] text-text-muted">已关注</div>
                    </div>
                    <div 
                      className="p-3 bg-bg-gray rounded-xl cursor-pointer active:scale-95 transition-all hover:bg-gray-200"
                      onClick={() => {
                        setListType('registered');
                        setIsListViewOpen(true);
                      }}
                    >
                      <div className="text-lg font-bold text-academy-blue">{registeredIds.length}</div>
                      <div className="text-[10px] text-text-muted">已报名</div>
                    </div>
                    <div 
                      className="p-3 bg-bg-gray rounded-xl cursor-pointer active:scale-95 transition-all hover:bg-gray-200"
                      onClick={() => {
                        setListType('certs');
                        setIsListViewOpen(true);
                      }}
                    >
                      <div className="text-lg font-bold text-academy-blue">{certificates.length}</div>
                      <div className="text-[10px] text-text-muted">获奖记录</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-bg-gray rounded-xl">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-academy-blue" />
                        <span className="text-sm font-medium">我的专业</span>
                      </div>
                      <select 
                        className="bg-transparent text-sm font-bold text-academy-blue outline-none text-right"
                        value={userMajor}
                        onChange={(e) => {
                          setUserMajor(e.target.value);
                          localStorage.setItem('user_major', e.target.value);
                        }}
                      >
                        {majors.filter(m => m !== '全部').map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-bg-gray rounded-xl">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-academy-blue" />
                        <span className="text-sm font-medium">我的奋斗目标</span>
                      </div>
                      <div className="flex bg-white p-1 rounded-lg border border-border-color">
                        <button 
                          onClick={() => {
                            setUserGoal('保研');
                            localStorage.setItem('user_goal', '保研');
                          }}
                          className={`px-3 py-1 text-xs rounded-md transition-all ${userGoal === '保研' ? 'bg-academy-blue text-white shadow-sm' : 'text-text-muted hover:bg-gray-50'}`}
                        >
                          保研
                        </button>
                        <button 
                          onClick={() => {
                            setUserGoal('就业');
                            localStorage.setItem('user_goal', '就业');
                          }}
                          className={`px-3 py-1 text-xs rounded-md transition-all ${userGoal === '就业' ? 'bg-academy-blue text-white shadow-sm' : 'text-text-muted hover:bg-gray-50'}`}
                        >
                          就业
                        </button>
                      </div>
                    </div>
                    <div 
                      className="flex items-center justify-between p-4 bg-bg-gray rounded-xl cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        setListType('followed');
                        setIsListViewOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-academy-blue" />
                        <span className="text-sm font-medium">我的订阅提醒</span>
                      </div>
                      {followedIds.length > 0 && (
                        <Badge className="bg-alert-red border-none">{followedIds.length}</Badge>
                      )}
                    </div>
                    <div 
                      className="flex items-center justify-between p-4 bg-bg-gray rounded-xl cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        setListType('certs');
                        setIsListViewOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-academy-blue" />
                        <span className="text-sm font-medium">竞赛证书管理</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-text-muted" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-border-color px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-between items-center fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-academy-blue' : 'text-text-muted'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">首页</span>
        </button>
        <button 
          onClick={() => setActiveTab('hall')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'hall' ? 'text-academy-blue' : 'text-text-muted'}`}
        >
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-medium">卷王榜</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-academy-blue' : 'text-text-muted'}`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">我的</span>
        </button>
      </nav>

      <Toaster position="top-center" richColors />

      {/* Edit Profile Dialog */}
      <Dialog.Root open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-[32px] shadow-2xl z-[101] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <Dialog.Title className="text-lg font-bold text-text-dark">编辑个人信息</Dialog.Title>
                <Dialog.Close className="text-text-muted hover:text-text-dark">
                  <X className="w-6 h-6" />
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted ml-1">姓名</label>
                  <Input 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="请输入姓名"
                    className="rounded-xl border-border-color focus:ring-academy-blue"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted ml-1">年级</label>
                  <select 
                    value={userGrade}
                    onChange={(e) => setUserGrade(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border-color bg-white text-sm focus:outline-none focus:ring-2 focus:ring-academy-blue"
                  >
                    <option value="大一">大一</option>
                    <option value="大二">大二</option>
                    <option value="大三">大三</option>
                    <option value="大四">大四</option>
                    <option value="研一">研一</option>
                    <option value="研二">研二</option>
                    <option value="研三">研三</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full bg-academy-blue hover:bg-accent-blue text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-100">
                  保存修改
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* List View Dialog (Followed/Registered/Certs) */}
      <Dialog.Root open={isListViewOpen} onOpenChange={setIsListViewOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 top-20 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-[32px] shadow-2xl z-[101] overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="p-6 border-b border-border-color shrink-0">
              <div className="flex justify-between items-center">
                <Dialog.Title className="text-lg font-bold text-text-dark">
                  {listType === 'followed' ? '我的订阅提醒' : listType === 'registered' ? '已报名竞赛' : '获奖证书记录'}
                </Dialog.Title>
                <Dialog.Close className="text-text-muted hover:text-text-dark">
                  <X className="w-6 h-6" />
                </Dialog.Close>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {listType === 'certs' ? (
                certificates.map(cert => (
                  <div key={cert.id} className="p-4 bg-bg-gray rounded-2xl border border-border-color">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-sm text-text-dark leading-snug">{cert.name}</h4>
                      <Badge className="bg-yellow-500/10 text-yellow-700 border-none text-[10px] shrink-0">{cert.level}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted">
                      <Calendar className="w-3 h-3" />
                      获奖时间：{cert.date}
                    </div>
                  </div>
                ))
              ) : (
                allCompetitions
                  .filter(comp => listType === 'followed' ? followedIds.includes(comp.id) : registeredIds.includes(comp.id))
                  .map(comp => (
                    <div key={comp.id} className="p-4 bg-white rounded-2xl border border-border-color shadow-sm flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-text-dark truncate">{comp.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-border-color text-text-muted">{comp.level}</Badge>
                          <span className="text-[10px] text-alert-red font-medium">
                            {(() => {
                              const diff = new Date(comp.deadline).getTime() - new Date().getTime();
                              if (diff <= 0) return '已截止';
                              const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                              return days === 0 ? '截止: 不足1天' : `截止: 还剩 ${days} 天`;
                            })()}
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-academy-blue h-8 px-2"
                        onClick={() => {
                          setSelectedComp(comp);
                          setIsListViewOpen(false);
                        }}
                      >
                        详情
                      </Button>
                    </div>
                  ))
              )}
              
              {((listType === 'followed' && followedIds.length === 0) || 
                (listType === 'registered' && registeredIds.length === 0) ||
                (listType === 'certs' && certificates.length === 0)) && (
                <div className="text-center py-20 text-text-muted">
                  <p className="text-sm">暂无记录</p>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Filter Dialog */}
      <Dialog.Root open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-[32px] shadow-2xl z-[101] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <Dialog.Title className="text-lg font-bold text-text-dark">筛选竞赛</Dialog.Title>
                <Dialog.Close className="text-text-muted hover:text-text-dark">
                  <X className="w-6 h-6" />
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                {/* Major Section */}
                <div>
                  <h4 className="text-sm font-bold text-text-dark mb-3">专业领域</h4>
                  <div className="flex flex-wrap gap-2">
                    {majors.map(major => (
                      <Badge 
                        key={major}
                        variant={selectedMajor === major ? 'default' : 'outline'}
                        className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all text-xs ${
                          selectedMajor === major 
                            ? 'bg-academy-blue text-white border-transparent' 
                            : 'bg-white text-text-muted border-border-color'
                        }`}
                        onClick={() => setSelectedMajor(major)}
                      >
                        {major}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Level Section */}
                <div>
                  <h4 className="text-sm font-bold text-text-dark mb-3">竞赛最高级别</h4>
                  <div className="flex flex-wrap gap-2">
                    {levels.map(level => (
                      <Badge 
                        key={level}
                        variant={selectedLevel === level ? 'default' : 'outline'}
                        className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all text-xs ${
                          selectedLevel === level 
                            ? 'bg-academy-blue text-white border-transparent' 
                            : 'bg-white text-text-muted border-border-color'
                        }`}
                        onClick={() => setSelectedLevel(level)}
                      >
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Deadline Section */}
                <div>
                  <h4 className="text-sm font-bold text-text-dark mb-3">截止时间</h4>
                  <div className="flex flex-wrap gap-2">
                    {timeRanges.map(range => (
                      <Badge 
                        key={range}
                        variant={selectedTimeRange === range ? 'default' : 'outline'}
                        className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all text-xs ${
                          selectedTimeRange === range 
                            ? 'bg-academy-blue text-white border-transparent' 
                            : 'bg-white text-text-muted border-border-color'
                        }`}
                        onClick={() => setSelectedTimeRange(range)}
                      >
                        {range}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl border-border-color text-text-muted"
                  onClick={() => {
                    setSelectedMajor('全部');
                    setSelectedLevel('全部');
                    setSelectedTimeRange('全部');
                  }}
                >
                  重置
                </Button>
                <Button 
                  className="flex-2 bg-academy-blue hover:bg-accent-blue h-12 rounded-xl text-white"
                  onClick={() => setIsFilterOpen(false)}
                >
                  查看结果 ({filteredCompetitions.length})
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Onboarding Dialog */}
      <Dialog.Root open={isFirstTime}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[32px] p-8 shadow-2xl z-[201] animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-academy-blue/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-academy-blue" />
              </div>
              <div>
                <Dialog.Title className="text-2xl font-bold text-text-dark">欢迎使用竞赛中心</Dialog.Title>
                <Dialog.Description className="text-sm text-text-muted mt-2">
                  为了给您提供精准的智能推荐，请先设置您的基本信息
                </Dialog.Description>
              </div>

              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted ml-1">您的专业领域</label>
                  <div className="grid grid-cols-2 gap-2">
                    {majors.filter(m => m !== '全部').map(m => (
                      <button 
                        key={m}
                        onClick={() => setUserMajor(m)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                          userMajor === m 
                            ? 'bg-academy-blue text-white border-transparent shadow-md' 
                            : 'bg-bg-gray text-text-dark border-transparent hover:bg-gray-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted ml-1">您的奋斗目标</label>
                  <div className="flex gap-2">
                    {['保研', '就业'].map(goal => (
                      <button 
                        key={goal}
                        onClick={() => setUserGoal(goal as any)}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${
                          userGoal === goal 
                            ? 'bg-academy-blue text-white border-transparent shadow-md' 
                            : 'bg-bg-gray text-text-dark border-transparent hover:bg-gray-200'
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-14 bg-academy-blue hover:bg-accent-blue rounded-2xl text-lg font-bold shadow-lg shadow-blue-200"
                onClick={() => {
                  if (!userMajor) {
                    toast.error('请选择您的专业');
                    return;
                  }
                  handleOnboardingComplete(userMajor, userGoal);
                }}
              >
                开启智能推荐
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Smart Recommendation Dialog */}
      <Dialog.Root open={isRecommendationOpen} onOpenChange={setIsRecommendationOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-[32px] shadow-2xl z-[101] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <Dialog.Title className="text-xl font-bold text-text-dark flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    智能推荐结果
                  </Dialog.Title>
                  <p className="text-xs text-text-muted mt-1">基于 {userMajor} 专业 & {userGoal} 导向</p>
                </div>
                <Dialog.Close className="text-text-muted hover:text-text-dark">
                  <X className="w-6 h-6" />
                </Dialog.Close>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-6">
                {recommendedCompetitions.length > 0 ? (
                  recommendedCompetitions.map((comp, idx) => (
                    <div key={`rec-list-${comp.id}`} className="relative">
                      <div className="absolute -left-2 top-4 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-10 border-4 border-white">
                        {idx + 1}
                      </div>
                      <div className="ml-2">
                        <CompetitionCard 
                          competition={comp} 
                          onClick={setSelectedComp}
                          onFollow={toggleFollow}
                          onRegister={toggleRegister}
                          isFollowed={followedIds.includes(comp.id)}
                          isRegistered={registeredIds.includes(comp.id)}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-text-muted">暂无完全匹配的竞赛，建议调整专业或目标</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border-color shrink-0">
                <p className="text-[10px] text-text-muted text-center mb-4 italic">
                  * 推荐算法综合考虑了竞赛级别、专业相关度及历史获奖率
                </p>
                <Button 
                  className="w-full h-12 rounded-xl bg-bg-gray text-text-dark hover:bg-gray-200"
                  onClick={() => setIsRecommendationOpen(false)}
                >
                  返回首页
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Competition Detail Dialog */}
      <Dialog.Root open={!!selectedComp} onOpenChange={(open) => !open && setSelectedComp(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 duration-200">
            {selectedComp && (
              <div className="flex flex-col max-h-[80vh]">
                <div className="bg-academy-blue p-6 text-white relative">
                  <Dialog.Close className="absolute right-4 top-4 text-white/60 hover:text-white">
                    <X className="w-6 h-6" />
                  </Dialog.Close>
                  <Badge className="bg-white/20 text-white border-none mb-2">{selectedComp.level}</Badge>
                  <Dialog.Title className="text-xl font-bold leading-tight">{selectedComp.name}</Dialog.Title>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-academy-blue" />
                      </div>
                      <div>
                        <div className="text-[10px] text-text-muted uppercase font-bold">截止日期</div>
                        <div className="text-sm font-bold text-text-dark">
                          {selectedComp.deadline.split('T')[0]}
                          <span className="ml-2 text-alert-red text-xs">
                            ({(() => {
                              const diff = new Date(selectedComp.deadline).getTime() - new Date().getTime();
                              if (diff <= 0) return '已截止';
                              const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                              return days === 0 ? '不足1天' : `还剩 ${days} 天`;
                            })()})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-[10px] text-text-muted uppercase font-bold">历史获奖率</div>
                        <div className="text-sm font-bold text-text-dark">{(selectedComp.historicalAwardRatio * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-text-dark mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-academy-blue" />
                      竞赛简介
                    </h4>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {selectedComp.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-text-dark mb-2">技术栈要求</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedComp.techStack.map(tech => (
                        <Badge key={tech} variant="outline" className="border-border-color text-text-muted">{tech}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button 
                      variant="outline"
                      className={`flex-1 h-12 rounded-xl border-academy-blue/20 text-xs font-bold transition-colors ${
                        followedIds.includes(selectedComp.id) ? 'bg-academy-blue/10 text-academy-blue border-academy-blue/30' : 'text-academy-blue hover:bg-academy-blue/5'
                      }`}
                      onClick={() => toggleFollow(selectedComp.id)}
                    >
                      <Bell className={`w-4 h-4 mr-2 ${followedIds.includes(selectedComp.id) ? 'fill-current' : ''}`} />
                      {followedIds.includes(selectedComp.id) ? '已关注' : '订阅提醒'}
                    </Button>
                    <Button 
                      className={`flex-1 h-12 rounded-xl text-white font-bold transition-colors ${
                        registeredIds.includes(selectedComp.id) ? 'bg-green-600 hover:bg-green-700' : 'bg-academy-blue hover:bg-accent-blue'
                      }`}
                      onClick={() => {
                        toggleRegister(selectedComp.id);
                        window.open(selectedComp.registrationUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {registeredIds.includes(selectedComp.id) ? '已报名' : '立即报名'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Submit Competition Dialog */}
      <Dialog.Root open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-[32px] shadow-2xl z-[101] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-lg font-bold text-text-dark">发布新竞赛</Dialog.Title>
                <Dialog.Close className="text-text-muted hover:text-text-dark">
                  <X className="w-6 h-6" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted ml-1">竞赛名称 *</label>
                  <Input 
                    placeholder="请输入竞赛完整名称" 
                    className="rounded-xl h-12 bg-bg-gray border-none focus-visible:ring-academy-blue"
                    value={newComp.name}
                    onChange={e => setNewComp({...newComp, name: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted ml-1">最高级别</label>
                    <select 
                      className="w-full h-12 rounded-xl bg-bg-gray border-none px-3 text-sm focus:ring-2 focus:ring-academy-blue outline-none"
                      value={newComp.level}
                      onChange={e => setNewComp({...newComp, level: e.target.value as any})}
                    >
                      <option value="国家级">国家级</option>
                      <option value="省级">省级</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted ml-1">截止日期 *</label>
                    <Input 
                      type="date"
                      className="rounded-xl h-12 bg-bg-gray border-none focus-visible:ring-academy-blue"
                      value={newComp.deadline}
                      onChange={e => setNewComp({...newComp, deadline: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted ml-1">面向专业</label>
                  <Input 
                    placeholder="如：计算机, 自动化 (不限请填不限)" 
                    className="rounded-xl h-12 bg-bg-gray border-none focus-visible:ring-academy-blue"
                    value={newComp.major}
                    onChange={e => setNewComp({...newComp, major: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted ml-1">技术栈 (逗号分隔)</label>
                  <Input 
                    placeholder="如：Python, React, 嵌入式" 
                    className="rounded-xl h-12 bg-bg-gray border-none focus-visible:ring-academy-blue"
                    value={newComp.techStack}
                    onChange={e => setNewComp({...newComp, techStack: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted ml-1">竞赛简介</label>
                  <Textarea 
                    placeholder="简单描述一下竞赛内容..." 
                    className="rounded-xl min-h-[100px] bg-bg-gray border-none focus-visible:ring-academy-blue resize-none"
                    value={newComp.description}
                    onChange={e => setNewComp({...newComp, description: e.target.value})}
                  />
                </div>

                <Button type="submit" className="w-full h-14 bg-academy-blue hover:bg-accent-blue rounded-2xl text-base font-bold shadow-lg shadow-blue-200 mt-4">
                  确认发布
                </Button>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Hall of Fame Detail Dialog */}
      <Dialog.Root open={!!selectedHall} onOpenChange={(open) => !open && setSelectedHall(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 duration-200">
            {selectedHall && (
              <div className="flex flex-col max-h-[80vh]">
                <div className="bg-[#d4a017] p-6 text-white relative">
                  <Dialog.Close className="absolute right-4 top-4 text-white/60 hover:text-white">
                    <X className="w-6 h-6" />
                  </Dialog.Close>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm font-bold">{selectedHall.awardLevel}</span>
                  </div>
                  <Dialog.Title className="text-xl font-bold leading-tight">{selectedHall.projectName}</Dialog.Title>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-white border border-border-color flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-[#d4a017]" />
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted uppercase font-bold">团队信息</div>
                      <div className="text-sm font-bold text-text-dark">{selectedHall.major} | {selectedHall.year}年度</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-text-dark mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#d4a017]" />
                      团队简介
                    </h4>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {selectedHall.teamIntro}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100">
                    <h4 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      关键秘籍 (Key to Success)
                    </h4>
                    <p className="text-sm text-yellow-700 italic leading-relaxed">
                      "{selectedHall.keyToSuccess}"
                    </p>
                  </div>

                  <Button className="w-full h-12 rounded-xl bg-academy-blue" onClick={() => setSelectedHall(null)}>
                    了解更多竞赛
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
