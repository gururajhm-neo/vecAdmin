import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { formatNumber } from '../../utils/formatters';
import { CLASS_ICONS, DEFAULT_CLASS_ICON } from '../../utils/constants';

interface ObjectCountCardProps {
  className: string;
  count: number;
}

const ObjectCountCard: React.FC<ObjectCountCardProps> = ({ className, count }) => {
  const icon = CLASS_ICONS[className] || DEFAULT_CLASS_ICON;

  return (
    <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: 40 }}>{icon}</Typography>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="div" color="primary.main">
              {formatNumber(count)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {className}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ObjectCountCard;

