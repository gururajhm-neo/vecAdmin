import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { executeQuery } from '../api/query';
import { QueryResponse } from '../types';
import QueryEditor from '../components/Query/QueryEditor';
import ResultViewer from '../components/Query/ResultViewer';
import SchemaReferencePanel from '../components/Query/SchemaReferencePanel';
import { useAuth } from '../contexts/AuthContext';
import { getProviderInfo, ProviderInfo } from '../api/provider';

const GRAPHQL_DEFAULT = `{
  Get {
    # ← Use the Schema panel on the left to browse real classes and insert queries
    YourClassName(limit: 10) {
      _additional {
        id
      }
    }
  }
}`;

const JSON_DEFAULT = JSON.stringify(
  { collection: 'YourCollection', limit: 10 },
  null, 2
);

const QueryPlayground: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);

  const isGraphql = !providerInfo || providerInfo.query_language === 'graphql';
  const defaultQuery = isGraphql ? GRAPHQL_DEFAULT : JSON_DEFAULT;

  const [query, setQuery] = useState<string>(
    (location.state as any)?.query ?? defaultQuery,
  );
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId] = useState<number | 'all' | null>(
    user?.project_id ?? 'all',
  );

  useEffect(() => {
    getProviderInfo().then(setProviderInfo).catch(() => {});
  }, []);

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

  const langLabel = isGraphql ? 'GraphQL' : 'JSON';
  const langColor = isGraphql ? 'success' : 'info';
  const description = isGraphql
    ? 'Write GraphQL queries against Weaviate. Use the Schema Reference panel on the left to browse real classes.'
    : `Write JSON filter queries for ${providerInfo?.provider ?? 'your database'}. Format: {"collection": "Name", "filter": {...}, "limit": 10}`;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Query Playground
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
        <Tooltip title={`Active query language: ${langLabel}`}>
          <Chip
            label={langLabel}
            color={langColor}
            size="small"
            sx={{ mt: 1, fontWeight: 700 }}
          />
        </Tooltip>
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
