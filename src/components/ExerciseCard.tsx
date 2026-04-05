import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import type { Exercise } from '../db/database';
import { getEquipmentLabel, usesBandInput, usesWeightInput } from '../utils/equipment';

interface ExerciseCardProps {
  exercise: Exercise;
  mode: 'kraft' | 'physio';
  /** Kraft mode: is this exercise done today? */
  doneToday?: boolean;
  /** Physio mode: completions this week */
  weekCount?: number;
  /** Physio mode: weekly target */
  weekTarget?: number;
  onComplete: () => void;
}

export default function ExerciseCard({
  exercise,
  mode,
  doneToday = false,
  weekCount = 0,
  weekTarget = 1,
  onComplete,
}: ExerciseCardProps) {
  const isKraft = mode === 'kraft';
  const isDone = isKraft ? doneToday : weekCount >= weekTarget;
  const progress = isKraft ? (doneToday ? 100 : 0) : Math.min((weekCount / weekTarget) * 100, 100);

  return (
    <Card
      sx={{
        opacity: isDone ? 0.7 : 1,
        mb: 1.5,
        border: isDone ? '2px solid' : '1px solid',
        borderColor: isDone ? 'success.main' : 'divider',
      }}
    >
      <CardActionArea onClick={isDone ? undefined : onComplete} disabled={isDone}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isKraft ? (
                <FitnessCenterIcon color="primary" fontSize="small" />
              ) : (
                <SelfImprovementIcon color="secondary" fontSize="small" />
              )}
              <Typography variant="subtitle1" fontWeight={600}>
                {exercise.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isKraft ? (
                isDone ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <Typography variant="body2" color="text.secondary">ausstehend</Typography>
                )
              ) : (
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {weekCount}/{weekTarget}
                </Typography>
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

          {/* Progress bar for physio */}
          {!isKraft && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 3 }}
              color={isDone ? 'success' : 'secondary'}
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
