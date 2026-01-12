import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
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
  const [classes, setClasses] = useState<ClassSchema[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all' | null>(
    user?.project_id || 'all'
  );

  useEffect(() => {
    fetchSchema();
  }, [selectedProjectId]);

  const fetchSchema = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getSchema(selectedProjectId);
      setClasses(result.classes);
      
      // Auto-select first class if available and no class is selected
      if (result.classes.length > 0 && !selectedClass) {
        setSelectedClass(result.classes[0]);
      } else if (result.classes.length > 0 && selectedClass) {
        // If a class was selected, try to find it in the new list
        const foundClass = result.classes.find(c => c.name === selectedClass.name);
        if (foundClass) {
          setSelectedClass(foundClass);
        } else {
          // If the previously selected class is not in the new list, select first one
          setSelectedClass(result.classes[0]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch schema');
    } finally {
      setLoading(false);
    }
  };

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
          <Typography variant="h4" component="h1">
            Schema Viewer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedProjectId === 'all' 
              ? 'Showing object counts for all projects' 
              : `Showing object counts for Project ID: ${selectedProjectId}`}
          </Typography>
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

