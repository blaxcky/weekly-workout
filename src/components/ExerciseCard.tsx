import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import type { Exercise } from '../db/database';

interface ExerciseCardProps {
  exercise: Exercise;
  completed: number;
  target: number;
  onComplete: () => void;
}

const equipmentLabel: Record<string, string> = {
  gewicht: 'Gewicht',
  band: 'Band',
  koerper: 'Körper',
};

export default function ExerciseCard({ exercise, completed, target, onComplete }: ExerciseCardProps) {
  const progress = target > 0 ? Math.min((completed / target) * 100, 100) : 0;
  const isDone = completed >= target;

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
              {exercise.type === 'kraft' ? (
                <FitnessCenterIcon color="primary" fontSize="small" />
              ) : (
                <SelfImprovementIcon color="secondary" fontSize="small" />
              )}
              <Typography variant="subtitle1" fontWeight={600}>
                {exercise.name}
              </Typography>
            </Box>
            {isDone && (
              <IconButton size="small" color="success" disabled>
                <CheckCircleIcon />
              </IconButton>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Chip label={equipmentLabel[exercise.equipment] ?? exercise.equipment} size="small" variant="outlined" />
            {exercise.equipment === 'gewicht' && exercise.defaultWeight && (
              <Chip label={`${exercise.defaultWeight} kg`} size="small" color="primary" variant="outlined" />
            )}
            {exercise.equipment === 'band' && exercise.defaultBand && (
              <Chip label={exercise.defaultBand} size="small" color="secondary" variant="outlined" />
            )}
            <Chip label={`${exercise.kcalPerCompletion} kcal`} size="small" variant="outlined" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
              color={isDone ? 'success' : 'primary'}
            />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {completed}/{target}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
