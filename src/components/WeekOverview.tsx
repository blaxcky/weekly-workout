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
        const allDone = stat.scheduled > 0 && stat.completed >= stat.scheduled;
        const hasMissed = isPast && stat.scheduled > 0 && stat.completed < stat.scheduled;
        const nothingScheduled = stat.scheduled === 0;

        let dotColor: string;
        if (nothingScheduled) {
          dotColor = 'action.disabledBackground';
        } else if (allDone) {
          dotColor = 'success.main';
        } else if (hasMissed) {
          dotColor = 'warning.main';
        } else if (isToday) {
          dotColor = 'primary.main';
        } else {
          dotColor = 'action.selected';
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
              {stat.scheduled > 0 && (
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: allDone || hasMissed ? '#fff' : 'text.secondary',
                  }}
                >
                  {stat.completed}/{stat.scheduled}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
