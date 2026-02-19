import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

/**
 * Determines if a specific date is a "Rest Day" based on the habit's schedule.
 * Schedule format: "schedule:WorkDays:RestDays" (e.g., "schedule:2:2")
 * Uses habit.createdAt as the anchor point.
 */
export const isHabitRestDay = (habit: any, date: dayjs.Dayjs): boolean => {
  if (!habit || !habit.frequency || !habit.frequency.startsWith('schedule:')) {
    return false; // Default to daily (no rest days enforced)
  }

  try {
    const parts = habit.frequency.split(':');
    const workDays = parseInt(parts[1]);
    const restDays = parseInt(parts[2]);

    if (!workDays || !restDays) return false;

    const cycleLength = workDays + restDays;
    const anchor = dayjs(habit.createdAt); // Start date of the habit
    
    // Calculate difference in days
    const diff = date.diff(anchor, 'day');
    
    // Normalize negative diffs (if viewing days before creation, though unlikely to matter visually)
    const normalizedDiff = diff >= 0 ? diff : (diff % cycleLength + cycleLength);
    
    const dayInCycle = normalizedDiff % cycleLength;

    // Cycle structure: [0...Work-1] [Work...Cycle-1]
    // If dayInCycle is >= workDays, it is a Rest Day.
    return dayInCycle >= workDays;

  } catch (e) {
    console.error("Error calculating rest day", e);
    return false;
  }
};

/**
 * Calculates habit statistics: Current Streak, Best Streak, Completion %
 * Accounts for Rest Days (Freeze Logic).
 */
export const calculateHabitStats = (habit: any) => {
  if (!habit) return { currentStreak: 0, bestStreak: 0, percentage: 0 };

  let dates: string[] = [];
  try {
    dates = JSON.parse(habit.completedDates || '[]');
  } catch { dates = []; }
  
  // Sort dates ascending
  dates.sort();

  // 1. Current Streak
  let currentStreak = 0;
  // Start checking from Today. If not done today, check Yesterday.
  // If neither done, streak is 0 (unless today/yesterday are rest days?)
  // Logic: Allow "today" to be incomplete without breaking streak if "yesterday" was maintained.
  
  // If today is NOT completed, we tentatively look at yesterday to continue the streak.
  // BUT if today is a REST day, we just skip it.
  // If today is NOT a rest day and NOT completed -> Streak might be broken unless we allow "not done yet today".
  // Standard logic: Streak includes today if done. If not done, it is the streak ending yesterday.
  
  // Let's iterate backwards from Today until the chain breaks.
  let tempStreak = 0;
  
  // Loop backwards from Today for a reasonable lookback (e.g., 365 days or until break)
  // Safety break: 1000 days
  for (let i = 0; i < 1000; i++) {
      const d = dayjs().subtract(i, 'day');
      const dateStr = d.format('YYYY-MM-DD');
      const isCompleted = dates.includes(dateStr);
      const isRest = isHabitRestDay(habit, d);

      if (i === 0) {
          // TODAY
          if (isCompleted) {
              tempStreak++;
          } else {
              // Not completed today. 
              // If it's a rest day, we just continue (freeze).
              // If it's a work day, we continue to check yesterday, but we don't count today.
              // Streak is valid 'up to now'.
              if (isRest) {
                  // Freeze
              } else {
                  // Gap? No, "today" isn't over. So we just don't add to streak, but don't break yet.
                  // We check yesterday.
              }
          }
      } else {
          // PAST DAYS (Yesterday onwards)
          if (isCompleted) {
              tempStreak++;
          } else {
              if (isRest) {
                  // Rest day not completed -> Freeze (Continue without resetting)
                  continue;
              } else {
                  // Work day not completed -> BREAK
                  break; 
              }
          }
      }
  }
  currentStreak = tempStreak;


  // 2. Best Streak
  // Iterate through all days from first completion to today?
  // Or just iterate through the sorted completed dates and check gaps?
  // Since Rest Days are dynamic, we need to iterate calendar days.
  
  let bestStreak = 0;
  let runningStreak = 0;
  
  if (dates.length > 0) {
      const firstDate = dayjs(dates[0]);
      const lastDate = dayjs(); // Up to today
      const totalDays = lastDate.diff(firstDate, 'day') + 1;
      
      // Optimization: If total days is huge, this might be slow. 
      // But typically habits are < few years. 
      // Let's cap at 2 years lookback for performance if needed, but < 1000 is fine.
      
      for (let i = 0; i < totalDays; i++) {
          const d = firstDate.add(i, 'day');
          const dateStr = d.format('YYYY-MM-DD');
          const isCompleted = dates.includes(dateStr);
          const isRest = isHabitRestDay(habit, d);
          
          if (isCompleted) {
              runningStreak++;
          } else {
              if (isRest) {
                  // Freeze (maintain streak)
              } else {
                  // Break
                  runningStreak = 0;
              }
          }
          if (runningStreak > bestStreak) bestStreak = runningStreak;
      }
  }
  // Also check if current streak is best (in case it wasn't covered fully above, though it should be)
  if (currentStreak > bestStreak) bestStreak = currentStreak;


  // 3. Percentage (Current Month)
  const startOfMonth = dayjs().startOf('month');
  const endOfMonth = dayjs().endOf('month');
  const daysInMonth = dayjs().daysInMonth();
  
  // Count only scheduled WORK days in denominator? Or all days?
  // Usually percentage is (completed / total_days).
  // But if I have 2/2 schedule, 50% is perfect score.
  // Let's calculate (completed / total_work_days_passed_so_far)? 
  // User asked for "percentage" in code previously simply as completed / daysInMonth.
  // Let's stick to simple "completed / daysInMonth" for now, or maybe "completed / (daysInMonth - RestDays)"?
  // The previous code was: completedInMonth / daysInMonth.
  
  const completedInMonth = dates.filter(d => d >= startOfMonth.format('YYYY-MM-DD') && d <= endOfMonth.format('YYYY-MM-DD')).length;
  const percentage = Math.round((completedInMonth / daysInMonth) * 100);

  return { currentStreak, bestStreak, percentage };
};
