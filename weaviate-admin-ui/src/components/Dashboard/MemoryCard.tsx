import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import { MemoryUsage } from '../../types';
import { formatBytes, formatPercent, getMemoryColor } from '../../utils/formatters';

interface MemoryCardProps {
  memory: MemoryUsage;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ memory }) => {
  const color = getMemoryColor(memory.percent);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Memory Usage
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {formatBytes(memory.used * 1024 * 1024 * 1024)} / {formatBytes(memory.total * 1024 * 1024 * 1024)}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">
              {formatPercent(memory.percent)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={memory.percent}
            color={color}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Used
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {formatBytes(memory.used * 1024 * 1024 * 1024)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {formatBytes(memory.total * 1024 * 1024 * 1024)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MemoryCard;

