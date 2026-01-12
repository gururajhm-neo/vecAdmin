import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { WeaviateObject } from '../../types';
import { truncateUUID, formatDate } from '../../utils/formatters';

interface ObjectTableProps {
  objects: WeaviateObject[];
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onViewDetails: (object: WeaviateObject) => void;
  onFindSimilar: (object: WeaviateObject) => void;
}

const ObjectTable: React.FC<ObjectTableProps> = ({
  objects,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onViewDetails,
  onFindSimilar,
}) => {
  // Get property keys (excluding _additional)
  const getPropertyKeys = (): string[] => {
    if (objects.length === 0) return [];
    const keys = Object.keys(objects[0]).filter((key) => key !== '_additional');
    
    // Prioritize project_id - show it first if it exists
    const projectIdIndex = keys.indexOf('project_id');
    if (projectIdIndex !== -1) {
      // Move project_id to front
      const otherKeys = keys.filter(k => k !== 'project_id');
      return ['project_id', ...otherKeys.slice(0, 3)];
    }
    
    return keys.slice(0, 4); // Show first 4 properties
  };

  const propertyKeys = getPropertyKeys();

  const renderCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value).substring(0, 50) + '...';
    return String(value).substring(0, 100);
  };

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              {propertyKeys.map((key) => (
                <TableCell key={key}><strong>{key}</strong></TableCell>
              ))}
              <TableCell><strong>Created</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {objects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={propertyKeys.length + 3} align="center">
                  No objects found
                </TableCell>
              </TableRow>
            ) : (
              objects.map((obj, index) => (
                <TableRow
                  key={obj._additional?.id || index}
                  sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}
                >
                  <TableCell>
                    <Tooltip title={obj._additional?.id || 'Unknown'}>
                      <span>{truncateUUID(obj._additional?.id || '')}</span>
                    </Tooltip>
                  </TableCell>
                  {propertyKeys.map((key) => {
                    const isProjectId = key === 'project_id';
                    return (
                      <TableCell 
                        key={key}
                        sx={isProjectId ? { 
                          fontWeight: 'bold', 
                          color: 'primary.main',
                          bgcolor: 'primary.50'
                        } : {}}
                      >
                        {renderCellValue(obj[key])}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    {obj._additional?.creationTimeUnix
                      ? formatDate(obj._additional.creationTimeUnix)
                      : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => onViewDetails(obj)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Find Similar">
                      <IconButton size="small" onClick={() => onFindSimilar(obj)}>
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[25, 50, 100]}
      />
    </Paper>
  );
};

export default ObjectTable;

