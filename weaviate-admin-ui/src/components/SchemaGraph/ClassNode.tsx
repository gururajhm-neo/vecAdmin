import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Box, Typography, Chip, Divider, useTheme } from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import { formatNumber } from '../../utils/formatters';

export type ClassNodeData = {
  className: string;
  objectCount: number;
  propertyCount: number;
  crossRefCount: number;
  topProperties: string[];   // first 4 scalar property names
  vectorizer?: string;
};

export type ClassNodeType = Node<ClassNodeData, 'classNode'>;

const accentForCount = (count: number): string => {
  if (count === 0) return '#9e9e9e';
  if (count < 100) return '#6C9CFF';
  if (count < 1000) return '#4caf50';
  if (count < 10000) return '#ff9800';
  return '#f44336';
};

const ClassNode = memo(({ data, selected }: NodeProps<ClassNodeType>) => {
  const theme = useTheme();
  const { className, objectCount, propertyCount, crossRefCount, topProperties, vectorizer } = data;
  const accent = accentForCount(objectCount);
  const isDark = theme.palette.mode === 'dark';

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: accent,
          border: `2px solid ${theme.palette.background.paper}`,
          width: 10,
          height: 10,
        }}
      />

      <Box
        sx={{
          minWidth: 220,
          maxWidth: 260,
          bgcolor: 'background.paper',
          border: `2px solid ${
            selected ? accent : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
          }`,
          borderRadius: 2,
          boxShadow: selected
            ? `0 0 0 3px ${accent}40, 0 8px 32px rgba(0,0,0,0.25)`
            : isDark
            ? '0 2px 12px rgba(0,0,0,0.4)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
          '&:hover': {
            borderColor: accent,
            boxShadow: `0 0 0 2px ${accent}30, 0 4px 20px rgba(0,0,0,0.2)`,
          },
          cursor: 'pointer',
        }}
      >
        {/* Colour accent bar */}
        <Box sx={{ height: 4, bgcolor: accent }} />

        <Box sx={{ p: 1.5 }}>
          {/* Class name row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
            <HubIcon sx={{ fontSize: 15, color: accent, flexShrink: 0 }} />
            <Typography
              variant="subtitle2"
              fontWeight={700}
              noWrap
              title={className}
              sx={{ fontSize: 13 }}
            >
              {className}
            </Typography>
          </Box>

          {/* Stat chips */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: topProperties.length ? 1 : 0 }}>
            <Chip
              label={`${formatNumber(objectCount)} obj`}
              size="small"
              sx={{
                height: 20, fontSize: 10, fontWeight: 700,
                bgcolor: `${accent}22`, color: accent,
                border: `1px solid ${accent}44`,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
            <Chip
              label={`${propertyCount} props`}
              size="small"
              sx={{
                height: 20, fontSize: 10,
                bgcolor: 'action.hover', color: 'text.secondary',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
            {crossRefCount > 0 && (
              <Chip
                label={`${crossRefCount} refs`}
                size="small"
                sx={{
                  height: 20, fontSize: 10,
                  bgcolor: `${theme.palette.secondary.main}22`,
                  color: theme.palette.secondary.main,
                  border: `1px solid ${theme.palette.secondary.main}44`,
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            )}
            {vectorizer && vectorizer !== 'none' && (
              <Chip
                label={vectorizer.replace('text2vec-', '')}
                size="small"
                sx={{
                  height: 20, fontSize: 10,
                  bgcolor: `${theme.palette.primary.main}18`,
                  color: theme.palette.primary.main,
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            )}
          </Box>

          {/* Top properties preview */}
          {topProperties.length > 0 && (
            <>
              <Divider sx={{ mb: 0.75, opacity: 0.4 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {topProperties.map((prop) => (
                  <Typography
                    key={prop}
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: 10,
                      lineHeight: 1.4,
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    · {prop}
                  </Typography>
                ))}
                {propertyCount > topProperties.length && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>
                    +{propertyCount - topProperties.length} more…
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: accent,
          border: `2px solid ${theme.palette.background.paper}`,
          width: 10,
          height: 10,
        }}
      />
    </>
  );
});

ClassNode.displayName = 'ClassNode';
export default ClassNode;

