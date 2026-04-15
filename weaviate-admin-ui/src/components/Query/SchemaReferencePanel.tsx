import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import SearchIcon from '@mui/icons-material/Search';
import { getSchema } from '../../api/schema';
import { ClassSchema } from '../../types';
import { formatNumber } from '../../utils/formatters';

// ─── Helpers: check if a dataType is a scalar (not a cross-ref to another class) ──
const isScalar = (dt: string) => !/^[A-Z]/.test(dt);

// ── GraphQL builders ─────────────────────────────────────────────────────────
function buildGetQuery(cls: ClassSchema): string {
  const props = cls.properties
    .filter((p) => p.dataType.every(isScalar))
    .slice(0, 6)
    .map((p) => `      ${p.name}`)
    .join('\n');
  return `{
  Get {
    ${cls.name}(limit: 10) {
${props ? props + '\n' : ''}      _additional {
        id
      }
    }
  }
}`;
}

function buildCountQuery(className: string): string {
  return `{
  Aggregate {
    ${className} {
      meta {
        count
      }
    }
  }
}`;
}

function buildWhereQuery(cls: ClassSchema): string {
  const firstProp = cls.properties.find((p) => p.dataType.every(isScalar));
  const props = cls.properties
    .filter((p) => p.dataType.every(isScalar))
    .slice(0, 5)
    .map((p) => `      ${p.name}`)
    .join('\n');
  if (!firstProp) return buildGetQuery(cls);
  return `{
  Get {
    ${cls.name}(
      where: {
        path: ["${firstProp.name}"]
        operator: Like
        valueText: "*"
      }
      limit: 10
    ) {
${props ? props + '\n' : ''}      _additional { id }
    }
  }
}`;
}

function buildNearTextQuery(cls: ClassSchema): string {
  const props = cls.properties
    .filter((p) => p.dataType.every(isScalar))
    .slice(0, 4)
    .map((p) => `      ${p.name}`)
    .join('\n');
  return `{
  Get {
    ${cls.name}(
      nearText: { concepts: ["your search term"] }
      limit: 5
    ) {
${props ? props + '\n' : ''}      _additional {
        id
        distance
      }
    }
  }
}`;
}

// ── JSON builders (Qdrant / ChromaDB / FAISS) ─────────────────────────────────
function buildJsonGetQuery(cls: ClassSchema): string {
  return JSON.stringify({ collection: cls.name, limit: 10 }, null, 2);
}

function buildJsonFilterQuery(cls: ClassSchema): string {
  const firstProp = cls.properties.find((p) => p.dataType.every(isScalar));
  const filter = firstProp ? { [firstProp.name]: { $eq: 'value' } } : undefined;
  const q: Record<string, unknown> = { collection: cls.name, limit: 10 };
  if (filter) q.where = filter;
  return JSON.stringify(q, null, 2);
}

function buildQdrantFilterQuery(cls: ClassSchema): string {
  const firstProp = cls.properties.find((p) => p.dataType.every(isScalar));
  const must = firstProp ? [{ key: firstProp.name, match: { value: 'someValue' } }] : [];
  const q: Record<string, unknown> = { collection: cls.name, limit: 10 };
  if (must.length) q.filter = { must };
  return JSON.stringify(q, null, 2);
}

