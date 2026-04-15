import React from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { WeaviateObject } from '../../types';
import { truncateUUID } from '../../utils/formatters';

interface SimilarObjectsProps {
  objects: WeaviateObject[];
  onBack: () => void;
}

const SimilarObjects: React.FC<SimilarObjectsProps> = ({ objects, onBack }) => {
  const getPropertyKeys = (): string[] => {
    if (objects.length === 0) return [];
    const keys = Object.keys(objects[0]).filter((key) => key !== '_additional');
    return keys.slice(0, 3);
  };

  const propertyKeys = getPropertyKeys();

  const renderCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value).substring(0, 50) + '...';
    return String(value).substring(0, 100);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Back to List
        </Button>
        <Typography variant="h6">Similar Objects ({objects.length})</Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Similarity</strong></TableCell>
              <TableCell><strong>ID</strong></TableCell>
              {propertyKeys.map((key) => (
                <TableCell key={key}><strong>{key}</strong></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {objects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={propertyKeys.length + 2} align="center">
                  No similar objects found
                </TableCell>
              </TableRow>
            ) : (
              objects.map((obj, index) => {
                const distance = obj._additional?.distance ?? 0;
                // Cosine distance (Weaviate/Qdrant): range 0-1, use (1-d)*100
                // L2 distance (FAISS/Chroma):        range 0-∞, use 100/(1+d)
                const similarity = distance <= 1
                  ? Math.max(0, Math.round((1 - distance) * 100))
                  : Math.round(100 / (1 + distance));

                return (
                  <TableRow
                    key={obj._additional?.id || index}
                    sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}
                  >
                    <TableCell>
                      <Chip
                        label={`${similarity}%`}
                        color={similarity > 70 ? 'success' : similarity > 40 ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{truncateUUID(obj._additional?.id || '')}</TableCell>
                    {propertyKeys.map((key) => (
                      <TableCell key={key}>{renderCellValue(obj[key])}</TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SimilarObjects;

