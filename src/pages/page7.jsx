import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  TextField,
  CardMedia,
  Fade,
} from '@mui/material';
import { useUser } from '../context/UserContext';
import axios from 'axios';


import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const Page7 = () => {
 
  const [testPapers, setTestPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { authState } = useUser();

 
useEffect(() => {
    
  const fetchTestPapers = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = authState.accessToken;
      const response = await axios.get('/api/testpapers', {
        headers: { 'Authorization': token }
      });
      setTestPapers(response.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch test papers.");
    } finally {
      setLoading(false);
    }
  };

  
  if (authState && authState.accessToken) {
    
    fetchTestPapers();
  } else if (authState === null) {
    
    setError("You must be logged in to view test papers.");
    setLoading(false);
  }
  

}, [authState]);
  
 
  const handleTestSelect = (paperId) => {
   navigate(`/page2/${paperId}`);
  };

  
  const filteredPapers = testPapers.filter(paper =>
    paper.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4, px: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: 'grey.100', 
      minHeight: '100vh', 
      width: '99vw',
      overflowX: 'hidden'
    }}>
      
      <Box sx={{ 
        py: { xs: 3, md: 5 },
        px: { xs: 2, sm: 3, md: 4, lg: 6 } 
      }}>
       
        <Box sx={{ 
          textAlign: 'center', 
          mb: 5,
          width: '100%'
        }}>
          <Typography variant="h3" component="h1" fontWeight="700" gutterBottom>
           
            Brought to you by GradePlus
          </Typography>
          <Typography variant="h6" color="text.secondary">
            
             Available Tests
            
          </Typography>
          <Typography variant="h7" color="text.secondary">
            Choose a test to begin and challenge your knowledge
            
          </Typography>
        </Box>

       
        <Box sx={{ 
          mb: 5,
          width: '100%'
        }}>
          <TextField
            fullWidth
            label="Search for a test..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              bgcolor: 'white',
              maxWidth: '100%' 
            }}
          />
        </Box>

        
        <Box sx={{ 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {filteredPapers.length > 0 ? (
            filteredPapers.map((paper, index) => (
              <Fade in={true} timeout={300 + index * 100} key={paper.id}>
                <Card
                  onClick={() => handleTestSelect(paper.id)}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: { xs: '100%', md: 250 },
                      height: 180,
                      objectFit: 'cover'
                    }}
                    image={paper.coverImage || `https://placehold.co/400x300/e0e0e0/ffffff?text=${encodeURIComponent(paper.name)}`}
                    alt={`${paper.name} cover image`}
                  />
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flexGrow: 1, 
                    p: 3 
                  }}>
                    <CardContent sx={{ flexGrow: 1, p: 0 }}>
                      <Typography variant="h6" component="h2" fontWeight="600" gutterBottom>
                        {paper.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {paper.summary}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <SchoolIcon fontSize="small" sx={{ mr: 1.5 }} />
                          <Typography variant="body2">Created by: {paper.creator}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1.5 }} />
                          <Typography variant="body2">{paper.duration} minutes</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <HelpOutlineIcon fontSize="small" sx={{ mr: 1.5 }} />
                          <Typography variant="body2">
                            {paper.questions > 0 ? `${paper.questions} questions` : 'Questions not specified'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <Box sx={{ 
                      pt: 2, 
                      mt: 'auto', 
                      alignSelf: { xs: 'stretch', md: 'flex-end' }
                    }}>
                      <Button variant="contained" color="primary" size="large">
                        Start Test
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Fade>
            ))
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              width: '100%'
            }}>
              <Typography variant="h6" color="text.secondary">
                No tests found matching your search.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Page7;