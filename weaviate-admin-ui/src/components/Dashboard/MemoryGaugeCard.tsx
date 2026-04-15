import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis as RechartsPolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { MemoryUsage } from '../../types';
import { formatBytes } from '../../utils/formatters';

// recharts v3 has a stricter return type — cast once at module level
const PolarAngleAxis = RechartsPolarAngleAxis as React.ComponentType<any>;

interface Props {
  memory: MemoryUsage;
}

const MemoryGaugeCard: React.FC<Props> = ({ memory }) => {
  const theme = useTheme();

  const gaugeColor =
    memory.percent < 70
      ? theme.palette.success.main
      : memory.percent < 85
      ? theme.palette.warning.main
      : theme.palette.error.main;

  const trackColor =
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const chartData = [{ value: memory.percent, fill: gaugeColor }];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Memory Usage
        </Typography>

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart
              innerRadius="68%"
              outerRadius="88%"
              data={chartData}
              startAngle={225}
              endAngle={-45}
              barSize={14}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background={{ fill: trackColor } as any}
                dataKey="value"
                angleAxisId={0}
                cornerRadius={8}
                fill={gaugeColor}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Centered percentage text */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ color: gaugeColor, lineHeight: 1 }}
            >
              {Math.round(memory.percent)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              used
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
          {[
            { label: 'Used', value: formatBytes(memory.used * 1024 ** 3) },
            {
              label: 'Free',
              value: formatBytes((memory.total - memory.used) * 1024 ** 3),
            },
            { label: 'Total', value: formatBytes(memory.total * 1024 ** 3) },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MemoryGaugeCard;
