import React, { useState } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { ClassSchema } from '../../types';
import { formatNumber } from '../../utils/formatters';
import { CLASS_ICONS, DEFAULT_CLASS_ICON } from '../../utils/constants';

interface ClassListProps {
  classes: ClassSchema[];
  selectedClass: ClassSchema | null;
  onSelectClass: (classSchema: ClassSchema) => void;
}

const ClassList: React.FC<ClassListProps> = ({ classes, selectedClass, onSelectClass }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Classes
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {filteredClasses.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No classes found
            </Typography>
          </Box>
        ) : (
          filteredClasses.map((cls) => {
            const icon = CLASS_ICONS[cls.name] || DEFAULT_CLASS_ICON;
            return (
              <ListItemButton
                key={cls.name}
                selected={selectedClass?.name === cls.name}
                onClick={() => onSelectClass(cls)}
              >
                <Typography sx={{ mr: 1, fontSize: 20 }}>{icon}</Typography>
                <ListItemText
                  primary={cls.name}
                  secondary={`${formatNumber(cls.objectCount || 0)} objects`}
                />
              </ListItemButton>
            );
          })
        )}
      </List>
    </Paper>
  );
};

export default ClassList;

