import { useState, useEffect } from "react";
import { Trophy, Medal, Award, User } from "lucide-react";
import * as api from "../../utils/api";

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar_url?: string;
  materials: number;
  articles: number;
  guides?: number;
  mius: number;
  total: number;
}

interface LeaderboardProps {
  onUserClick?: (userId: string) => void;
}

export function Leaderboard({ onUserClick }: LeaderboardProps) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await api.getLeaderboard();
      setLeaders(data);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={16} className="text-yellow-500" />;
      case 2:
        return <Medal size={16} className="text-gray-400" />;
      case 3:
        return <Award size={16} className="text-amber-600" />;
      default:
        return (
          <span className="text-[11px] text-black/40 dark:text-white/40 w-4 text-center">
            {rank}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <h3 className="text-[13px] font-display mb-3 flex items-center gap-2">
          <Trophy size={14} className="text-yellow-500" />
          Top Contributors
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 bg-black/5 dark:bg-white/5 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-[13px] font-display mb-3 flex items-center gap-2">
          <Trophy size={14} className="text-yellow-500" />
          Top Contributors
        </h3>
        <p className="text-[11px] text-black/60 dark:text-white/60 italic">
          No contributors yet
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-[13px] font-display mb-3 flex items-center gap-2">
        <Trophy size={14} className="text-yellow-500" />
        Top Contributors
      </h3>
      <div className="space-y-1">
        {leaders.slice(0, 10).map((entry, index) => (
          <button
            key={entry.userId}
            onClick={() => onUserClick?.(entry.userId)}
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-5 flex justify-center">
              {getRankIcon(index + 1)}
            </div>
            <div className="w-6 h-6 rounded-full border border-[#211f1c]/20 dark:border-white/20 overflow-hidden bg-[#e5e4dc] dark:bg-[#3a3835] flex items-center justify-center shrink-0">
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt={entry.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <User size={12} className="text-black/40 dark:text-white/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium truncate">{entry.name}</p>
            </div>
            <div className="text-[11px] text-black/60 dark:text-white/60 tabular-nums">
              {entry.total}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
