import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { getSchema } from '../api/schema';
import { getObjects, getObjectDetail, findSimilarObjects } from '../api/data';
import { WeaviateObject } from '../types';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import EmptyState from '../components/Common/EmptyState';
import ClassSelector from '../components/Data/ClassSelector';
import ObjectTable from '../components/Data/ObjectTable';
import ObjectDetailModal from '../components/Data/ObjectDetailModal';
import SimilarObjects from '../components/Data/SimilarObjects';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

const DataBrowser: React.FC = () => {
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [objects, setObjects] = useState<WeaviateObject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  
  // Similar objects state
  const [showingSimilar, setShowingSimilar] = useState(false);
  const [similarObjects, setSimilarObjects] = useState<WeaviateObject[]>([]);

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch objects when class or pagination changes
  useEffect(() => {
    if (selectedClass) {
      fetchObjects();
    }
  }, [selectedClass, page, rowsPerPage]);

  const fetchClasses = async () => {
    try {
      const result = await getSchema();
      const classNames = result.classes.map((cls) => cls.name);
      setClasses(classNames);
      
      if (classNames.length > 0) {
        setSelectedClass(classNames[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchObjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getObjects(
        selectedClass,
        rowsPerPage,
        page * rowsPerPage
      );
      setObjects(result.objects);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch objects');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    setPage(0);
    setShowingSimilar(false);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleViewDetails = async (obj: WeaviateObject) => {
    try {
      const objectId = obj._additional?.id;
      if (!objectId) return;

      const details = await getObjectDetail(selectedClass, objectId);
      setSelectedObject(details);
      setDetailModalOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch object details');
    }
  };

  const handleFindSimilar = async (obj: WeaviateObject) => {
    const objectId = obj._additional?.id;
    if (!objectId) return;

    setLoading(true);
    try {
      const result = await findSimilarObjects(selectedClass, objectId, 5);
      setSimilarObjects(result.similar_objects);
      setShowingSimilar(true);
      setDetailModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to find similar objects');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setShowingSimilar(false);
    setSimilarObjects([]);
  };

  if (loading && classes.length === 0) {
    return <LoadingSpinner message="Loading classes..." />;
  }

  if (error && classes.length === 0) {
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
        Data Browser
      </Typography>

      {/* Class selector and filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <ClassSelector
              classes={classes}
              selectedClass={selectedClass}
              onSelectClass={handleClassChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <Typography variant="body2" color="text.secondary">
              {total} objects found in {selectedClass}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Error message */}
      {error && <ErrorMessage message={error} />}

      {/* Main content */}
      {loading ? (
        <LoadingSpinner message="Loading objects..." />
      ) : showingSimilar ? (
        <SimilarObjects objects={similarObjects} onBack={handleBackToList} />
      ) : (
        <ObjectTable
          objects={objects}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onViewDetails={handleViewDetails}
          onFindSimilar={handleFindSimilar}
        />
      )}

      {/* Object detail modal */}
      <ObjectDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        object={selectedObject}
        onFindSimilar={() => {
          if (selectedObject) {
            handleFindSimilar({ _additional: { id: selectedObject.id } });
          }
        }}
      />
    </Box>
  );
};

export default DataBrowser;

