import { useState, type ReactNode } from 'react';
import {
  Box,
  Typography,
  Collapse,
  Badge,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultExpanded?: boolean;
  children: ReactNode;
  icon?: ReactNode;
}

export default function CollapsibleSection({
  title,
  count,
  defaultExpanded = false,
  children,
  icon,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          py: 0.5,
          userSelect: 'none',
        }}
      >
        {icon && <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>{icon}</Box>}
        <Typography variant="subtitle2" color="text.secondary" sx={{ flex: 1 }}>
          {title}
        </Typography>
        {count !== undefined && count > 0 && (
          <Badge badgeContent={count} color="primary" sx={{ mr: 2 }} />
        )}
        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ mt: 1 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}
