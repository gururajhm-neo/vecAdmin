import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { executeQuery } from '../api/query';
import { QueryResponse } from '../types';
import QueryEditor from '../components/Query/QueryEditor';
import ResultViewer from '../components/Query/ResultViewer';
import SchemaReferencePanel from '../components/Query/SchemaReferencePanel';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_QUERY = `{
  Get {
    # ← Use the Schema panel on the left to browse real classes and insert queries
    YourClassName(limit: 10) {
      _additional {
        id
      }
    }
  }
}`;

const QueryPlayground: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [query, setQuery] = useState<string>(
    (location.state as any)?.query ?? DEFAULT_QUERY,
  );
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId] = useState<number | 'all' | null>(
    user?.project_id ?? 'all',
  );

  // Accept pre-built query when navigated from Schema Graph
  useEffect(() => {
    const incoming = (location.state as any)?.query;
    if (incoming) {
      setQuery(incoming);
      setResult(null);
    }
  }, [location.state]);

  const handleExecute = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await executeQuery(query);
      setResult(response);
    } catch (err: any) {
      setResult({ error: err.response?.data?.detail || 'Failed to execute query' });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Query Playground
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Write GraphQL queries against Weaviate. Use the{' '}
          <strong>Schema Reference</strong> panel on the left to browse real classes and insert templates.
        </Typography>
      </Box>

      {/* 3-panel layout */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          height: 'calc(100vh - 200px)',
          minHeight: 500,
          overflow: 'hidden',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
        }}
      >
        {/* Left: Schema Reference */}
        <SchemaReferencePanel
          selectedProjectId={selectedProjectId}
          onInsertQuery={(q) => {
            setQuery(q);
            setResult(null);
          }}
        />

        {/* Centre: Editor */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            borderRight: 1,
            borderColor: 'divider',
          }}
        >
          <QueryEditor
            query={query}
            onQueryChange={setQuery}
            onExecute={handleExecute}
            onClear={handleClear}
            loading={loading}
          />
        </Box>

        {/* Right: Results */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ResultViewer result={result} />
        </Box>
      </Box>
    </Box>
  );
};

export default QueryPlayground;

