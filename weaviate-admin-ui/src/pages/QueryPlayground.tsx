import React, { useState } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { executeQuery } from '../api/query';
import { QueryResponse } from '../types';
import QueryEditor from '../components/Query/QueryEditor';
import ResultViewer from '../components/Query/ResultViewer';
import ExampleQueries from '../components/Query/ExampleQueries';

const DEFAULT_QUERY = `{
  Get {
    # Replace with your class name
    YourClassName(limit: 10) {
      # Add properties here
      _additional {
        id
      }
    }
  }
}`;

const QueryPlayground: React.FC = () => {
  const [query, setQuery] = useState<string>(DEFAULT_QUERY);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await executeQuery(query);
      setResult(response);
    } catch (err: any) {
      setResult({
        error: err.response?.data?.detail || 'Failed to execute query',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
  };

  const handleSelectExample = (exampleQuery: string) => {
    setQuery(exampleQuery);
    setResult(null);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Query Playground
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Execute GraphQL queries against Weaviate. Only read-only queries are allowed.
      </Typography>

      {/* Example queries */}
      <ExampleQueries onSelectExample={handleSelectExample} />

      {/* Split panel layout */}
      <Grid container spacing={3} sx={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}>
        {/* Left panel - Editor */}
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <QueryEditor
            query={query}
            onQueryChange={setQuery}
            onExecute={handleExecute}
            onClear={handleClear}
            loading={loading}
          />
        </Grid>

        {/* Right panel - Results */}
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <ResultViewer result={result} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default QueryPlayground;

