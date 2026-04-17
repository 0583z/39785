import React from 'react';
import { HallOfFame } from '../data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Lightbulb, Users } from 'lucide-react';

interface HallOfFameCardProps {
  entry: HallOfFame;
  onClick?: (entry: HallOfFame) => void;
}

export const HallOfFameCard: React.FC<HallOfFameCardProps> = ({ entry, onClick }) => {
  return (
    <div 
      className="p-4 border-b border-border-color last:border-b-0 bg-white active:bg-gray-50 cursor-pointer"
      onClick={() => onClick?.(entry)}
    >
      <span className="text-[#d4a017] font-bold text-[12px] mb-1 block">
        🏆 {entry.awardLevel} ({entry.year})
      </span>
      <div className="text-sm font-bold text-text-dark leading-tight">
        {entry.projectName}
      </div>
      <div className="text-[11px] text-text-muted mt-1">
        {entry.major} • {entry.year}年度
      </div>
      <div className="text-[12px] bg-[#f9f9f9] p-2 mt-2 border-l-3 border-academy-blue text-text-muted italic leading-relaxed">
        关键秘籍: {entry.keyToSuccess}
      </div>
    </div>
  );
};
