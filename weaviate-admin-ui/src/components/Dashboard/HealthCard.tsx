import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { HealthStatus } from '../../types';
import { formatISODate } from '../../utils/formatters';

interface HealthCardProps {
  health: HealthStatus;
  version?: string;
  hostname?: string;
}

const HealthCard: React.FC<HealthCardProps> = ({ health, version, hostname }) => {
  const isHealthy = health.status === 'healthy';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Health Status
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {isHealthy ? (
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main' }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
          )}
          <Box>
            <Chip
              label={isHealthy ? 'Healthy' : 'Unhealthy'}
              color={isHealthy ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {health.uptime && (
            <Typography variant="body2" color="text.secondary">
              <strong>Uptime:</strong> {health.uptime}
            </Typography>
          )}
          {version && (
            <Typography variant="body2" color="text.secondary">
              <strong>Version:</strong> {version}
            </Typography>
          )}
          {hostname && (
            <Typography variant="body2" color="text.secondary">
              <strong>Hostname:</strong> {hostname}
            </Typography>
          )}
          {health.last_checked && (
            <Typography variant="caption" color="text.secondary">
              Last checked: {formatISODate(health.last_checked)}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default HealthCard;

