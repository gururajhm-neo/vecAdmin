import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { ExampleQuery } from '../../types';

const EXAMPLE_QUERIES: ExampleQuery[] = [
  {
    id: '1',
    name: 'Get all Requirements (limit 10)',
    description: 'Fetch first 10 requirements with all properties',
    query: `{
  Get {
    Requirement(limit: 10) {
      _additional {
        id
        creationTimeUnix
      }
    }
  }
}`,
  },
  {
    id: '2',
    name: 'Get all User Stories with metadata',
    description: 'Fetch user stories with additional metadata',
    query: `{
  Get {
    UserStory(limit: 10) {
      _additional {
        id
        creationTimeUnix
      }
    }
  }
}`,
  },
  {
    id: '3',
    name: 'Aggregate - count all objects',
    description: 'Count total objects across all classes',
    query: `{
  Aggregate {
    Requirement {
      meta {
        count
      }
    }
  }
}`,
  },
  {
    id: '4',
    name: 'Semantic search - nearText',
    description: 'Search for similar content using text',
    query: `{
  Get {
    Requirement(
      nearText: {
        concepts: ["authentication"]
      }
      limit: 5
    ) {
      _additional {
        id
        distance
      }
    }
  }
}`,
  },
  {
    id: '5',
    name: 'Get object by ID',
    description: 'Retrieve a specific object by its UUID',
    query: `{
  Get {
    Requirement(
      where: {
        path: ["id"]
        operator: Equal
        valueString: "YOUR_UUID_HERE"
      }
    ) {
      _additional {
        id
      }
    }
  }
}`,
  },
];

interface ExampleQueriesProps {
  onSelectExample: (query: string) => void;
}

const ExampleQueries: React.FC<ExampleQueriesProps> = ({ onSelectExample }) => {
  const [selectedId, setSelectedId] = React.useState<string>('');

  const handleChange = (exampleId: string) => {
    setSelectedId(exampleId);
    const example = EXAMPLE_QUERIES.find((q) => q.id === exampleId);
    if (example) {
      onSelectExample(example.query);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Example Queries
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Select an example</InputLabel>
        <Select
          value={selectedId}
          label="Select an example"
          onChange={(e) => handleChange(e.target.value)}
        >
          <MenuItem value="">
            <em>Choose an example...</em>
          </MenuItem>
          {EXAMPLE_QUERIES.map((example) => (
            <MenuItem key={example.id} value={example.id}>
              {example.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {selectedId && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {EXAMPLE_QUERIES.find((q) => q.id === selectedId)?.description}
        </Typography>
      )}
    </Box>
  );
};

export default ExampleQueries;

