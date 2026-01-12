import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { getSchema } from '../api/schema';
import { ClassSchema } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import EmptyState from '../components/Common/EmptyState';
import ClassList from '../components/Schema/ClassList';
import ClassDetails from '../components/Schema/ClassDetails';

const Schema: React.FC = () => {
  const [classes, setClasses] = useState<ClassSchema[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getSchema();
      setClasses(result.classes);
      
      // Auto-select first class if available
      if (result.classes.length > 0 && !selectedClass) {
        setSelectedClass(result.classes[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch schema');
    } finally {
      setLoading(false);
    }
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
      <Typography variant="h4" component="h1" gutterBottom>
        Schema Viewer
      </Typography>

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

