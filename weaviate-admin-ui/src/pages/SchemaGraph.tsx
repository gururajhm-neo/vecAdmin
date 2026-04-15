import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  useTheme,
  CircularProgress,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { getSchema } from '../api/schema';
import { ClassSchema } from '../types';
import ProjectSelector from '../components/Common/ProjectSelector';
import { useAuth } from '../contexts/AuthContext';
import ClassNode, { ClassNodeData } from '../components/SchemaGraph/ClassNode';
import { formatNumber } from '../utils/formatters';

// Register custom node types outside the component to avoid re-registration on re-render
const nodeTypes = { classNode: ClassNode };

// ─── Quick-query builder (used by the detail panel button) ──────────────────
const isScalarDT = (dt: string) => !/^[A-Z]/.test(dt);
function buildGetQuery(cls: ClassSchema): string {
  const props = cls.properties
    .filter((p) => p.dataType.every(isScalarDT))
    .slice(0, 6)
    .map((p) => `      ${p.name}`)
    .join('\n');
  return `{\n  Get {\n    ${cls.name}(limit: 10) {\n${props ? props + '\n' : ''}      _additional {\n        id\n      }\n    }\n  }\n}`;
}

// ─── Layout algorithm (topological / BFS layers) ────────────────────────────
function computeLayout(
  classes: ClassSchema[],
): Record<string, { x: number; y: number }> {
  const NODE_W = 230;
  const NODE_H = 100;
  const GAP_X = 70;
  const GAP_Y = 90;

  const classNameSet = new Set(classes.map((c) => c.name));
  const adj = new Map<string, Set<string>>();
  const inDeg = new Map<string, number>();

  classes.forEach((c) => {
    adj.set(c.name, new Set());
    inDeg.set(c.name, 0);
  });

  // Build directed edges from cross-references
  classes.forEach((cls) => {
    cls.properties.forEach((prop) => {
      prop.dataType.forEach((dt) => {
        if (classNameSet.has(dt) && dt !== cls.name) {
          adj.get(cls.name)!.add(dt);
          inDeg.set(dt, (inDeg.get(dt) ?? 0) + 1);
        }
      });
    });
  });

  // Kahn's BFS → topological layers
  const queue: string[] = [];
  inDeg.forEach((deg, name) => {
    if (deg === 0) queue.push(name);
  });

  const layers: string[][] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const layer = [...queue];
    queue.length = 0;
    layers.push(layer);
    layer.forEach((n) => {
      visited.add(n);
      adj.get(n)!.forEach((child) => {
        inDeg.set(child, inDeg.get(child)! - 1);
        if (inDeg.get(child) === 0 && !visited.has(child)) {
          queue.push(child);
        }
      });
    });
  }

  // Nodes in cycles or isolated → extra layer
  const remaining = classes.filter((c) => !visited.has(c.name)).map((c) => c.name);
  if (remaining.length > 0) layers.push(remaining);

  // Assign positions — centered per layer
  // If all nodes land in one layer (no cross-refs at all), spread them in a grid
  const positions: Record<string, { x: number; y: number }> = {};

  const isSingleLayer = layers.length === 1 && layers[0].length === classes.length;
  if (isSingleLayer && classes.length > 3) {
    const COLS = Math.ceil(Math.sqrt(classes.length));
    layers[0].forEach((name, ni) => {
      const col = ni % COLS;
      const row = Math.floor(ni / COLS);
      positions[name] = {
        x: col * (NODE_W + GAP_X),
        y: row * (NODE_H + 200),   // extra vertical gap so property preview doesn't overlap
      };
    });
  } else {
    layers.forEach((layer, li) => {
      const totalW = layer.length * (NODE_W + GAP_X) - GAP_X;
      layer.forEach((name, ni) => {
        positions[name] = {
          x: ni * (NODE_W + GAP_X) - totalW / 2 + NODE_W / 2,
          y: li * (NODE_H + GAP_Y),
        };
      });
    });
  }

  return positions;
}