function buildJsonAnnQuery(cls: ClassSchema): string {
  return JSON.stringify(
    { collection: cls.name, query_vector: Array(8).fill(0).map((_, i) => parseFloat((0.1 * (i + 1)).toFixed(1))), limit: 5 },
    null,
    2,
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  selectedProjectId: number | 'all' | null;
  onInsertQuery: (query: string) => void;
  queryLanguage?: string;
  provider?: string;
}

const SchemaReferencePanel: React.FC<Props> = ({ selectedProjectId, onInsertQuery, queryLanguage = 'graphql', provider = '' }) => {
  const isQdrant = provider.toLowerCase() === 'qdrant';
  const [open, setOpen] = useState(true);
  const [classes, setClasses] = useState<ClassSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | false>(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getSchema(selectedProjectId)
      .then((r) => {
        setClasses(r.classes);
        if (r.classes.length > 0) setExpanded(r.classes[0].name);
      })
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load schema'))
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const hasVectorizer = (cls: ClassSchema) =>
    !!(cls.vectorConfig?.vectorizer && cls.vectorConfig.vectorizer !== 'none');

  // ── Collapsed state ──────────────────────────────────────────────────────
  if (!open) {
    return (
      <Box
        sx={{
          width: 36,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 1,
          borderRight: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Tooltip title="Show schema reference" placement="right">
          <IconButton size="small" onClick={() => setOpen(true)}>
            <MenuOpenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography
          variant="caption"
          sx={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            mt: 1.5,
            fontSize: 10,
            color: 'text.secondary',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            userSelect: 'none',
          }}
        >
          Schema
        </Typography>
      </Box>
    );
  }

  // ── Expanded state ───────────────────────────────────────────────────────
  return (
    <Paper
      elevation={0}
      sx={{
        width: 252,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: 1,
        borderColor: 'divider',
        borderRadius: 0,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ flex: 1, fontSize: 11, letterSpacing: 0.8, color: 'text.secondary' }}
        >
          SCHEMA REFERENCE
        </Typography>
        <Tooltip title="Hide panel">
          <IconButton size="small" onClick={() => setOpen(false)}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Search */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Filter classes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 14 }} />
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}
        />
      </Box>

      {/* Class list */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress size={20} />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ m: 1, py: 0.5, fontSize: 11 }}>
            {error}
          </Alert>
        )}
        {!loading &&
          !error &&
          filtered.map((cls) => (
            <Accordion
              key={cls.name}
              expanded={expanded === cls.name}
              onChange={(_, ex) => setExpanded(ex ? cls.name : false)}
              disableGutters
              elevation={0}
              sx={{
                '&:before': { display: 'none' },
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 14 }} />}
                sx={{
                  px: 1.5,
                  py: 0,
                  minHeight: 42,
                  '& .MuiAccordionSummary-content': {
                    my: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    overflow: 'hidden',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  noWrap
                  sx={{ fontSize: 12, flex: 1 }}
                >
                  {cls.name}
                </Typography>
                <Chip
                  label={formatNumber(cls.objectCount ?? 0)}
                  size="small"
                  sx={{ height: 16, fontSize: 9, '& .MuiChip-label': { px: 0.5 } }}
                />
              </AccordionSummary>

              <AccordionDetails sx={{ p: 0 }}>
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  {/* Quick action buttons */}
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
                    {queryLanguage === 'graphql' ? (
                      <>
                        <Tooltip title={`Get ${cls.name} records (limit 10)`}>
                          <Button
                            size="small" variant="contained" color="primary"
                            startIcon={<ListAltIcon sx={{ fontSize: 11 }} />}
                            onClick={() => onInsertQuery(buildGetQuery(cls))}
                            sx={{ fontSize: 10, py: 0.3, px: 0.75, minWidth: 0 }}
                          >Get</Button>
                        </Tooltip>
                        <Tooltip title="Count all objects in this class">
                          <Button
                            size="small" variant="outlined"
                            startIcon={<BarChartIcon sx={{ fontSize: 11 }} />}
                            onClick={() => onInsertQuery(buildCountQuery(cls.name))}
                            sx={{ fontSize: 10, py: 0.3, px: 0.75, minWidth: 0 }}
                          >Count</Button>
                        </Tooltip>
                        <Tooltip title="Filter with Where clause">
                          <Button
                            size="small" variant="outlined"
                            startIcon={<FilterAltIcon sx={{ fontSize: 11 }} />}
                            onClick={() => onInsertQuery(buildWhereQuery(cls))}
                            sx={{ fontSize: 10, py: 0.3, px: 0.75, minWidth: 0 }}
                          >Filter</Button>
                        </Tooltip>
                        {hasVectorizer(cls) && (
                          <Tooltip title="Semantic nearText search (requires vectorizer)">
                            <Button
                              size="small" variant="outlined" color="secondary"
                              startIcon={<TroubleshootIcon sx={{ fontSize: 11 }} />}
                              onClick={() => onInsertQuery(buildNearTextQuery(cls))}
                              sx={{ fontSize: 10, py: 0.3, px: 0.75, minWidth: 0 }}
                            >Search</Button>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      <>
                        <Tooltip title={`List ${cls.name} records (limit 10)`}>
                          <Button
                            size="small" variant="contained" color="primary"
                            startIcon={<ListAltIcon sx={{ fontSize: 11 }} />}
                            onClick={() => onInsertQuery(buildJsonGetQuery(cls))}
                            sx={{ fontSize: 10, py: 0.3, px: 0.75, minWidth: 0 }}
                          >Get</Button>
                        </Tooltip>
                        <Tooltip title={isQdrant ? 'Filter by field (Qdrant must[] syntax)' : 'Filter by a field value'}>
                          <Button
                            size="small" variant="outlined"
                            startIcon={<FilterAltIcon sx={{ fontSize: 11 }} />}
                            onClick={() => onInsertQuery(isQdrant ? buildQdrantFilterQuery(cls) : buildJsonFilterQuery(cls))}
                            sx={{ fontSize: 10, py: 0.3, px: 0.75, minWidth: 0 }}
                          >Filter</Button>
                        </Tooltip>
                        <Tooltip title="ANN vector search (query_vector)">
                          <Button
                            size="small" variant="outlined" color="secondary"
                            startIcon={<TroubleshootIcon sx={{ fontSize: 11 }} />}
                            onClick={() => onInsertQuery(buildJsonAnnQuery(cls))}
                            sx={{ fontSize: 10, py: 0.3, px: 0.75, minWidth: 0 }}
                          >ANN</Button>
                        </Tooltip>
                      </>
                    )}
                  </Box>

                  {/* Property list */}
                  <Divider sx={{ my: 0.75, opacity: 0.5 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: 10,
                      color: 'text.disabled',
                      mb: 0.5,
                      display: 'block',
                      letterSpacing: 0.5,
                    }}
                  >
                    PROPERTIES
                  </Typography>
                  {cls.properties.slice(0, 7).map((p) => (
                    <Typography
                      key={p.name}
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontSize: 10,
                        color: 'text.secondary',
                        fontFamily: 'monospace',
                        lineHeight: 1.8,
                      }}
                    >
                      <span style={{ opacity: 0.4 }}>·</span> {p.name}
                      <span style={{ opacity: 0.45, marginLeft: 4 }}>{p.dataType[0]}</span>
                    </Typography>
                  ))}
                  {cls.properties.length > 7 && (
                    <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled' }}>
                      +{cls.properties.length - 7} more…
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        {!loading && !error && filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, fontSize: 12 }}>
            {search ? 'No matching classes.' : 'No classes found.'}
          </Typography>
        )}
      </Box>

      {/* Footer hint */}
      {!loading && !error && classes.length > 0 && (
        <Box sx={{ px: 1.5, py: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
            Click <strong>Get</strong> / <strong>Count</strong> / <strong>Filter</strong> to insert a ready-to-run query
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SchemaReferencePanel;
