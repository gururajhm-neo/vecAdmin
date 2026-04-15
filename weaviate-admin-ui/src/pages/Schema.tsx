import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid, Paper, Button, Tooltip } from '@mui/material';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import { useNavigate } from 'react-router-dom';
import { getSchema } from '../api/schema';
import { ClassSchema } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import EmptyState from '../components/Common/EmptyState';
import ClassList from '../components/Schema/ClassList';
import ClassDetails from '../components/Schema/ClassDetails';
import ProjectSelector from '../components/Common/ProjectSelector';
import { useAuth } from '../contexts/AuthContext';

const Schema: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassSchema[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all' | null>(
    user?.project_id || 'all'
  );

  const fetchSchema = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getSchema(selectedProjectId);
      setClasses(result.classes);
      
      setSelectedClass((previousClass) => {
        if (result.classes.length === 0) {
          return null;
        }
        if (!previousClass) {
          return result.classes[0];
        }
        const foundClass = result.classes.find((c) => c.name === previousClass.name);
        return foundClass || result.classes[0];
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch schema');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  const handleProjectChange = (projectId: number | 'all' | null) => {
    setSelectedProjectId(projectId);
    // Don't reset selected class - let fetchSchema handle it
  };

  if (loading) {
    return <LoadingSpinner message="Loading schema..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        title="No Classes Found"
        message="There are no classes in the Weaviate schema."
      />
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1">
              Schema Viewer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedProjectId === 'all'
                ? 'Showing object counts for all projects'
                : `Showing object counts for Project ID: ${selectedProjectId}`}
            </Typography>
          </Box>
          <Tooltip title="Visualise classes and cross-references as a node graph">
            <Button
              variant="outlined"
              size="small"
              startIcon={<BubbleChartIcon />}
              onClick={() => navigate('/schema-graph')}
            >
              Graph View
            </Button>
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

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Left sidebar - Class list */}
        <Grid item xs={12} md={4} lg={3}>
          <ClassList
            classes={classes}
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
          />
        </Grid>

        {/* Main panel - Class details */}
        <Grid item xs={12} md={8} lg={9}>
          {selectedClass ? (
            <ClassDetails classSchema={selectedClass} />
          ) : (
            <EmptyState
              title="Select a Class"
              message="Choose a class from the list to view its details."
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Schema;

