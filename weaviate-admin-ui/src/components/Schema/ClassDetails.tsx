import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ClassSchema } from '../../types';
import PropertyTable from './PropertyTable';
import { formatNumber } from '../../utils/formatters';

interface ClassDetailsProps {
  classSchema: ClassSchema;
}

const ClassDetails: React.FC<ClassDetailsProps> = ({ classSchema }) => {
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {classSchema.name}
          </Typography>
          
          {classSchema.description && (
            <Typography variant="body2" color="text.secondary" paragraph>
              {classSchema.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${formatNumber(classSchema.objectCount || 0)} objects`}
              color="primary"
              size="small"
            />
            <Chip
              label={`${classSchema.properties.length} properties`}
              color="default"
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Properties
      </Typography>
      <PropertyTable properties={classSchema.properties} />

      {classSchema.vectorConfig && (
        <Box sx={{ mt: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Vector Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {classSchema.vectorConfig.vectorizer && (
                  <Typography variant="body2">
                    <strong>Vectorizer:</strong> {classSchema.vectorConfig.vectorizer}
                  </Typography>
                )}
                
                {classSchema.vectorConfig.vectorIndexConfig && (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      <strong>Vector Index Config:</strong>
                    </Typography>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: '12px', 
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px'
                    }}>
                      {JSON.stringify(classSchema.vectorConfig.vectorIndexConfig, null, 2)}
                    </pre>
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Box>
  );
};

export default ClassDetails;

