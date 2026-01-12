import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Alert } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { QueryResponse } from '../../types';
import { formatExecutionTime } from '../../utils/formatters';

interface ResultViewerProps {
  result: QueryResponse | null;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ result }) => {
  const handleCopy = () => {
    if (result?.data) {
      navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
    }
  };

  if (!result) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Execute a query to see results
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle1">
          Results
          {result.execution_time_ms !== undefined && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({formatExecutionTime(result.execution_time_ms)})
            </Typography>
          )}
        </Typography>
        {result.data && (
          <Tooltip title="Copy to clipboard">
            <IconButton size="small" onClick={handleCopy}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {result.error ? (
          <Alert severity="error">{result.error}</Alert>
        ) : result.data ? (
          <Box
            sx={{
              bgcolor: 'grey.900',
              color: 'grey.100',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
            }}
          >
            <pre style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No data returned
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default ResultViewer;

