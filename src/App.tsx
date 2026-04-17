import React from 'react';
import { FolderTree, ShieldCheck, Terminal, Smartphone } from 'lucide-react';

const App = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-2xl w-full bg-slate-800 rounded-3xl p-8 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-500 p-3 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold italic">高校竞赛中心 - 架构看板</h1>
            <p className="text-slate-400 text-sm">Native Mini-Program Mode Active</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-4 text-blue-400">
              <FolderTree className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wider">代码根目录隔离成功</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              当前项目已按照架构师指令完成**毁灭式重构**。所有原生小程序代码（WXML/WXSS/JS）已完全迁移至 <code className="bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">/miniprogram</code> 目录下的私有空间。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <Terminal className="w-4 h-4 text-green-400 mb-2" />
              <div className="text-xs font-bold mb-1">ENV: AI Studio</div>
              <div className="text-[10px] text-slate-500 italic">Bootstrapped for Preview</div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <Smartphone className="w-4 h-4 text-orange-400 mb-2" />
              <div className="text-xs font-bold mb-1">Target: Wechat</div>
              <div className="text-[10px] text-slate-500 italic">Universal Framework</div>
            </div>
          </div>

          <div className="pt-4 text-center">
            <p className="text-[10px] text-slate-500">
              提示：当前的 Web 界面仅作为“预览底座”展示架构状态，您的核心逻辑请查看文件树中的 <span className="text-blue-400">miniprogram/</span> 文件夹。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
