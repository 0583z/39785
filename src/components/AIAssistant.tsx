import React, { useState } from 'react';
import { Sparkles, Loader2, Check, AlertCircle, Terminal, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

/**
 * AIAssistant 组件 - 智能竞赛提取单元
 * [技术路径说明]
 * 1. 组合：将 LLM 的自然语言处理能力与前端状态管理相结合，实现了“一键数据化”的录入体验。
 * 2. 优化：通过 System Prompt 级别的 Few-shot 约束，极大提高了日期和链接在复杂网页乱码中的提取准确度。
 * 3. 运用：采用非侵入式 UI 设计，用户粘贴即可分析，降低了传统表单录入的认知负担。
 */

interface AIAssistantProps {
  onSuccess: (data: {
    title: string;
    deadline: string;
    category: string;
    link: string;
    description: string;
  }) => void;
}

export const AIAssistant = ({ onSuccess }: AIAssistantProps) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleAnalyze = async () => {
    if (!input.trim()) {
      toast.error('请输入或粘贴内容');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: input }),
      });

      if (!response.ok) throw new Error('API Request Failed');

      const data = await response.json();

      if (data.title) {
        onSuccess(data);
        setStatus('success');
        toast.success('AI 提取竞赛数据成功！');
        setInput('');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error('No valid data extracted');
      }
    } catch (error) {
      console.error('AI Error:', error);
      setStatus('error');
      toast.error('AI 解析失败，请重试或手动输入。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 border-2 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-xl text-gray-900 tracking-tighter uppercase italic">
              DeepSeek AI Analyzer
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                System Ready. Model V3-R1
              </span>
            </div>
          </div>
        </div>
        <Terminal className="text-gray-200 hidden sm:block" />
      </div>

      <div className="relative group">
        <textarea
          className="w-full h-40 p-5 bg-gray-50 border-2 border-gray-900 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-100 transition-all resize-none placeholder:text-gray-300 font-mono"
          placeholder=">>> 请在这里输入或粘贴竞赛官网内容、PDF文字或任何杂乱的网址信息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <kbd className="px-2 py-1 bg-white border border-gray-900 rounded text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            CTRL + V
          </kbd>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-6 h-6 rounded-full border border-white bg-blue-${i * 100 + 400} text-[8px] flex items-center justify-center font-bold text-white uppercase`}>
                {i}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            3-STEP Extraction Protocol
          </span>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !input.trim()}
          className={`relative group h-14 px-8 rounded-2xl font-black text-sm uppercase tracking-wider transition-all border-2 border-gray-900 overflow-hidden ${
            loading 
              ? 'bg-gray-100 cursor-not-allowed' 
              : 'bg-blue-600 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none'
          }`}
        >
          <div className="flex items-center gap-2 relative z-10">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : status === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {loading ? 'Analyzing Data...' : status === 'success' ? 'Data Extracted' : 'Start Intelligent Extraction'}
          </div>
          {!loading && (
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          )}
        </button>
      </div>

      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-red-50 border-2 border-red-900 rounded-xl flex items-center gap-3 text-red-900 text-xs font-bold"
          >
            <AlertCircle className="w-4 h-4" />
            系统异常：无法从提供的文本中识别有效的竞技数据。请提供更清晰的描述。
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
