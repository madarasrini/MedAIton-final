import { RiskHistoryPoint } from '../types.ts';

/**
 * Generates a realistic 24-hour historical trend trajectory ending at the current risk score
 */
export function generate24HourRiskHistory(currentScore: number = 50): RiskHistoryPoint[] {
  const points: RiskHistoryPoint[] = [];
  const hours = [24, 20, 16, 12, 8, 4, 2, 0];
  const now = Date.now();

  let prevScore = Math.max(10, Math.min(95, currentScore + (Math.floor(Math.random() * 30) - 15)));

  hours.forEach((h, index) => {
    const time = new Date(now - h * 60 * 60 * 1000);
    const timeLabel = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let score: number;
    if (h === 0) {
      score = currentScore;
    } else {
      // Progressively interpolate towards the current score
      const weight = (hours.length - 1 - index) / (hours.length - 1);
      const randomNoise = (Math.random() - 0.5) * 8;
      score = Math.round(Math.max(5, Math.min(98, currentScore * (1 - weight) + prevScore * weight + randomNoise)));
      prevScore = score;
    }

    points.push({
      timestamp: timeLabel,
      hoursAgo: h,
      score,
    });
  });

  // Sort ascending by hours ago (24h ago first -> 0h current last)
  return points.sort((a, b) => b.hoursAgo - a.hoursAgo);
}

/**
 * Updates a bed's risk history with a new live point
 */
export function appendLiveRiskPoint(existingHistory: RiskHistoryPoint[] = [], newScore: number): RiskHistoryPoint[] {
  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const updated = [...existingHistory];
  // If the last point was very recent, update it; otherwise append and keep up to 10 points
  if (updated.length > 0 && updated[updated.length - 1].hoursAgo === 0) {
    updated[updated.length - 1] = {
      timestamp: timeLabel,
      hoursAgo: 0,
      score: newScore,
    };
  } else {
    updated.push({
      timestamp: timeLabel,
      hoursAgo: 0,
      score: newScore,
    });
  }

  // Keep last 10 points max
  return updated.slice(-10);
}
