import { Box, Typography } from '@mui/material';
import { WEEKDAY_SHORT, getTodayWeekdayIndex } from '../utils/week';
import type { DayStats } from '../utils/schedule';

interface WeekOverviewProps {
  dayStats: DayStats[];
}

export default function WeekOverview({ dayStats }: WeekOverviewProps) {
  const todayIndex = getTodayWeekdayIndex();

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        justifyContent: 'space-between',
        mb: 2,
        px: 1,
      }}
    >
      {dayStats.map((stat) => {
        const isToday = stat.dayIndex === todayIndex;
        const isPast = stat.dayIndex < todayIndex;

        let dotColor: string;
        let label = '';

        if (stat.isTrainingDay) {
          const allDone = stat.kraftTotal > 0 && stat.kraftCompleted >= stat.kraftTotal;
          if (allDone) {
            dotColor = 'success.main';
            label = '✓';
          } else if (isPast && stat.kraftTotal > 0) {
            dotColor = 'warning.main';
            label = `${stat.kraftCompleted}/${stat.kraftTotal}`;
          } else {
            dotColor = isToday ? 'primary.main' : 'info.main';
            label = stat.kraftTotal > 0 ? `${stat.kraftCompleted}/${stat.kraftTotal}` : '💪';
          }
        } else {
          dotColor = isToday ? 'action.selected' : 'action.disabledBackground';
          if (stat.physioCompleted > 0) {
            label = String(stat.physioCompleted);
          }
        }

        return (
          <Box
            key={stat.dayIndex}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                fontWeight: isToday ? 700 : 400,
                color: isToday ? 'primary.main' : 'text.disabled',
              }}
            >
              {WEEKDAY_SHORT[stat.dayIndex]}
            </Typography>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: dotColor,
                border: isToday ? '2px solid' : 'none',
                borderColor: 'primary.main',
              }}
            >
              {label && (
                <Typography
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: stat.isTrainingDay ? '#fff' : 'text.secondary',
                  }}
                >
                  {label}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
