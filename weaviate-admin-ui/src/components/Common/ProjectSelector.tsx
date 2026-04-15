import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { getAvailableProjects, ProjectMetadata } from '../../api/projects';
import { useAuth } from '../../contexts/AuthContext';

interface ProjectSelectorProps {
  selectedProjectId: number | 'all' | null;
  onProjectChange: (projectId: number | 'all' | null) => void;
  showAllOption?: boolean;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  selectedProjectId,
  onProjectChange,
  showAllOption = true,
}) => {
  const { user } = useAuth();
  const [availableProjects, setAvailableProjects] = useState<number[]>([]);
  const [projectsMetadata, setProjectsMetadata] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getAvailableProjects();
        if (result.error) {
          setError(result.error);
          console.error('Error fetching projects:', result.error);
        } else {
          console.log('Available projects:', result.projects);
          setAvailableProjects(result.projects);
          
          // Use metadata if available, otherwise create from project IDs
          if (result.projects_with_metadata && result.projects_with_metadata.length > 0) {
            setProjectsMetadata(result.projects_with_metadata);
          } else {
            // Fallback: create metadata from project IDs
            setProjectsMetadata(
              result.projects.map(id => ({ id, name: `Project ${id}` }))
            );
          }
          
          if (result.projects.length === 0) {
            setError('No projects found in Weaviate');
          }
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Failed to fetch projects';
        setError(errorMsg);
        console.error('Failed to fetch projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleChange = (event: SelectChangeEvent<number | 'all' | ''>) => {
    const value = event.target.value;
    if (value === 'all' || value === '') {
      onProjectChange('all');
    } else {
      onProjectChange(value as number);
    }
  };

  const userProjectId = user?.project_id;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading projects...
        </Typography>
      </Box>
    );
  }

  // No partition field on this Weaviate instance — hide the selector entirely.
  // All data will be shown (no filter applied). Works perfectly for generic datasets.
  if (!loading && availableProjects.length === 0) {
    return null;
  }

  if (error) {
    return null; // Silently hide on error — don't pollute the UI
  }

  return (
    <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
      <InputLabel>Project ID</InputLabel>
      <Select
        value={selectedProjectId || userProjectId || 'all'}
        label="Project ID"
        onChange={handleChange}
      >
        {showAllOption && (
          <MenuItem value="all">
            <em>All Projects</em>
          </MenuItem>
        )}
        {availableProjects.length === 0 ? (
          <MenuItem value="" disabled>
            No projects found
          </MenuItem>
        ) : (
          projectsMetadata.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Typography variant="body2" component="span">
                  <strong>ID: {project.id}</strong> - {project.name}
                  {project.id === userProjectId && (
                    <Typography component="span" variant="caption" color="primary" sx={{ ml: 1, fontWeight: 'bold' }}>
                      (Your Project)
                    </Typography>
                  )}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

export default ProjectSelector;

