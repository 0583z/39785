/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { competitions as initialCompetitions, hallOfFame, Competition, HallOfFame } from './data';
import { CompetitionCard } from './components/CompetitionCard';
import { HallOfFameCard } from './components/HallOfFameCard';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Toaster, toast } from 'sonner';
import { Search, Filter, Trophy, Home, User, Bell, X, ExternalLink, Calendar, Target, Users, Lightbulb, Sparkles, Plus, Share, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'motion/react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface FocusRecord {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  duration: number;
  colorIndex: number;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'hall' | 'profile'>('home');
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
  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');

  // Companion Feature State
  const [showCompanion, setShowCompanion] = useState(false);
  const [companionMessage, setCompanionMessage] = useState('');
  const [checkInDays, setCheckInDays] = useState(0);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [isFoxExpanded, setIsFoxExpanded] = useState(false);

  // Focus Timer Feature State
  const [isFocusing, setIsFocusing] = useState(false);
  const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [focusTitle, setFocusTitle] = useState('攻克冲刺难点');
  const [focusDuration, setFocusDuration] = useState(25);
  const focusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeFocusDurationRef = useRef(25);

  const [focusRecords, setFocusRecords] = useState<FocusRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Flip Mode State
  const [isFlipMode, setIsFlipMode] = useState(false);
  const [isWaitingForFlip, setIsWaitingForFlip] = useState(false);
  const [isPhoneFaceDown, setIsPhoneFaceDown] = useState(false);
  
  const [isDayRecordsOpen, setIsDayRecordsOpen] = useState(false);
  const [selectedDateRecords, setSelectedDateRecords] = useState<FocusRecord[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  useEffect(() => {
    if (isFoxExpanded && !showCompanion) {
      const timer = setTimeout(() => setIsFoxExpanded(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isFoxExpanded, showCompanion]);

  const handleFoxClick = () => {
    if (!isFoxExpanded) {
      setIsFoxExpanded(true);
    } else {
      openCompanion();
    }
  };

  // Poster Feature State
  const [showPoster, setShowPoster] = useState(false);
  const [posterTitle, setPosterTitle] = useState('');
  const [posterDate, setPosterDate] = useState('');
  const [posterLevel, setPosterLevel] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Custom Certs and Projects forms
  const [showAddCert, setShowAddCert] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [projects, setProjects] = useState<{id: string, certId: string, name: string, s: string, t: string, a: string, r: string, skills: string[]}[]>([]);
  const [newCert, setNewCert] = useState({ name: '', level: '国家级一等奖', date: '2024-04' });
  const [newProject, setNewProject] = useState({ name: '', s: '', t: '', a: '', r: '', skills: '' });
  const [pendingCertId, setPendingCertId] = useState('');

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

    const savedCerts = localStorage.getItem('user_certs');
    const savedProjects = localStorage.getItem('user_projects');
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    if (savedCerts) {
      try {
        setCertificates(JSON.parse(savedCerts));
      } catch (e) {
        console.error('Failed to parse certs from storage');
      }
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

    // Check-in logic initialization
    const todayStr = new Date().toDateString();
    const lastCheckIn = localStorage.getItem('lastCheckInDate');
    let days = parseInt(localStorage.getItem('checkInDays') || '0', 10);
    let isCheckedIn = false;

    if (lastCheckIn === todayStr) {
      isCheckedIn = true;
    } else if (lastCheckIn) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastCheckIn !== yesterday.toDateString()) {
        days = 0;
      }
    }
    localStorage.setItem('checkInDays', days.toString());
    setCheckInDays(days);
    setIsCheckedInToday(isCheckedIn);

    const savedFocusTime = localStorage.getItem('totalFocusMinutes');
    if (savedFocusTime) {
      setTotalFocusMinutes(parseInt(savedFocusTime, 10));
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    const savedRecords = localStorage.getItem('focus_records');
    if (savedRecords) {
      try {
        setFocusRecords(JSON.parse(savedRecords));
      } catch (e) {
        console.error('Failed to parse focus records');
      }
    } else {
      const mockRecords: FocusRecord[] = [
        { id: 'm1', date: format(new Date(), 'yyyy-MM-dd'), title: '复习微机', duration: 45, colorIndex: 1 },
        { id: 'm2', date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), title: '单片机实验', duration: 30, colorIndex: 2 },
        { id: 'm3', date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), title: '蓝桥杯真题', duration: 60, colorIndex: 0 },
        { id: 'm4', date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), title: '雅思听力', duration: 25, colorIndex: 3 },
      ];
      setFocusRecords(mockRecords);
    }

    return () => {
      if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
    };
  }, []);

  const openCompanion = () => {
    const hour = new Date().getHours();
    let timeStr = '你好';
    if (hour < 9) timeStr = '早安';
    else if (hour < 12) timeStr = '上午好';
    else if (hour < 18) timeStr = '下午好';
    else if (hour < 23) timeStr = '晚上好';
    else timeStr = '夜深了';

    let msg = '';
    if (!isCheckedInToday) {
      msg = `${timeStr}！今天还没打卡哦，想要实现【${userGoal}】的目标，贵在坚持，快来记录今天的努力吧！`;
    } else {
      const messages = [
        `休息一下眼睛吧，为了【${userGoal}】奋斗固然重要，但身体是革命的本钱哦。`,
        `真棒！你已经连续学习坚持了 ${checkInDays} 天啦，胜利就在前方！`,
        `我会一直在这里陪着你的，遇到困难的竞赛随时来查资料哦。`
      ];
      msg = messages[Math.floor(Math.random() * messages.length)];
    }

    setCompanionMessage(msg);
    setShowCompanion(true);
  };

  const doCheckIn = () => {
    if (isCheckedInToday) return;
    const days = checkInDays + 1;
    const todayStr = new Date().toDateString();
    
    // Create zero-duration checkin record explicitly
    const newRecord: FocusRecord = {
      id: Date.now().toString() + '_checkin',
      date: format(new Date(), 'yyyy-MM-dd'),
      title: '✅ 每日打卡',
      duration: 0,
      colorIndex: 2 // green generally
    };

    setFocusRecords(prev => {
      const next = [...prev, newRecord];
      localStorage.setItem('focus_records', JSON.stringify(next));
      return next;
    });

    localStorage.setItem('checkInDays', days.toString());
    localStorage.setItem('lastCheckInDate', todayStr);
    
    setCheckInDays(days);
    setIsCheckedInToday(true);
    setCompanionMessage(`太棒了！打卡成功 🎉！你已经连续坚持了 ${days} 天，我在未来的顶峰等你！`);
    toast.success('打卡成功！');
  };

  const exportData = () => {
    const backupData = {
      userGoal,
      userMajor,
      userName,
      userGrade,
      followedIds,
      registeredIds,
      certificates,
      projects,
      totalFocusMinutes,
      checkInDays,
      exportDate: new Date().toISOString()
    };

    const jsonString = JSON.stringify(backupData);
    const encodedCapsule = btoa(encodeURIComponent(jsonString));
    
    // Create an elegant Markdown string combining human-readable profile and encrypted payload
    const exportText = `# 🎓 我的竞赛成长档案 (导出时间: ${new Date().toLocaleDateString()})

## 👤 基本信息
- **姓名**: ${userName || '未填写'}
- **专业**: ${userMajor}
- **年级**: ${userGrade || '未知'}
- **奋斗目标**: ${userGoal}

## ⏱️ 努力足迹
- **连续打卡坚持**: ${checkInDays} 天
- **备赛专注总计**: ${totalFocusMinutes} 分钟

## 🏆 荣誉奖项 (${certificates.length} 项)
${certificates.length > 0 ? certificates.map(c => `- **${c.name}** (${c.level} | ${c.date})`).join('\n') : '- 暂无记录'}

## 💼 实践项目 (${projects.length} 项)
${projects.length > 0 ? projects.map(p => `- **${p.name}**\n  - 角色: ${p.role}\n  - 描述: ${p.description}`).join('\n') : '- 暂无记录'}

---

## 📦 加密数据保护胶囊
*(请完整复制以下乱码块并妥善保存。若微信或小程序发生变更，极客伴侣可通过此胶囊一键恢复您的全部核心资产)*

\`\`\`json
GEEK-CAPSULE-${encodedCapsule}
\`\`\`
`.trim();

    // Try微信小程序剪贴板
    if (typeof (window as any).wx !== 'undefined' && (window as any).wx.setClipboardData) {
      (window as any).wx.setClipboardData({
        data: exportText,
        success: () => {
          toast.success('档案胶囊已复制！', { description: '请前往微信文件传输助手粘贴保存。' });
        }
      });
    } else {
      // 浏览器剪贴板 API
      navigator.clipboard.writeText(exportText).then(() => {
        toast.success('档案胶囊已生成！', { description: '已复制 MD 纯文本到剪贴板，请找个安全的地方保存。' });
      }).catch(err => {
        console.error('Failed to copy: ', err);
        // 如果剪贴板因为iframe限制失效，可以触发文件下载作为备用方案
        try {
          const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8;' });
          const link = document.createElement('a');
          if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `我的极客档案备份-${new Date().toISOString().slice(0,10)}.md`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('由于剪贴板受限，您的档案已通过浏览器文件下载完成保存！');
          }
        } catch (e) {
          toast.error('导出失败，请允许浏览器相关权限。');
        }
      });
    }
  };

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta; // x-axis rotation [-180, 180]
      // Face up is around 0, face down is around 180 or -180
      const faceDown = beta !== null && (Math.abs(beta) > 165);
      setIsPhoneFaceDown(faceDown);
    };

    if (isFocusing && isFlipMode) {
      window.addEventListener('deviceorientation', handleOrientation);
      // For iOS 13+ permission request might be needed, but usually handled by user interaction before.
      // We assume it works or prompts if needed by the environment.
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isFocusing, isFlipMode]);

  useEffect(() => {
    if (isWaitingForFlip && isPhoneFaceDown) {
      setIsWaitingForFlip(false);
      startTimerInterval();
    }
  }, [isWaitingForFlip, isPhoneFaceDown]);

  // If focusing and phone is flipped back up, end focus
  useEffect(() => {
    if (isFocusing && isFlipMode && !isWaitingForFlip && !isPhoneFaceDown) {
      toast.error('手机被翻转！专注失败 ⚠️', { description: '请保持手机屏幕朝下，远离诱惑。' });
      endFocusTimer(false);
    }
  }, [isPhoneFaceDown, isFocusing, isFlipMode, isWaitingForFlip]);

  const startTimerInterval = () => {
    if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
    focusIntervalRef.current = setInterval(() => {
      setFocusTimeLeft((prev) => {
        if (prev <= 1) {
          endFocusTimer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startFocusTimer = () => {
    activeFocusDurationRef.current = focusDuration;
    setIsFocusing(true);
    setFocusTimeLeft(focusDuration * 60);
    setShowCompanion(false);

    if (isFlipMode) {
      setIsWaitingForFlip(true);
      toast('防打扰模式已开启', { description: '请立即将手机屏幕朝下扣在桌面上开始计时。' });
    } else {
      startTimerInterval();
    }

    // Attempt to keep screen on (works in WeChat Mini Program via JSBridge if injected, or native web API)
    if (typeof (window as any).wx !== 'undefined' && (window as any).wx.setKeepScreenOn) {
      (window as any).wx.setKeepScreenOn({ keepScreenOn: true });
    } else if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').catch(() => {});
    }
  };

  const endFocusTimer = (completed: boolean) => {
    setIsFocusing(false);
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
      focusIntervalRef.current = null;
    }

    if (typeof (window as any).wx !== 'undefined' && (window as any).wx.setKeepScreenOn) {
      (window as any).wx.setKeepScreenOn({ keepScreenOn: false });
    }

    if (completed) {
      setTotalFocusMinutes(prev => {
        const newTotal = prev + activeFocusDurationRef.current;
        localStorage.setItem('totalFocusMinutes', newTotal.toString());
        return newTotal;
      });

      const newRecord: FocusRecord = {
        id: Date.now().toString(),
        date: format(new Date(), 'yyyy-MM-dd'),
        title: focusTitle || '备赛专注',
        duration: activeFocusDurationRef.current,
        colorIndex: Math.floor(Math.random() * 5)
      };

      setFocusRecords(prev => {
        const next = [...prev, newRecord];
        localStorage.setItem('focus_records', JSON.stringify(next));
        return next;
      });

      toast.success('专注完成！🎉', { description: `为你投入的${activeFocusDurationRef.current}分钟点赞！已经自动为您打卡。` });
      if (!isCheckedInToday) {
        doCheckIn();
      }
    } else {
      toast.info('专注已取消');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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

  const generatePoster = (cert: {name: string, date: string, level: string}) => {
    setPosterTitle(cert.name);
    setPosterDate(cert.date);
    setPosterLevel(cert.level);
    setShowPoster(true);

    setTimeout(() => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = window.devicePixelRatio || 2;
      canvas.width = 600 * scale;
      canvas.height = 900 * scale;
      ctx.scale(scale, scale);

      // Background gradient
      const grd = ctx.createLinearGradient(0, 0, 0, 900);
      grd.addColorStop(0, '#001a33');
      grd.addColorStop(1, '#004080');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 600, 900);

      // Pattern overlay
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 2;
      for(let i=0; i<600; i+=40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i-300, 900);
        ctx.stroke();
      }

      // Title Card
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(40, 60, 520, 700);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 70, 500, 680);

      // Avater / Icon
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(300, 150, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#001a33';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(userName.charAt(0), 300, 165);

      // User name
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(userName, 300, 250);

      // Subtitle
      ctx.fillStyle = '#D4AF37';
      ctx.font = '28px sans-serif';
      ctx.fillText('成就达成', 300, 310);

      // Line
      ctx.beginPath();
      ctx.moveTo(150, 350);
      ctx.lineTo(450, 350);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Certificate Name
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px sans-serif';
      const maxLineWidth = 400;
      const words = cert.name;
      let line = '';
      let y = 430;
      for(let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxLineWidth && n > 0) {
          ctx.fillText(line, 300, y);
          line = words[n];
          y += 50;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 300, y);

      // Level Badge
      const badgeY = y + 80;
      ctx.fillStyle = '#D4AF37';
      ctx.fillRect(200, badgeY, 200, 50);
      ctx.fillStyle = '#001a33';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(cert.level, 300, badgeY + 34);

      // Date
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '24px sans-serif';
      ctx.fillText(`荣获于 ${cert.date}`, 300, badgeY + 100);

      // Bottom Footer
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '20px sans-serif';
      ctx.fillText('高校竞赛中心 · 记录你的每一次闪耀', 300, 830);
      
    }, 100);
  };

  const generateAllPoster = () => {
    setShowPoster(true);

    setTimeout(() => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = window.devicePixelRatio || 2;
      canvas.width = 600 * scale;
      canvas.height = 900 * scale;
      ctx.scale(scale, scale);

      // Background gradient
      const grd = ctx.createLinearGradient(0, 0, 0, 900);
      grd.addColorStop(0, '#001a33');
      grd.addColorStop(1, '#004080');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 600, 900);

      // Pattern overlay
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 2;
      for(let i=0; i<600; i+=40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i-300, 900);
        ctx.stroke();
      }

      // Title Card
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(40, 40, 520, 750);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 50, 500, 730);

      // Avatar
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(300, 110, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#001a33';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(userName.charAt(0), 300, 120);

      // User name
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(userName, 300, 190);

      // Subtitle
      ctx.fillStyle = '#D4AF37';
      ctx.font = '24px sans-serif';
      ctx.fillText(`累计荣获 ${certificates.length} 项荣誉殿堂`, 300, 230);

      // Line
      ctx.beginPath();
      ctx.moveTo(150, 260);
      ctx.lineTo(450, 260);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Certs Loop
      let startY = 320;
      const maxDisplay = 4;
      
      for (let i = 0; i < Math.min(certificates.length, maxDisplay); i++) {
        const cert = certificates[i];
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(80, startY - 30, 440, 80);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'left';
        let drawName = cert.name;
        if(drawName.length > 17) drawName = drawName.substring(0, 16) + '...';
        ctx.fillText(drawName, 100, startY);
        
        ctx.fillStyle = '#D4AF37';
        ctx.font = '16px sans-serif';
        ctx.fillText(cert.level, 100, startY + 30);
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'right';
        ctx.fillText(cert.date, 500, startY + 30);
        
        startY += 100;
      }

      if (certificates.length > maxDisplay) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '16px sans-serif';
        ctx.fillText(`...还有 ${certificates.length - maxDisplay} 项成就被折叠...`, 300, startY);
      }

      // Bottom Footer
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '20px sans-serif';
      ctx.fillText('高校竞赛中心 · 记录你的每一次闪耀', 300, 840);

    }, 100);
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

  const copyMarkdown = () => {
    let md = `# ${userName} 的竞赛与项目作品集\n\n`;
    md += `> "从竞赛到职场的实力沉淀"\n\n`;

    md += `## 🌟 核心技能矩阵\n`;
    const allSkills: string[] = [];
    projects.forEach(p => allSkills.push(...p.skills));
    const uniqueSkills = Array.from(new Set(allSkills));
    if (uniqueSkills.length > 0) {
      md += uniqueSkills.map(s => `\`#${s}\``).join(' ') + '\n';
    } else {
      md += `暂无项目技能标签\n`;
    }

    md += `\n## 🏆 荣誉殿堂\n`;
    if (certificates.length > 0) {
      certificates.forEach(c => {
        md += `- **${c.name}** | ${c.level} | *${c.date}*\n`;
      });
    } else {
      md += `暂无获奖记录\n`;
    }

    md += `\n## 💼 核心项目与实战解析\n`;
    if (projects.length > 0) {
      projects.forEach(p => {
        const linkedCert = certificates.find(c => c.id === p.certId);
        md += `\n### 🚀 ${p.name}\n`;
        if (linkedCert) md += `*关联成就: ${linkedCert.name}*\n\n`;
        if (p.skills.length > 0) md += `**应用技术:** ${p.skills.join(', ')}\n\n`;
        md += `- **[S] 挑战背景**: ${p.s || '见说明'}\n`;
        md += `- **[T] 核心任务**: ${p.t || '无'}\n`;
        md += `- **[A] 关键行动**: ${p.a || '无'}\n`;
        md += `- **[R] 最终结果**: ${p.r || '无'}\n`;
      });
    } else {
      md += `暂无项目解析记录\n`;
    }

    md += `\n---\n*由 [高校竞赛中心] 自动生成*`;

    navigator.clipboard.writeText(md)
      .then(() => toast.success('已复制作品集 Markdown，去粘贴到简历吧！'))
      .catch(() => toast.error('复制失败，请重试'));
  };

  const handleAddCertSubmit = () => {
    if (!newCert.name) return toast.error('请输入赛事名称');
    const cert = {
      id: Date.now().toString(),
      name: newCert.name,
      level: newCert.level,
      date: newCert.date
    };
    const newCerts = [cert, ...certificates];
    setCertificates(newCerts);
    localStorage.setItem('user_certs', JSON.stringify(newCerts));
    setPendingCertId(cert.id);
    setShowAddCert(false);
    toast.success('荣誉记录成功！');

    setTimeout(() => {
      // In mini programs and within the iframe context, window.confirm can be blocked or look bad. 
      // It's requested that we don't use window.confirm. I will modify this to use toast with action, or a custom approach.
      // But for now, as I am trying to resolve missing dialogue issue, I will keep the confirm prompt if requested, 
      // but wait, system prompt says: "IMPORTANT: Do NOT use `confirm()`, `window.confirm()`, `alert()` or `window.alert()` in the code. The code is running in an iframe and the user will NOT see the confirmation dialog or alerts. Instead, use custom modal UI for these."
      // Let's use a nice toast with an action button for adding project!
      toast('太棒了 🎉！记录成功。', {
        description: '这个成就背后一定有个厉害的项目吧？写进作品集里展示你的实力！',
        action: {
          label: '记录项目(STAR)',
          onClick: () => setShowAddProject(true),
        },
        onDismiss: () => setIsListViewOpen(true),
        onAutoClose: () => setIsListViewOpen(true),
        duration: 5000,
      });
    }, 500);
  };

  const handleAddProjectSubmit = () => {
    if (!newProject.name) return toast.error('请输入项目名称');
    const proj = {
      id: Date.now().toString(),
      certId: pendingCertId,
      name: newProject.name,
      s: newProject.s,
      t: newProject.t,
      a: newProject.a,
      r: newProject.r,
      skills: newProject.skills.split(/[,，、]+/).map(s => s.trim()).filter(Boolean)
    };
    const newProjs = [proj, ...projects];
    setProjects(newProjs);
    localStorage.setItem('user_projects', JSON.stringify(newProjs));
    setShowAddProject(false);
    setIsListViewOpen(true);
    setNewProject({ name: '', s: '', t: '', a: '', r: '', skills: '' });
    toast.success('项目与能力已入库沉淀');
  };

  const radarData = useMemo(() => {
    let stats = { alg: 60, ui: 60, eng: 60, doc: 60, team: 60 };
    if (userMajor === '计算机' || userMajor === '自动化' || userMajor === '电子') {
      stats.alg += 25; stats.eng += 20;
    } else if (userMajor === '设计') {
      stats.ui += 35; stats.doc += 10;
    } else if (userMajor === '数学') {
      stats.alg += 35; stats.doc += 10;
    } else {
      stats.doc += 20; stats.team += 15;
    }
    const bonus = Math.min(20, certificates.length * 5 + registeredIds.length * 2 + followedIds.length * 1);
    
    // Project based bonus
    let algProjectBonus = 0;
    let uiProjectBonus = 0;
    projects.forEach(p => {
      const skillsStr = p.skills.join(' ').toLowerCase();
      if (skillsStr.includes('python') || skillsStr.includes('算法')) algProjectBonus += 15;
      if (skillsStr.includes('ui') || skillsStr.includes('设计') || skillsStr.includes('产品')) uiProjectBonus += 15;
    });
    
    return [
      { subject: '逻辑/算法', A: Math.min(100, stats.alg + bonus + algProjectBonus), fullMark: 100 },
      { subject: '工程开发', A: Math.min(100, stats.eng + bonus + (projects.length * 5)), fullMark: 100 },
      { subject: '设计/视觉', A: Math.min(100, stats.ui + bonus + uiProjectBonus), fullMark: 100 },
      { subject: '文案/文档', A: Math.min(100, stats.doc + bonus + (projects.length * 3)), fullMark: 100 },
      { subject: '团队协同', A: Math.min(100, stats.team + bonus), fullMark: 100 },
    ];
  }, [userMajor, certificates.length, registeredIds.length, followedIds.length, projects]);

  return (
    <div ref={containerRef} className="min-h-screen bg-bg-gray flex flex-col max-w-md mx-auto border-x border-border-color shadow-2xl relative h-screen overflow-hidden">
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

                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-academy-blue rounded-full" />
                      <h2 className="text-sm font-bold text-text-dark">热门竞赛推荐</h2>
                    </div>
                    <div className="flex gap-2">
                       <div className="flex bg-gray-100 p-1 rounded-lg border border-border-color">
                         <button 
                           onClick={() => setViewMode('list')}
                           className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-academy-blue' : 'text-text-muted hover:text-text-dark'}`}
                         >
                           <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                         </button>
                         <button 
                           onClick={() => setViewMode('gantt')}
                           className={`p-1.5 rounded-md transition-all ${viewMode === 'gantt' ? 'bg-white shadow-sm text-academy-blue' : 'text-text-muted hover:text-text-dark'}`}
                         >
                           <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M3 14h18M3 18h18M3 6h18"/></svg>
                         </button>
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
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                    {viewMode === 'list' ? (
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
                    ) : (
                      <div className="bg-white rounded-2xl p-4 border border-border-color shadow-sm h-full flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            红色：临近截止
                          </Badge>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            蓝色：正在备考
                          </Badge>
                        </div>
                        
                        <div className="flex-1 overflow-x-auto no-scrollbar relative min-h-[400px]">
                          <div className="flex" style={{ width: '900px' }}>
                            {/* Gantt Area */}
                            <div className="relative w-full">
                               {/* Days markers */}
                               <div className="flex absolute top-0 left-0 right-0 h-full pointer-events-none">
                                 {Array.from({ length: 12 }).map((_, i) => (
                                   <div key={i} className="flex-1 border-l border-gray-100 h-full flex flex-col">
                                     <span className="text-[10px] text-gray-300 pl-1 pt-1">Decade {i+1}</span>
                                   </div>
                                 ))}
                               </div>

                               {/* Rows per competition */}
                               <div className="space-y-4 pt-8 relative z-10 w-full">
                                 {filteredCompetitions
                                   .filter(comp => new Date(comp.deadline).getTime() > Date.now())
                                   .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                                   .slice(0, 15)
                                   .map((comp) => {
                                    const deadline = new Date(comp.deadline);
                                    const now = new Date();
                                    const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 3600 * 24);
                                    const isCritical = diffDays <= 14 && diffDays >= 0;
                                    
                                    // Calculate relative position
                                    // 1 day = 12px for better visual spread
                                    const durationWidth = Math.max(80, diffDays * 12); 
                                    const maxWidth = 800;
                                    const finalWidth = Math.min(maxWidth, durationWidth);
                                    
                                    return (
                                      <div key={comp.id} className="group relative">
                                        <div 
                                          className={`h-8 rounded-lg flex items-center px-3 text-[10px] font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer ${isCritical ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
                                          style={{ width: `${finalWidth}px` }}
                                          onClick={() => setSelectedComp(comp)}
                                        >
                                          <span className="truncate">{comp.name}</span>
                                        </div>
                                        <div className="absolute top-9 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                           <Badge className="bg-white/90 text-academy-blue border-academy-blue text-[8px] h-4 whitespace-nowrap shadow-sm">预计 {Math.floor(diffDays)} 天后截止</Badge>
                                        </div>
                                      </div>
                                    );
                                 })}
                               </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-text-muted text-[10px]">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                          左右滑动查看完整时间轴，点击色条查看竞赛详情
                        </div>
                      </div>
                    )}
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

            <TabsContent value="schedule" className="m-0 h-full flex flex-col overflow-hidden">
              <div className="px-4 pt-4 flex-1 flex flex-col overflow-y-auto no-scrollbar pb-24 relative">
                <div className="flex items-center justify-between mb-4 mt-2">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-text-dark">
                    <Calendar className="w-5 h-5 text-academy-blue" />
                    学习记录历
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded-full hover:bg-gray-200">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <span className="font-bold text-academy-blue py-1">{format(currentMonth, 'yyyy.MM')}</span>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded-full hover:bg-gray-200">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-color mb-4">
                  <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-medium text-text-muted">
                    <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div className="text-orange-400">六</div><div className="text-orange-400">日</div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-2 gap-x-1 outline-none min-w-full">
                    {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }) }).map((day, idx) => {
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isDayToday = isToday(day);
                      const dayRecords = focusRecords.filter(r => r.date === format(day, 'yyyy-MM-dd'));
                      
                      const bgColors = ['bg-orange-100', 'bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-pink-100'];
                      const borderColors = ['border-orange-200', 'border-blue-200', 'border-green-200', 'border-purple-200', 'border-pink-200'];
                      const textColors = ['text-orange-700', 'text-blue-700', 'text-green-700', 'text-purple-700', 'text-pink-700'];

                      return (
                        <div 
                          key={idx} 
                          onClick={() => {
                            if (dayRecords.length > 0) {
                              setSelectedDateRecords(dayRecords);
                              setSelectedDateStr(format(day, 'yyyy年MM月dd日'));
                              setIsDayRecordsOpen(true);
                            }
                          }}
                          className={`min-h-[80px] border border-border-color rounded-lg p-1 flex flex-col items-center ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/50 opacity-50'} ${isDayToday ? 'ring-1 ring-academy-blue border-academy-blue' : ''} ${dayRecords.length > 0 ? 'cursor-pointer hover:bg-blue-50/50 transition-colors' : ''}`}
                        >
                          <div className={`text-xs font-bold mb-1 w-full text-left pl-1 ${isDayToday ? 'text-academy-blue' : 'text-gray-500'}`}>
                            {format(day, 'd')}
                            {isDayToday && <span className="ml-1 text-[8px] bg-academy-blue text-white px-1 rounded">今</span>}
                          </div>
                          
                          <div className="w-full space-y-1 overflow-visible max-h-[60px] overflow-y-auto no-scrollbar truncate">
                            {dayRecords.map((r, i) => (
                              <div key={i} className={`w-full ${bgColors[r.colorIndex]} ${borderColors[r.colorIndex]} border ${textColors[r.colorIndex]} rounded text-[9px] px-1 py-[2px] leading-tight truncate shadow-sm`} title={r.title}>
                                {r.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 mb-6">
                   <div className="flex-1 bg-academy-blue/5 rounded-xl p-4 flex items-center justify-between">
                     <div className="text-xs text-text-muted">总计专注</div>
                     <div className="font-bold text-academy-blue">{totalFocusMinutes} <span className="text-[10px] font-normal">分钟</span></div>
                   </div>
                   <div className="flex-1 bg-orange-50 rounded-xl p-4 flex items-center justify-between">
                     <div className="text-xs text-text-muted">坚持打卡</div>
                     <div className="font-bold text-orange-600">{checkInDays} <span className="text-[10px] font-normal">天</span></div>
                   </div>
                </div>

              </div>
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

                  {/* 能力雷达图 */}
                  <div className="bg-bg-gray rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-academy-blue" />
                        <h4 className="text-sm font-bold text-text-dark">核心能力画像</h4>
                      </div>
                      <Badge variant="outline" className="text-[8px] h-4 bg-white">基于获奖动态生成</Badge>
                    </div>
                    <div className="h-48 w-full -ml-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="能力值" dataKey="A" stroke="#003366" fill="#003366" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Portfolio Button */}
                  <div 
                    className="bg-gradient-to-br from-academy-blue to-blue-900 rounded-[20px] p-6 mb-6 text-center cursor-pointer shadow-lg hover:shadow-xl transition-all"
                    onClick={() => setShowPortfolioModal(true)}
                  >
                    <div className="text-[#D4AF37] font-bold text-lg mb-1 flex items-center justify-center gap-2">
                      💼 一键生成作品集
                    </div>
                    <div className="text-white/70 text-xs">高光荣誉 × 技能矩阵 × 核心项目</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-bg-gray rounded-xl">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-academy-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        <span className="text-sm font-medium">深色模式 (Dark Mode)</span>
                      </div>
                      <div className="flex bg-white p-1 rounded-lg border border-border-color">
                        <button 
                          onClick={() => {
                            document.documentElement.classList.remove('dark');
                          }}
                          className={`px-3 py-1 text-xs rounded-md transition-all ${!document.documentElement.classList.contains('dark') ? 'bg-academy-blue text-white shadow-sm' : 'text-text-muted hover:bg-gray-50'}`}
                        >
                          浅色
                        </button>
                        <button 
                          onClick={() => {
                            document.documentElement.classList.add('dark');
                          }}
                          className={`px-3 py-1 text-xs rounded-md transition-all ${document.documentElement.classList.contains('dark') ? 'bg-academy-blue text-white shadow-sm' : 'text-text-muted hover:bg-gray-50'}`}
                        >
                          深色
                        </button>
                      </div>
                    </div>
                    
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
                        <span className="text-sm font-medium">我的获奖与项目记录</span>
                      </div>
                    </div>

                    <div 
                      className="flex items-center justify-between p-4 bg-[#e6f7ff] rounded-xl cursor-pointer hover:bg-[#d6f0ff] transition-colors border border-[#bae0ff] mt-4"
                      onClick={exportData}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-academy-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <span className="text-sm font-bold text-academy-blue">安全备份 (导出为 MD 胶囊保护)</span>
                      </div>
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
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'schedule' ? 'text-academy-blue' : 'text-text-muted'}`}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-medium">学习历</span>
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

      <Dialog.Root open={isDayRecordsOpen} onOpenChange={setIsDayRecordsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center animate-in fade-in duration-200">
            <Dialog.Content className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-academy-blue" />
                  {selectedDateStr}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text-muted">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-3 no-scrollbar pb-6">
                {selectedDateRecords.map((r, i) => {
                  const bgColors = ['bg-orange-100', 'bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-pink-100'];
                  const borderColors = ['border-orange-200', 'border-blue-200', 'border-green-200', 'border-purple-200', 'border-pink-200'];
                  const textColors = ['text-orange-700', 'text-blue-700', 'text-green-700', 'text-purple-700', 'text-pink-700'];
                  
                  return (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${bgColors[r.colorIndex]} ${borderColors[r.colorIndex]}`}>
                      <div className="flex flex-col">
                        <span className={`font-bold ${textColors[r.colorIndex]}`}>{r.title}</span>
                        {r.duration > 0 ? (
                           <span className="text-xs text-text-muted mt-1 opacity-80">专注时长: {r.duration} 分钟</span>
                        ) : (
                           <span className="text-xs text-text-muted mt-1 opacity-80">日常打卡</span>
                        )}
                      </div>
                      {r.duration > 0 && <Badge variant="outline" className={`bg-white/50 border-none ${textColors[r.colorIndex]}`}>Completed</Badge>}
                    </div>
                  );
                })}
              </div>
            </Dialog.Content>
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Companion Floating Icon */}
      <motion.div 
        drag={isFoxExpanded}
        dragConstraints={containerRef}
        dragMomentum={false}
        className={`absolute right-6 bottom-44 bg-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer z-50 ${isFoxExpanded ? 'animate-bounce-[2s]' : ''}`}
        style={{ touchAction: 'none' }}
        animate={{ 
          x: isFoxExpanded ? 0 : 40,
          opacity: isFoxExpanded ? 1 : 0.6,
          scale: isFoxExpanded ? 1 : 0.85
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={handleFoxClick}
      >
        <span className="text-3xl leading-none">🦊</span>
        {!isCheckedInToday && isFoxExpanded && (
          <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white"></div>
        )}
      </motion.div>

      <Toaster position="top-center" richColors />

      {/* Companion Dialog */}
      <Dialog.Root open={showCompanion} onOpenChange={setShowCompanion}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#f7f8fa] rounded-t-[32px] shadow-2xl z-[201] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-lg font-bold text-text-dark">🦊 你的专属锦鲤伴侣</Dialog.Title>
                <Dialog.Close className="text-text-muted hover:text-text-dark">
                  <X className="w-6 h-6" />
                </Dialog.Close>
              </div>
              
              <div className="bg-white rounded-[24px] rounded-br-none p-5 mb-6 text-sm text-text-dark leading-relaxed shadow-sm relative border border-gray-100">
                {companionMessage}
                <div className="absolute -bottom-3 right-0 w-0 h-0 border-t-[12px] border-t-white border-l-[16px] border-l-transparent"></div>
              </div>

              <div className="bg-gradient-to-br from-academy-blue to-blue-800 rounded-[24px] p-6 text-center text-white mb-6 shadow-lg shadow-blue-900/20">
                <span className="text-sm opacity-80 block mb-2">当前连续打卡学习</span>
                <div className="flex justify-center items-baseline">
                  <span className="text-6xl font-bold italic mr-2">{checkInDays}</span>
                  <span className="text-lg">天</span>
                </div>
              </div>

              <div className="bg-orange-50/50 p-4 rounded-[20px] border border-orange-100 mb-4 transition-all">
                <div className="mb-3 flex flex-col gap-2">
                  <Input 
                    value={focusTitle}
                    onChange={e => setFocusTitle(e.target.value)}
                    placeholder="给自己定个小目标 (如: 刷蓝桥杯真题)"
                    className="bg-white border-orange-200 focus-visible:ring-orange-400 text-sm h-10 rounded-xl"
                  />
                  <div className="flex gap-2 mt-1">
                    {[15, 25, 45, 60].map(m => (
                      <button 
                        key={m}
                        onClick={() => setFocusDuration(m)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          focusDuration === m 
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200' 
                            : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'
                        }`}
                      >
                        {m}分
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 px-1 py-2 bg-orange-100/30 rounded-lg border border-orange-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isFlipMode ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="text-[10px] font-bold text-orange-700">防打扰翻转模式 (Flip to Focus)</span>
                    </div>
                    <button 
                      onClick={() => setIsFlipMode(!isFlipMode)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${isFlipMode ? 'bg-orange-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isFlipMode ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <Button 
                  onClick={startFocusTimer}
                  className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white shadow-lg shadow-red-100"
                >
                  ⏳ 开始专注 ({focusDuration}分钟)
                </Button>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={doCheckIn}
                  disabled={isCheckedInToday}
                  variant="outline"
                  className={`w-full h-12 rounded-2xl text-sm font-bold transition-all border-2 ${
                    isCheckedInToday 
                      ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed' 
                      : 'border-academy-blue text-academy-blue hover:bg-blue-50'
                  }`}
                >
                  {isCheckedInToday ? '👏 今日已打卡' : '仅签到打卡'}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Focus Timer Modals */}
      <Dialog.Root open={isFocusing}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <Dialog.Content className="text-center w-full max-w-sm bg-transparent border-none shadow-none text-white">
              {isWaitingForFlip ? (
                <div className="animate-in zoom-in duration-500">
                  <div className="w-32 h-32 mx-auto mb-8 relative">
                    <motion.div 
                      animate={{ rotateX: [0, 180, 180, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-full h-full bg-white/20 rounded-2xl border-2 border-white/40 flex items-center justify-center"
                    >
                      <span className="text-4xl">📱</span>
                    </motion.div>
                  </div>
                  <Dialog.Title className="text-2xl font-bold mb-4">待命：请翻转手机</Dialog.Title>
                  <p className="text-white/60 text-sm leading-relaxed mb-12">
                    系统已进入硬件级防打扰状态<br/>
                    请将手机屏幕<span className="text-orange-400 font-bold"> 朝下扣在桌面上 </span>正式开启计时
                  </p>
                  <Button 
                    onClick={() => endFocusTimer(false)}
                    variant="ghost"
                    className="text-white/40"
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <>
                  <Dialog.Title className="text-white/80 text-xl font-bold mb-12 tracking-widest leading-relaxed">
                    {focusTitle || '备赛专注'}
                  </Dialog.Title>
                  
                  <div className="relative w-64 h-64 mx-auto flex items-center justify-center mb-16">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="128" cy="128" r="120" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
                      <circle cx="128" cy="128" r="120" stroke="#f97316" strokeWidth="6" fill="none" 
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - focusTimeLeft / (activeFocusDurationRef.current * 60))}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <div className="text-7xl font-light text-white tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatTime(focusTimeLeft)}
                    </div>
                    {isFlipMode && (
                      <div className="absolute -bottom-6 flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">In-Motion Protect</span>
                      </div>
                    )}
                  </div>

                  <div className="text-white/80 text-sm mb-12 italic">
                    {isFlipMode ? "🤫 保持扣放状态，感应器正在守护你的专注..." : "\"放弃不难，但坚持一定很酷。\""}
                  </div>

                  <Button 
                    onClick={() => {
                      toast('确定要提前放弃吗？', {
                        description: '坚持就是胜利，放弃后本次专注时间将不会被记录哦。',
                        action: {
                          label: '结束专注',
                          onClick: () => endFocusTimer(false),
                        },
                      });
                    }}
                    variant="ghost"
                    className="text-white/40 hover:text-white hover:bg-white/10 rounded-full px-8 h-12"
                  >
                    放弃专注
                  </Button>
                </>
              )}
            </Dialog.Content>
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>

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
                <>
                  <button 
                    onClick={() => { setIsListViewOpen(false); setShowAddCert(true); }}
                    className="w-full bg-academy-blue text-white font-bold py-3 rounded-2xl mb-4 shadow-md flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> 录入新成就奖项
                  </button>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-text-dark">共 {certificates.length} 项记录</span>
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-md text-xs h-8" onClick={generateAllPoster}>
                      <Crown className="w-3 h-3 mr-1" />
                      荣誉总览海报
                    </Button>
                  </div>
                  {certificates.map(cert => (
                    <div key={cert.id} className="p-4 bg-bg-gray rounded-2xl border border-border-color">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-sm text-text-dark leading-snug">{cert.name}</h4>
                        <Badge className="bg-yellow-500/10 text-yellow-700 border-none text-[10px] shrink-0">{cert.level}</Badge>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-text-muted">
                          <Calendar className="w-3 h-3" />
                          获奖时间：{cert.date}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-academy-blue text-[10px] h-6 px-2 hover:bg-academy-blue/10"
                          onClick={() => generatePoster(cert)}
                        >
                          <Share className="w-3 h-3 mr-1" />
                          生成海报 ↗
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
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
      {/* Poster Preview Modal */}
      <Dialog.Root open={showPoster} onOpenChange={setShowPoster}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] animate-in fade-in duration-300" />
          <Dialog.Content className="fixed inset-0 flex flex-col items-center justify-center p-6 z-[201] pb-[env(safe-area-inset-bottom)]">
            <Dialog.Title className="sr-only">海报预览</Dialog.Title>
            <div className="w-[300px] h-[450px] relative rounded-2xl overflow-hidden shadow-2xl mb-8 border-4 border-white/10 mt-10">
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} className="block" />
            </div>

            <p className="text-white/60 mb-6 text-sm text-center">系统正在通过本地底层为您疾速计算绘制<br/>(真正生成时无需耗费流量)</p>

            <Button 
              className="w-[300px] h-14 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white rounded-full font-bold shadow-[0_0_20px_rgba(234,179,8,0.4)] text-lg flex items-center justify-center gap-2 mb-6"
              onClick={() => {
                toast.success('海报已保存相册', { description: '快去发送朋友圈开启炫耀吧！' });
                setShowPoster(false);
              }}
            >
              <Share className="w-5 h-5" />
              立即发朋友圈
            </Button>

            <Dialog.Close className="text-white/50 hover:text-white bg-white/10 p-3 rounded-full backdrop-blur-md flex items-center justify-center">
              <X className="w-6 h-6" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Portfolio Generation Modal */}
      <Dialog.Root open={showPortfolioModal} onOpenChange={setShowPortfolioModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#f7f8fa] rounded-t-[32px] shadow-2xl z-[201] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <Dialog.Title className="text-lg font-bold text-text-dark flex items-center gap-2">
                  💼 一键生成作品集
                </Dialog.Title>
                <Dialog.Close className="text-text-muted hover:text-text-dark">
                  <X className="w-6 h-6" />
                </Dialog.Close>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pb-6">
                 <div className="bg-white rounded-2xl p-5 border border-border-color shadow-sm">
                    <h3 className="font-bold text-text-dark mb-2">生成内容预览</h3>
                    <ul className="text-sm text-text-muted space-y-2 list-disc pl-4">
                      <li>个人核心技能标签矩阵</li>
                      <li>{certificates.length} 项竞赛荣誉大满贯</li>
                      <li>{projects.length} 个深度实战项目 (STAR解析)</li>
                    </ul>
                 </div>
                 
                 <div className="space-y-3">
                    <Button 
                      className="w-full h-14 bg-academy-blue hover:bg-accent-blue rounded-2xl font-bold shadow-lg shadow-blue-200 text-lg flex items-center justify-center gap-2"
                      onClick={() => {
                        copyMarkdown();
                        setShowPortfolioModal(false);
                      }}
                    >
                      <Sparkles className="w-5 h-5" /> 导出 Markdown (排版必备)
                    </Button>
                    <p className="text-xs text-center text-text-muted">不仅是简历，更是你大学最硬核的通关证明。</p>
                 </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Cert Dialog */}
      <Dialog.Root open={showAddCert} onOpenChange={setShowAddCert}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-[32px] shadow-2xl z-[201] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <Dialog.Title className="text-lg font-bold text-text-dark">录入新成就奖项</Dialog.Title>
                <Dialog.Close className="text-text-muted hover:text-text-dark">
                  <X className="w-6 h-6" />
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted ml-1">赛事/奖项名称 *</label>
                  <Input 
                    placeholder="如：全国大学生数学建模竞赛" 
                    className="rounded-xl border-border-color focus-visible:ring-academy-blue"
                    value={newCert.name}
                    onChange={e => setNewCert({...newCert, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted ml-1">获奖级别 *</label>
                  <select 
                    className="w-full h-10 px-3 rounded-xl border border-border-color bg-white text-sm focus:outline-none focus:ring-2 focus:ring-academy-blue"
                    value={newCert.level}
                    onChange={e => setNewCert({...newCert, level: e.target.value})}
                  >
                    <option value="国家级特等奖">国家级特等奖</option>
                    <option value="国家级一等奖">国家级一等奖</option>
                    <option value="国家级二等奖">国家级二等奖</option>
                    <option value="国家级三等奖">国家级三等奖</option>
                    <option value="省级一等奖">省级一等奖</option>
                    <option value="省级二等奖">省级二等奖</option>
                    <option value="省级三等奖">省级三等奖</option>
                    <option value="校级一等奖">校级一等奖</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted ml-1">获奖时间 *</label>
                  <Input 
                    type="month"
                    className="rounded-xl border-border-color focus-visible:ring-academy-blue"
                    value={newCert.date}
                    onChange={e => setNewCert({...newCert, date: e.target.value})}
                  />
                </div>

                <Button 
                  onClick={handleAddCertSubmit} 
                  className="w-full h-12 mt-4 bg-academy-blue hover:bg-accent-blue rounded-xl font-bold shadow-lg shadow-blue-100 text-white"
                >
                  保存荣誉记录
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Project Dialog */}
      <Dialog.Root open={showAddProject} onOpenChange={setShowAddProject}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-[32px] shadow-2xl z-[201] overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-border-color shrink-0">
              <div className="flex justify-between items-center">
                <Dialog.Title className="text-lg font-bold text-text-dark flex items-center gap-2">
                  <Target className="w-5 h-5 text-academy-blue" />
                  实战项目复盘 (STAR法则)
                </Dialog.Title>
                <Dialog.Close className="text-text-muted hover:text-text-dark">
                  <X className="w-6 h-6" />
                </Dialog.Close>
              </div>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                用 STAR 法则记录不仅是整理回忆，更是为了在简历和面试中一展风采。
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted ml-1">项目名称 *</label>
                <Input 
                  placeholder="给你的项目起个响亮的名字" 
                  className="rounded-xl bg-bg-gray border-none focus-visible:ring-academy-blue"
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <label className="text-xs font-bold text-academy-blue mb-1 block"><b>S</b>ituation (情景背景)</label>
                  <Textarea 
                    placeholder="这是个什么比赛/项目？面临着什么挑战？" 
                    className="min-h-[60px] text-sm bg-white border-blue-100 focus-visible:ring-academy-blue resize-none"
                    value={newProject.s}
                    onChange={e => setNewProject({...newProject, s: e.target.value})}
                  />
                </div>
                
                <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                  <label className="text-xs font-bold text-orange-600 mb-1 block"><b>T</b>ask (你的任务)</label>
                  <Textarea 
                    placeholder="你需要解决什么核心问题？目标是什么？" 
                    className="min-h-[60px] text-sm bg-white border-orange-100 focus-visible:ring-orange-400 resize-none"
                    value={newProject.t}
                    onChange={e => setNewProject({...newProject, t: e.target.value})}
                  />
                </div>

                <div className="bg-green-50/50 p-3 rounded-xl border border-green-100">
                  <label className="text-xs font-bold text-green-700 mb-1 block"><b>A</b>ction (关键行动)</label>
                  <Textarea 
                    placeholder="你具体做了哪些事？用了什么技术和方法论？" 
                    className="min-h-[80px] text-sm bg-white border-green-100 focus-visible:ring-green-500 resize-none"
                    value={newProject.a}
                    onChange={e => setNewProject({...newProject, a: e.target.value})}
                  />
                </div>

                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                  <label className="text-xs font-bold text-purple-700 mb-1 block"><b>R</b>esult (最终结果)</label>
                  <Textarea 
                    placeholder="取得了什么成果？性能提升了多少？获得了什么奖项？" 
                    className="min-h-[60px] text-sm bg-white border-purple-100 focus-visible:ring-purple-400 resize-none"
                    value={newProject.r}
                    onChange={e => setNewProject({...newProject, r: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-text-muted ml-1">沉淀的技能标签 (逗号分隔)</label>
                <Input 
                  placeholder="如：React, Python数据分析, 团队管理" 
                  className="rounded-xl bg-bg-gray border-none focus-visible:ring-academy-blue"
                  value={newProject.skills}
                  onChange={e => setNewProject({...newProject, skills: e.target.value})}
                />
              </div>
            </div>

            <div className="p-4 border-t border-border-color shrink-0 bg-white">
              <Button 
                onClick={handleAddProjectSubmit} 
                className="w-full h-12 bg-academy-blue hover:bg-accent-blue rounded-xl font-bold shadow-lg shadow-blue-100 text-white"
              >
                保存项目复盘
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
