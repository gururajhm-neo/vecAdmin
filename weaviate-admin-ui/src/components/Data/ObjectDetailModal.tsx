import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
} from '@mui/material';

interface ObjectDetailModalProps {
  open: boolean;
  onClose: () => void;
  object: any;
  onFindSimilar?: () => void;
}

const ObjectDetailModal: React.FC<ObjectDetailModalProps> = ({
  open,
  onClose,
  object,
  onFindSimilar,
}) => {
  if (!object) return null;

  const objectId = object.id || object._additional?.id || 'Unknown';
  const className = object.class || 'Unknown';

  // Separate properties and additional fields
  const properties = { ...object };
  delete properties.id;
  delete properties.class;
  delete properties.vector;
  delete properties._additional;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Object Details</DialogTitle>
      <DialogContent dividers>
        {/* ID and Class */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            ID:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {objectId}
          </Typography>
        </Box>

        {className !== 'Unknown' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Class:
            </Typography>
            <Typography variant="body2">{className}</Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Properties */}
        <Typography variant="h6" gutterBottom>
          Properties
        </Typography>
        <Box
          sx={{
            bgcolor: 'grey.50',
            p: 2,
            borderRadius: 1,
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(properties, null, 2)}
          </pre>
        </Box>

        {/* Additional metadata */}
        {object._additional && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Metadata
            </Typography>
            <Box
              sx={{
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 1,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(object._additional, null, 2)}
              </pre>
            </Box>
          </>
        )}

        {/* Vector info */}
        {object.vector && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Vector
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dimensions: {object.vector.length}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {onFindSimilar && (
          <Button onClick={onFindSimilar} color="primary">
            Find Similar
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ObjectDetailModal;

