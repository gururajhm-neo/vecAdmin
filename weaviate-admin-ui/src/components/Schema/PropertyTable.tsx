import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { Property } from '../../types';

interface PropertyTableProps {
  properties: Property[];
}

const PropertyTable: React.FC<PropertyTableProps> = ({ properties }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Property Name</strong></TableCell>
            <TableCell><strong>Data Type</strong></TableCell>
            <TableCell><strong>Indexed</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {properties.map((prop, index) => (
            <TableRow
              key={`${prop.name}-${index}`}
              sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}
            >
              <TableCell>{prop.name}</TableCell>
              <TableCell>
                {prop.dataType.map((type, i) => (
                  <Chip
                    key={i}
                    label={type}
                    size="small"
                    sx={{ mr: 0.5 }}
                  />
                ))}
              </TableCell>
              <TableCell>
                {prop.indexed !== false ? (
                  <Chip label="Yes" color="success" size="small" />
                ) : (
                  <Chip label="No" color="default" size="small" />
                )}
              </TableCell>
            </TableRow>
          ))}
          {properties.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} align="center">
                No properties defined
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PropertyTable;

