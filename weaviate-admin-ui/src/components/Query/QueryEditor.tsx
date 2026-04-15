import React from 'react';
import { Box, Button, Paper, useTheme } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ClearIcon from '@mui/icons-material/Clear';
import Editor from '@monaco-editor/react';

interface QueryEditorProps {
  query: string;
  onQueryChange: (query: string) => void;
  onExecute: () => void;
  onClear: () => void;
  loading: boolean;
}

const QueryEditor: React.FC<QueryEditorProps> = ({
  query,
  onQueryChange,
  onExecute,
  onClear,
  loading,
}) => {
  const theme = useTheme();
  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={onExecute}
            disabled={loading || !query.trim()}
          >
            Execute Query
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={onClear}
            disabled={loading}
          >
            Clear
          </Button>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language="graphql"
          value={query}
          onChange={(value) => onQueryChange(value || '')}
          theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'vs'}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </Box>
    </Paper>
  );
};

export default QueryEditor;

