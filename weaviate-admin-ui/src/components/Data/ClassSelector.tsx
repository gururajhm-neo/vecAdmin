import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface ClassSelectorProps {
  classes: string[];
  selectedClass: string;
  onSelectClass: (className: string) => void;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({
  classes,
  selectedClass,
  onSelectClass,
}) => {
  return (
    <FormControl fullWidth>
      <InputLabel>Select Class</InputLabel>
      <Select
        value={selectedClass}
        label="Select Class"
        onChange={(e) => onSelectClass(e.target.value)}
      >
        {classes.map((className) => (
          <MenuItem key={className} value={className}>
            {className}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ClassSelector;

