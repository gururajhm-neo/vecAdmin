import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, Tooltip, TextField, IconButton,
  CircularProgress, Alert, Collapse, Paper,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation } from 'react-router-dom';
import { executeQuery } from '../api/query';
import { nlToQuery, explainResults } from '../api/ai';
import { getSchema } from '../api/schema';
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
  const [schemaClasses, setSchemaClasses] = useState<any[]>([]);

  const isGraphql = !providerInfo || providerInfo.query_language === 'graphql';

  const [query, setQuery] = useState<string>(
    (location.state as any)?.query ?? '',
  );
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId] = useState<number | 'all' | null>(
    user?.project_id ?? 'all',
  );

  // ── AI state ────────────────────────────────────────────────────────────────
  const [nlText, setNlText] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  useEffect(() => {
    getProviderInfo().then(setProviderInfo).catch(() => {});
  }, []);

  // Pre-load schema so AI can use real field names
  useEffect(() => {
    getSchema(selectedProjectId)
      .then((r) => setSchemaClasses(r.classes ?? []))
      .catch(() => {});
  }, [selectedProjectId]);

  useEffect(() => {
    if (!providerInfo) return;
    const incoming = (location.state as any)?.query;
    if (incoming) return;
    const correctDefault =
      providerInfo.query_language === 'graphql' ? GRAPHQL_DEFAULT : JSON_DEFAULT;
    setQuery(prev =>
      prev === '' || prev === GRAPHQL_DEFAULT || prev === JSON_DEFAULT
        ? correctDefault
        : prev,
    );
  }, [providerInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const incoming = (location.state as any)?.query;
    if (incoming) {
      setQuery(incoming);
      setResult(null);
      setExplanation(null);
    }
  }, [location.state]);

  const handleExecute = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setExplanation(null);
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
    setExplanation(null);
    setNlText('');
    setNlError(null);
  };

  // ── AI handlers ─────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!nlText.trim()) return;
    setNlLoading(true);
    setNlError(null);
    try {
      const res = await nlToQuery(nlText, schemaClasses);
      if (res.error) { setNlError(res.error); return; }
      if (res.query) {
        setQuery(res.query);
        setResult(null);
        setExplanation(null);
      }
    } catch (err: any) {
      setNlError(err.response?.data?.detail || 'Failed to generate query');
    } finally {
      setNlLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!result || !query.trim()) return;
    setExplainLoading(true);
    try {
      const res = await explainResults(query, result);
      if (res.error) { setExplanation(`Error: ${res.error}`); return; }
      setExplanation(res.explanation ?? null);
    } catch (err: any) {
      setExplanation('Failed to explain results.');
    } finally {
      setExplainLoading(false);
    }
  };

  const langLabel = isGraphql ? 'GraphQL' : 'JSON';
  const langColor = isGraphql ? 'success' : 'info';
  const description = isGraphql
    ? 'Write GraphQL queries against Weaviate. Use the Schema Reference panel on the left to browse real classes.'
    : `Write JSON filter queries for ${providerInfo?.provider ?? 'your database'}. Format: {"collection": "Name", "where": {...}, "limit": 10}`;

  const hasResults = result && !result.error;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Query Playground
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
        <Tooltip title={`Active query language: ${langLabel}`}>
          <Chip label={langLabel} color={langColor} size="small" sx={{ mt: 1, fontWeight: 700 }} />
        </Tooltip>
      </Box>

      {/* ✨ AI Natural Language Bar */}
      <Paper
        variant="outlined"
        sx={{ mb: 1.5, p: 1, display: 'flex', alignItems: 'center', gap: 1, borderColor: 'primary.main', borderRadius: 2, opacity: 0.92 }}
      >
        <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 18, flexShrink: 0 }} />
        <TextField
          size="small"
          fullWidth
          placeholder={`Ask AI — e.g. "Show me the 5 most recent Articles about AI"`}
          value={nlText}
          onChange={(e) => setNlText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !nlLoading && handleGenerate()}
          disabled={nlLoading}
          sx={{ '& .MuiInputBase-root': { fontSize: 13 }, '& fieldset': { border: 'none' } }}
        />
        <Tooltip title="Generate query from description">
          <span>
            <IconButton
              size="small"
              color="primary"
              onClick={handleGenerate}
              disabled={!nlText.trim() || nlLoading}
              sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 1.5, px: 1.5, py: 0.5, fontSize: 12, '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}
            >
              {nlLoading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <Typography variant="caption" fontWeight={700} sx={{ color: 'inherit' }}>Generate</Typography>}
            </IconButton>
          </span>
        </Tooltip>
      </Paper>

      {nlError && (
        <Alert severity="error" sx={{ mb: 1, py: 0.25 }} onClose={() => setNlError(null)}>
          {nlError}
        </Alert>
      )}

      {/* 3-panel layout */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          height: 'calc(100vh - 260px)',
          minHeight: 440,
          overflow: 'hidden',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
        }}
      >
        {/* Left: Schema Reference */}
        <SchemaReferencePanel
          selectedProjectId={selectedProjectId}
          queryLanguage={providerInfo?.query_language ?? 'graphql'}
          onInsertQuery={(q) => { setQuery(q); setResult(null); setExplanation(null); }}
        />

        {/* Centre: Editor */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: 1, borderColor: 'divider' }}>
          <QueryEditor
            query={query}
            onQueryChange={setQuery}
            onExecute={handleExecute}
            onClear={handleClear}
            loading={loading}
            editorLanguage={isGraphql ? 'graphql' : 'json'}
          />
        </Box>

        {/* Right: Results */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <ResultViewer result={result} />

          {/* ✨ Explain Results button */}
          {hasResults && (
            <Box sx={{ px: 1.5, pb: 1, pt: 0.5, borderTop: 1, borderColor: 'divider' }}>
              <Tooltip title="AI will summarise what these results mean in plain English">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleExplain}
                    disabled={explainLoading}
                    sx={{ borderRadius: 1.5, px: 1.5, py: 0.4, gap: 0.5, border: 1, borderColor: 'divider', fontSize: 11 }}
                  >
                    {explainLoading
                      ? <CircularProgress size={12} />
                      : <LightbulbIcon sx={{ fontSize: 14, color: 'warning.main' }} />}
                    <Typography variant="caption" fontWeight={600}>
                      {explainLoading ? 'Thinking…' : 'Explain Results'}
                    </Typography>
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>

      {/* ✨ AI Explanation panel */}
      <Collapse in={!!explanation}>
        <Paper
          variant="outlined"
          sx={{ mt: 1.5, p: 1.5, borderColor: 'warning.main', borderRadius: 2, position: 'relative', bgcolor: 'warning.main', opacity: 0.92 }}
        >
          <IconButton
            size="small"
            onClick={() => setExplanation(null)}
            sx={{ position: 'absolute', top: 6, right: 6 }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', pr: 3 }}>
            <LightbulbIcon sx={{ fontSize: 16, color: 'warning.contrastText', mt: 0.3, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: 'warning.contrastText', lineHeight: 1.6 }}>
              {explanation}
            </Typography>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default QueryPlayground;


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

  // Start empty — correct default is injected once providerInfo loads.
  // This avoids the race where GraphQL template hits a JSON provider on first Run.
  const [query, setQuery] = useState<string>(
    (location.state as any)?.query ?? '',
  );
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId] = useState<number | 'all' | null>(
    user?.project_id ?? 'all',
  );

  useEffect(() => {
    getProviderInfo().then(setProviderInfo).catch(() => {});
  }, []);

  // Once provider info loads, inject the correct default template —
  // but only if the user hasn't already typed something (or navigated in with a query).
  useEffect(() => {
    if (!providerInfo) return;
    const incoming = (location.state as any)?.query;
    if (incoming) return;
    const correctDefault =
      providerInfo.query_language === 'graphql' ? GRAPHQL_DEFAULT : JSON_DEFAULT;
    setQuery(prev =>
      prev === '' || prev === GRAPHQL_DEFAULT || prev === JSON_DEFAULT
        ? correctDefault
        : prev,
    );
  }, [providerInfo]); // eslint-disable-line react-hooks/exhaustive-deps

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
          queryLanguage={providerInfo?.query_language ?? 'graphql'}
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
            editorLanguage={isGraphql ? 'graphql' : 'json'}
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
