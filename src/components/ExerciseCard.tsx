import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import type { Exercise } from '../db/database';
import { WEEKDAY_SHORT, getTodayWeekdayIndex } from '../utils/week';
import { getEquipmentLabel, usesBandInput, usesWeightInput } from '../utils/equipment';

interface ExerciseCardProps {
  exercise: Exercise;
  completed: number;
  target: number;
  /** Which weekday indices (0=Mo..6=So) this exercise was completed on */
  completedDays: number[];
  onComplete: () => void;
}

export default function ExerciseCard({ exercise, completed, target, completedDays, onComplete }: ExerciseCardProps) {
  const isDone = completed >= target;
  const todayIndex = getTodayWeekdayIndex();
  const doneToday = completedDays.includes(todayIndex);
  const isDisabled = isDone || doneToday;

  return (
    <Card
      sx={{
        opacity: isDone ? 0.7 : 1,
        mb: 1.5,
        border: isDone ? '2px solid' : '1px solid',
        borderColor: isDone ? 'success.main' : 'divider',
      }}
    >
      <CardActionArea onClick={isDisabled ? undefined : onComplete} disabled={isDisabled}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {exercise.type === 'kraft' ? (
                <FitnessCenterIcon color="primary" fontSize="small" />
              ) : (
                <SelfImprovementIcon color="secondary" fontSize="small" />
              )}
              <Typography variant="subtitle1" fontWeight={600}>
                {exercise.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {completed}/{target}
              </Typography>
              {isDone && (
                <IconButton size="small" color="success" disabled>
                  <CheckCircleIcon />
                </IconButton>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Chip label={getEquipmentLabel(exercise.equipment)} size="small" variant="outlined" />
            {usesWeightInput(exercise.equipment) && exercise.defaultWeight && (
              <Chip label={`${exercise.defaultWeight} kg`} size="small" color="primary" variant="outlined" />
            )}
            {usesBandInput(exercise.equipment) && exercise.defaultBand && (
              <Chip label={exercise.defaultBand} size="small" color="secondary" variant="outlined" />
            )}
            <Chip label={`${exercise.kcalPerCompletion} kcal`} size="small" variant="outlined" />
          </Box>

          {/* Mo–So week dots */}
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'space-between' }}>
            {WEEKDAY_SHORT.map((day, i) => {
              const done = completedDays.includes(i);
              const isToday = i === todayIndex;
              return (
                <Box
                  key={day}
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
                    {day}
                  </Typography>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: done ? 'success.main' : isToday ? 'action.selected' : 'action.hover',
                      border: isToday && !done ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                    }}
                  >
                    {done && (
                      <Typography sx={{ fontSize: '0.7rem', color: 'success.contrastText' }}>✓</Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {doneToday && !isDone && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
              Heute bereits erledigt
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
