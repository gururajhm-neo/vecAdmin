import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { formatNumber } from '../../utils/formatters';

interface Props {
  counts: Record<string, number>;
}

const PALETTE = [
  '#6C9CFF',
  '#9B7FFF',
  '#FF6FB7',
  '#FF9F6C',
  '#6CFFB4',
  '#6CDCFF',
  '#FFD86C',
  '#FF6C6C',
];

interface ChartRow {
  name: string;
  count: number;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}

const ObjectCountChart: React.FC<Props> = ({ counts }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const data: ChartRow[] = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count], idx) => ({
      name,
      count,
      color: PALETTE[idx % PALETTE.length],
    }));

  if (data.length === 0) return null;

  const barHeight = 44;
  const chartHeight = data.length * barHeight + 40;

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, count, color } = payload[0].payload;
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1.5,
          px: 1.5,
          py: 1,
          boxShadow: 4,
        }}
      >
        <Typography variant="body2" fontWeight={700}>
          {name}
        </Typography>
        <Typography variant="body2" sx={{ color }}>
          {formatNumber(count)} objects
        </Typography>
      </Box>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Objects by Class
        </Typography>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 90, left: 8, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{
                fontSize: 13,
                fill: theme.palette.text.primary,
                fontWeight: 500,
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              }}
            />
            <Bar dataKey="count" radius={[0, 7, 7, 0]} maxBarSize={32} animationDuration={900}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                formatter={(v: any) => formatNumber(v as number)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fill: theme.palette.text.primary,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ObjectCountChart;
