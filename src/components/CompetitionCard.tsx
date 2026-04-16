import React, { useState, useEffect } from 'react';
import { Competition } from '../data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Bell, ExternalLink, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

interface CompetitionCardProps {
  competition: Competition;
  onClick?: (comp: Competition) => void;
  onFollow?: (id: number) => void;
  onRegister?: (id: number) => void;
  isFollowed?: boolean;
  isRegistered?: boolean;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({ 
  competition, 
  onClick, 
  onFollow, 
  onRegister,
  isFollowed,
  isRegistered
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const deadline = new Date(competition.deadline);
      const now = new Date();
      const diffTime = deadline.getTime() - now.getTime();
      
      if (diffTime <= 0) {
        setTimeLeft('已截止');
      } else {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          setTimeLeft('不足1天');
        } else {
          setTimeLeft(`还剩 ${diffDays} 天`);
        }
      }
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 60000);
    return () => clearInterval(timer);
  }, [competition.deadline]);

  const handleSubscribe = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollow?.(competition.id);
  };

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRegister?.(competition.id);
    window.open(competition.registrationUrl, '_blank');
  };

  const winningProb = (competition.historicalAwardRatio * 100).toFixed(1);

  return (
    <Card 
      className="border border-border-color rounded-xl p-4 flex flex-col gap-2 bg-white shadow-sm hover:border-academy-blue/30 transition-all active:scale-[0.98] cursor-pointer"
      onClick={() => onClick?.(competition)}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="font-bold text-[15px] text-text-dark leading-snug flex-1">
          {competition.name}
        </div>
        <Badge variant="secondary" className="bg-academy-blue/10 text-academy-blue text-[10px] px-2 py-0 border-none shrink-0">
          {competition.level}
        </Badge>
      </div>
      
      <div className="flex items-center gap-1.5 text-alert-red font-bold text-xs">
        <Clock className="w-3.5 h-3.5" />
        报名截止: {timeLeft}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-1">
        {competition.targetGoal && (
          <Badge className={`text-[10px] py-0 px-2 h-5 border-none ${
            competition.targetGoal === '保研' ? 'bg-purple-100 text-purple-700' : 
            competition.targetGoal === '就业' ? 'bg-green-100 text-green-700' : 
            'bg-blue-100 text-blue-700'
          }`}>
            {competition.targetGoal === '保研' ? '保研神赛' : competition.targetGoal === '就业' ? '就业加分' : '全能推荐'}
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 border-border-color text-text-muted bg-bg-gray/50">
          {competition.category}
        </Badge>
        {competition.techStack.slice(0, 2).map((tech) => (
          <Badge key={tech} variant="outline" className="text-[10px] py-0 px-2 h-5 border-border-color text-text-muted">
            {tech}
          </Badge>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <Button 
          size="sm" 
          variant="outline"
          className={`flex-1 h-8 border-academy-blue/20 text-xs rounded-lg transition-colors ${
            isFollowed ? 'bg-academy-blue/10 text-academy-blue border-academy-blue/30' : 'text-academy-blue hover:bg-academy-blue/5'
          }`}
          onClick={handleSubscribe}
        >
          <Bell className={`w-3.5 h-3.5 mr-1.5 ${isFollowed ? 'fill-current' : ''}`} />
          {isFollowed ? '已关注' : '订阅提醒'}
        </Button>
        <Button 
          size="sm" 
          className={`flex-1 h-8 text-xs rounded-lg shadow-sm transition-colors ${
            isRegistered ? 'bg-green-600 hover:bg-green-700' : 'bg-academy-blue hover:bg-accent-blue'
          } text-white`}
          onClick={handleRegister}
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          {isRegistered ? '已报名' : '立即报名'}
        </Button>
      </div>
    </Card>
  );
};