// ─── Component ───────────────────────────────────────────────────────────────
const SchemaGraph: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDark = theme.palette.mode === 'dark';
  const edgeColor = isDark ? '#6C9CFF' : '#1976d2';

  const [classes, setClasses] = useState<ClassSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all' | null>(
    user?.project_id ?? 'all',
  );
  const [selectedClass, setSelectedClass] = useState<ClassSchema | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // ── Fetch schema ──
  const fetchSchema = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSchema(selectedProjectId);
      setClasses(result.classes);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch schema');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  // ── Build graph nodes + edges whenever classes or theme changes ──
  useEffect(() => {
    if (classes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const classNameSet = new Set(classes.map((c) => c.name));
    const positions = computeLayout(classes);

    const newNodes: Node[] = classes.map((cls) => {
      const crossRefCount = cls.properties.filter((p) =>
        p.dataType.some((dt) => classNameSet.has(dt) && dt !== cls.name),
      ).length;

      // First 4 scalar (non-cross-ref) property names for the preview inside the node
      const scalarProps = cls.properties
        .filter((p) => !p.dataType.some((dt) => classNameSet.has(dt)))
        .map((p) => p.name)
        .slice(0, 4);

      return {
        id: cls.name,
        type: 'classNode',
        position: positions[cls.name] ?? { x: 0, y: 0 },
        data: {
          className: cls.name,
          objectCount: cls.objectCount ?? 0,
          propertyCount: cls.properties.length,
          crossRefCount,
          topProperties: scalarProps,
          vectorizer: cls.vectorConfig?.vectorizer,
        } as ClassNodeData,
      };
    });

    const newEdges: Edge[] = [];
    classes.forEach((cls) => {
      cls.properties.forEach((prop) => {
        prop.dataType.forEach((dt) => {
          if (classNameSet.has(dt) && dt !== cls.name) {
            newEdges.push({
              id: `${cls.name}→${dt}::${prop.name}`,
              source: cls.name,
              target: dt,
              label: prop.name,
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: edgeColor,
                width: 16,
                height: 16,
              },
              style: { stroke: edgeColor, strokeWidth: 2 },
              labelStyle: { fontSize: 10, fill: theme.palette.text.secondary },
              labelBgStyle: {
                fill: theme.palette.background.paper,
                fillOpacity: 0.9,
              },
              labelBgPadding: [4, 3] as [number, number],
              labelBgBorderRadius: 3,
            });
          }
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    classes,
    isDark,
    edgeColor,
    setNodes,
    setEdges,
    theme.palette.text.secondary,
    theme.palette.background.paper,
  ]);

  // ── Node click ──
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const cls = classes.find((c) => c.name === node.id);
      if (cls) setSelectedClass(cls);
    },
    [classes],
  );

  const handlePaneClick = useCallback(() => setSelectedClass(null), []);

  // ── Dim non-matching nodes when search is active ──
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity:
            !searchTerm.trim() ||
            n.id.toLowerCase().includes(searchTerm.toLowerCase())
              ? 1
              : 0.15,
        },
      })),
    );
  }, [searchTerm, setNodes]);

  const totalObjects = classes.reduce((s, c) => s + (c.objectCount ?? 0), 0);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Schema Graph
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visual map of your Weaviate data model — click any node for details
          </Typography>
        </Box>

        <ProjectSelector
          selectedProjectId={selectedProjectId}
          onProjectChange={setSelectedProjectId}
          showAllOption
        />

        <Tooltip title="Switch to table view">
          <Button
            variant="outlined"
            size="small"
            startIcon={<TableChartIcon />}
            onClick={() => navigate('/schema')}
          >
            Table View
          </Button>
        </Tooltip>

        <TextField
          size="small"
          placeholder="Search classes…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <InfoOutlinedIcon sx={{ fontSize: 14, opacity: 0.5 }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 180, '& .MuiInputBase-root': { fontSize: 13 } }}
        />
      </Box>

      {/* ── Stat pills ── */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label={`${classes.length} classes`} size="small" color="primary" variant="outlined" />
        <Chip
          label={`${edges.length} cross-references`}
          size="small"
          color="secondary"
          variant="outlined"
        />
        <Chip
          label={`${formatNumber(totalObjects)} total objects`}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Info banner when no cross-references exist */}
      {!loading && classes.length > 0 && edges.length === 0 && (
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon fontSize="small" />}
          sx={{ mb: 1.5, py: 0.5 }}
        >
          No cross-references defined between classes — each class is independent.
          Edges appear automatically when a property references another class.
        </Alert>
      )}

      {/* ── Canvas + detail panel ── */}
      <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
        <Box
          sx={{
            flex: 1,
            height: 'calc(100vh - 280px)',
            minHeight: 400,
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            position: 'relative',
          }}
        >
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper',
                zIndex: 10,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}

          {!loading && !error && classes.length === 0 && (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="text.secondary">No classes found in schema.</Typography>
            </Box>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            colorMode={isDark ? 'dark' : 'light'}
            minZoom={0.1}
            maxZoom={2.5}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color={isDark ? '#30363d' : '#d0d7de'}
              gap={20}
              size={1}
            />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const d = n.data as ClassNodeData;
                if (!d) return '#9e9e9e';
                const count = d.objectCount as number;
                if (count === 0) return '#9e9e9e';
                if (count < 100) return '#6C9CFF';
                if (count < 1000) return '#4caf50';
                if (count < 10000) return '#ff9800';
                return '#f44336';
              }}
              maskColor={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'}
              style={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
              }}
            />
          </ReactFlow>
        </Box>

        {/* Detail side panel — slides in when a node is selected */}
        {selectedClass && (
          <Paper
            elevation={0}
            sx={{
              width: 300,
              flexShrink: 0,
              height: 'calc(100vh - 280px)',
              minHeight: 400,
              overflow: 'auto',
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                mb: 1.5,
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                {selectedClass.name}
              </Typography>
              <IconButton size="small" onClick={() => setSelectedClass(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={`${formatNumber(selectedClass.objectCount ?? 0)} objects`}
                size="small"
                color="primary"
              />
              <Chip
                label={`${selectedClass.properties.length} properties`}
                size="small"
                variant="outlined"
              />
            </Box>

            <Button
              size="small"
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
              onClick={() =>
                navigate('/query', { state: { query: buildGetQuery(selectedClass) } })
              }
              sx={{ mb: 1.5, fontSize: 11 }}
            >
              Open in Query Playground
            </Button>

            {selectedClass.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {selectedClass.description}
              </Typography>
            )}

            <Divider sx={{ mb: 1.5 }} />

            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Properties
            </Typography>
            <List dense disablePadding>
              {selectedClass.properties.map((prop) => (
                <ListItem key={prop.name} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemText
                    primary={prop.name}
                    secondary={prop.dataType.join(' | ')}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>

            {selectedClass.vectorConfig?.vectorizer && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Vectorizer
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedClass.vectorConfig.vectorizer}
                </Typography>
              </>
            )}
          </Paper>
        )}
      </Box>

      {/* ── Legend ── */}
      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Node colour = object count:
        </Typography>
        {[
          { color: '#9e9e9e', label: '0' },
          { color: '#6C9CFF', label: '< 100' },
          { color: '#4caf50', label: '100 – 999' },
          { color: '#ff9800', label: '1k – 9.9k' },
          { color: '#f44336', label: '10k+' },
        ].map(({ color, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: color,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SchemaGraph;
