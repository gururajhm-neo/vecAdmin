import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getDashboardOverview } from '../api/dashboard';
import { DashboardData } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import HealthCard from '../components/Dashboard/HealthCard';
import ObjectCountCard from '../components/Dashboard/ObjectCountCard';
import MemoryCard from '../components/Dashboard/MemoryCard';
import ProjectSelector from '../components/Common/ProjectSelector';
import { DASHBOARD_REFRESH_INTERVAL } from '../utils/constants';
import { formatNumber } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all' | null>(
    user?.project_id || 'all'
  );

  const fetchData = async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await getDashboardOverview(selectedProjectId);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, DASHBOARD_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [selectedProjectId]);

  const handleProjectChange = (projectId: number | 'all' | null) => {
    setSelectedProjectId(projectId);
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!data) {
    return <ErrorMessage message="No data available" />;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1">
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {selectedProjectId === 'all' 
                ? 'Showing data for all projects' 
                : `Showing data for Project ID: ${selectedProjectId}`}
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ minWidth: 100 }}>
              Filter by Project:
            </Typography>
            <Box sx={{ minWidth: 200 }}>
              <ProjectSelector
                selectedProjectId={selectedProjectId}
                onProjectChange={handleProjectChange}
                showAllOption={true}
              />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Main Grid */}
      <Grid container spacing={3}>
        {/* Health Status */}
        <Grid item xs={12} md={6} lg={4}>
          <HealthCard
            health={data.health}
            version={data.version}
            hostname={data.hostname}
          />
        </Grid>

        {/* Memory Usage */}
        {data.memory && (
          <Grid item xs={12} md={6} lg={4}>
            <MemoryCard memory={data.memory} />
          </Grid>
        )}

        {/* Total Objects */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Objects
              </Typography>
              <Typography variant="h3" component="div" color="primary.main" sx={{ mt: 2 }}>
                {formatNumber(data.total_objects)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Across all classes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Object Counts by Class */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
            Objects by Class
          </Typography>
        </Grid>

        {Object.entries(data.object_counts).map(([className, count]) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={className}>
            <ObjectCountCard className={className} count={count} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;

