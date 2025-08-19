import { useUser } from '../context/UserContext';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Radio, FormControlLabel, Select, MenuItem, IconButton, Grid, Paper, Modal, Avatar, Tooltip, CircularProgress, Alert
} from '@mui/material';
import {
  Menu as MenuIcon, Language, Report, Bolt,
  Timer, HourglassEmpty, Block, ArrowBack,
  Eject, ArrowForward
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Header2 from '../component/Header2';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';


const theme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
    },
    secondary: {
      main: '#007bff',
    },
    error: {
      main: '#f44336',
    },
    success: {
      main: '#4CAF50',
    },
    warning: {
      main: '#FF9800',
    },
    info: {
      main: '#9c27b0',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});


const StyledContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: theme.palette.grey[100],
  overflow: 'hidden',
}));


const BottomNav = styled(Paper)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.grey[100],
  borderTop: `1px solid ${theme.palette.divider}`,
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100%',
  zIndex: 10,
  height: '70px',
  [theme.breakpoints.down('md')]: {
    height: '60px',
    padding: theme.spacing(1),
  },
}));


const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexGrow: 1,
  height: 'calc(100vh - 70px)',
  marginBottom: '70px',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    height: '100vh',
    marginBottom: 0,
  },
}));


const LeftPanel = styled(Box)(({ theme }) => ({
  width: '1110px',
  flexShrink: 0,
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  position: 'relative',
  zIndex: 1,
  [theme.breakpoints.down('md')]: {
    flex: 1,
    width: '100%',
    borderRight: 'none',
  },
}));


const ScrollableContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  padding: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    paddingBottom: '60px',
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
  },
}));


const RightSidebar = styled(Box)(({ theme, open }) => ({
  width: "100%",

  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  [theme.breakpoints.down('md')]: {
    position: 'fixed',
    top: 0,
    right: open ? 0 : '-280px',
    width: '260px',
    height: '100%',
    zIndex: 102,
    float: 'right',
    boxShadow: theme.shadows[3],
    borderLeft: `1px solid ${theme.palette.divider}`,
    transition: 'right 0.1s ease-in-out',
  },
}));


const SidebarOverlay = styled(Box)(({ open }) => ({
  display: open ? 'flex' : 'none',
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 101,
  opacity: open ? 1 : 0,
  visibility: open ? 'visible' : 'hidden',
  transition: 'opacity 0.3s ease-in-out',
}));


const QuestionNumBox = styled(Box)(({ theme, status, $current }) => ({
  width: '38px',
  height: '38px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '4px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: status === 'answered' ? theme.palette.success.main :
    status === 'marked' ? theme.palette.info.main :
      status === 'not-visited' ? theme.palette.grey[300] :
        status === 'answered-marked' ? theme.palette.warning.main :
          status === 'not-answered' ? theme.palette.error.main :
            status === 'partially-answered' ? theme.palette.primary.main :
              theme.palette.grey[200],
  color: ['answered', 'marked', 'answered-marked', 'not-answered', 'partially-answered'].includes(status) ?
    theme.palette.common.white : theme.palette.text.primary,
  borderColor: status === 'answered' ? theme.palette.success.main :
    status === 'marked' ? theme.palette.info.main :
      status === 'not-visited' ? theme.palette.grey[300] :
        status === 'answered-marked' ? theme.palette.warning.main :
          status === 'not-answered' ? theme.palette.error.main :
            status === 'partially-answered' ? theme.palette.primary.main :
              theme.palette.divider,
  ...($current && { // <-- Fix warning
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 5px rgba(33, 150, 243, 0.5)`,
  }),
  [theme.breakpoints.down('md')]: {
    width: '35px',
    height: '35px',
    fontSize: '13px',
  },
}));


const IndicatorItem = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[200],
  padding: theme.spacing(1, 0.5),
  borderRadius: "4px",
  fontSize: "12px",
  color: theme.palette.text.secondary,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  minHeight: "60px",
  flex: "1 1 calc(50% - 4px)",
  maxWidth: "calc(50% - 4px)",
  textAlign: "center",
  fontWeight: "normal",
  "& .MuiSvgIcon-root": {
    color: theme.palette.text.secondary,
    fontSize: "18px",
  },
  [theme.breakpoints.down("md")]: {
    minHeight: "50px",
    padding: "6px 4px",
  },
}));


const PopupMenu = styled(Box)(({ theme, open }) => ({
  display: open ? 'flex' : 'none',
  position: 'absolute',
  bottom: '60px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[4],
  borderRadius: '8px',
  padding: theme.spacing(2),
  minWidth: '200px',
  zIndex: 1001,
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));


const MenuButton = styled(Button)(({ theme, colorvariant }) => ({
  padding: theme.spacing(1.5, 2.5),
  fontSize: '16px',
  color: theme.palette.common.white,
  borderRadius: '5px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  transition: 'background-color 0.3s, transform 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
  },
  ...(colorvariant === 'red' && {
    background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
    '&:hover': {
      background: 'linear-gradient(135deg, #e55a5a, #e57c49)',
    },
  }),
  ...(colorvariant === 'blue' && {
    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    '&:hover': {
      background: 'linear-gradient(135deg, #4398e0, #00d4e0)',
    },
  }),
  ...(colorvariant === 'green' && {
    background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
    '&:hover': {
      background: 'linear-gradient(135deg, #27ae60, #219653)',
    },
  }),
  ...(colorvariant === 'yellow' && {
    background: 'linear-gradient(135deg, #f1c40f, #f39c12)',
    '&:hover': {
      background: 'linear-gradient(135deg, #d4ac0d, #d68910)',
    },
  }),
  ...(colorvariant === 'simple' && {
    background: theme.palette.primary.light,
    color: theme.palette.primary.dark,
    textTransform: 'none',
    fontWeight: 'normal',
    '&:hover': {
      background: theme.palette.primary.light,
    },
  }),
  ...(colorvariant === 'simpleRed' && {
    background: theme.palette.error.main,
    color: theme.palette.common.white,
    textTransform: 'none',
    fontWeight: 'normal',
    '&:hover': {
      background: theme.palette.error.dark,
    },
  }),
}));


const Page3 = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionStatus, setQuestionStatus] = useState({});
  const { authState } = useUser();
  const handleCloseErrorModal = () => setError(null);
  const [sections, setSections] = useState([]);
  const [currentSectionName, setCurrentSectionName] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  
  // ✅ 1. Add state for the timer color
  const [timerColor, setTimerColor] = useState('inherit');

  const confirmSubmit = useCallback(() => {
    setSubmitModalOpen(false);
    console.log("Submitting test...");
    alert('Test has been submitted!');
    navigate('/Page4');
  }, [navigate]);


  useEffect(() => {
    if (timeLeft === 0 && !loading && questions.length > 0) {
      console.log("Time is up. Auto-submitting...");
      confirmSubmit();
    }
  }, [timeLeft, loading, questions, confirmSubmit]);


  useEffect(() => {
    if (!isPaused && timeLeft > 0 && !loading) {
      const timerInterval = setInterval(() => {
        setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [timeLeft, isPaused, loading]);


  // ✅ 2. Add a useEffect to update the color based on timeLeft
  useEffect(() => {
    if (timeLeft <= 600) { // 10 minutes in seconds
      setTimerColor('error.main'); // Red color
    } else if (timeLeft <= 1200) { // 20 minutes in seconds
      setTimerColor('warning.main'); // Orange color
    } else {
      setTimerColor('inherit'); // Default color
    }
  }, [timeLeft]);


  const parseSections = (sectionsString) => {
    if (!sectionsString) return [];
    try {
      return sectionsString.split('@@@').map(sectionStr => {
        const parts = sectionStr.split('#@#');
        return {
          name: parts[0],
          start: parseInt(parts[1], 10),
          end: parseInt(parts[2], 10),
        };
      });
    } catch (e) {
      console.error("Failed to parse sections string:", e);
      return [];
    }
  };


  const navigateToQuestion = useCallback((index) => {
    if (index < 0 || index >= questions.length || !questions[index]) return;
    setCurrentQuestionIndex(prevIndex => {
      const prevQuestionId = questions[prevIndex]?.id;
      const newQuestionId = questions[index]?.id;
      setQuestionStatus(prev => {
        const newStatus = { ...prev };
        if (prevQuestionId !== undefined) {
          if (answers[prevQuestionId]) {
            newStatus[prevQuestionId] = newStatus[prevQuestionId] === 'marked' ? 'answered-marked' : 'answered';
          } else {
            newStatus[prevQuestionId] = newStatus[prevQuestionId] === 'marked' ? 'marked' : 'not-answered';
          }
        }
        newStatus[newQuestionId] = 'current';
        return newStatus;
      });
      return index;
    });
  }, [questions, answers]);


  const handleSectionClick = (startQuestionNumber) => {
    navigateToQuestion(startQuestionNumber - 1);
  };

  useEffect(() => {
    const fetchAllData = async (token) => {
      setLoading(true);
      setError(null);
      setQuestions([]);
      setSections([]);

      try {

        const testPaperRes = await axios.get(`/api/testpaper/${paperId}`, { headers: { 'Authorization': token } });
        const testPaperData = testPaperRes.data;

        if (testPaperData) {
          let parsedSections;
          if (testPaperData.sections) {
            parsedSections = parseSections(testPaperData.sections);
          } else {

            parsedSections = [{ name: 'All Questions', start: 1, end: testPaperData.questions }];
          }
          setSections(parsedSections);
          if (testPaperData.duration) {
            setTimeLeft(testPaperData.duration * 60);
          }
        }
        
        const questionsRes = await axios.get(
          `/api/questions/${paperId}`,
          { headers: { 'Authorization': token } }
        );

        const possibleData = questionsRes.data?.data || questionsRes.data;
        if (!Array.isArray(possibleData)) {
          throw new Error("Invalid questions data format from server.");
        }
        const fetchedQuestions = possibleData.map(q => ({
          ...q,
          question: stripHTML(q.question),
          options: (q.options || []).map(opt => stripHTML(opt)),
        }));
        setQuestions(fetchedQuestions);

        // --- Initialize Status ---
        const initialStatus = {};
        fetchedQuestions.forEach((q, index) => {
          initialStatus[q.id || index] = 'not-visited';
        });
        if (fetchedQuestions.length > 0) {
          const firstQuestionId = fetchedQuestions[0].id || 0;
          initialStatus[firstQuestionId] = 'current';
        }
        setQuestionStatus(initialStatus);

      } catch (e) {
        const errorMessage = e.response?.data?.message || e.message || "Failed to fetch test data.";
        setError(errorMessage);
        console.error("Failed to fetch data:", e);
      } finally {
        setLoading(false);
      }
    };

    if (authState.accessToken && paperId) {
      fetchAllData(authState.accessToken);
    } else if (!authState.accessToken) {
      setLoading(false);
      setError("Authentication required. Please log in.");
    }
  }, [authState.accessToken, paperId]);


  const stripHTML = (html) => {
    if (!html) return '';
    
    html = html.replace(/<img[^>]*>/gi, '');
    return html.replace(/<\/?[^>]+(>|$)/g, '').trim();
  };
  

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };


  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };


  useEffect(() => {
    const handleClickOutside = (event) => {
      const menu = document.getElementById('popupMenu');
      const popupBtn = document.querySelector('.popup-btn');
      if (menu && popupBtn && !menu.contains(event.target) && !popupBtn.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);


  const handleAnswerSelect = useCallback((questionId, answer) => {
    if (!questionId) return;

    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));

    setQuestionStatus(prev => {
      const newStatus = { ...prev };
      if (newStatus[questionId] === 'current') {
        newStatus[questionId] = 'answered';
      } else if (newStatus[questionId] === 'marked') {
        newStatus[questionId] = 'answered-marked';
      } else if (newStatus[questionId] === 'not-visited' || newStatus[questionId] === 'not-answered') {
        newStatus[questionId] = 'answered';
      }
      return newStatus;
    });
  }, []);

  const currentQuestion = questions[currentQuestionIndex];


  const markForReview = useCallback(() => {
    if (!currentQuestion) return;
    setQuestionStatus(prev => {
      const newStatus = { ...prev };
      const currentId = currentQuestion.id;
      if (answers[currentId]) {
        newStatus[currentId] = 'answered-marked';
      } else {
        newStatus[currentId] = 'marked';
      }
      return newStatus;
    });
  }, [currentQuestion, answers]);


  const clearResponse = useCallback(() => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion.id];
    setAnswers(newAnswers);
    setQuestionStatus(prev => {
      const newStatus = { ...prev };
      if (newStatus[currentQuestion.id] === 'answered-marked' || newStatus[currentQuestion.id] === 'marked') {
        newStatus[currentQuestion.id] = 'marked';
      } else {
        newStatus[currentQuestion.id] = 'not-answered';
      }
      return newStatus;
    });
  }, [currentQuestion, answers]);


  const saveAndNext = useCallback(() => {
    if (!currentQuestion) return;
    setQuestionStatus(prev => {
      const newStatus = { ...prev };
      const currentId = currentQuestion.id;
      if (!answers[currentId] && newStatus[currentId] === 'current') {
        newStatus[currentId] = 'not-answered';
      }
      if (newStatus[currentId] === 'marked' && answers[currentId]) {
        newStatus[currentId] = 'answered-marked';
      } else if (newStatus[currentId] === 'answered-marked' && !answers[currentId]) {
        newStatus[currentId] = 'marked';
      }
      return newStatus;
    });
    navigateToQuestion(currentQuestionIndex + 1);
  }, [currentQuestion, answers, currentQuestionIndex, navigateToQuestion]);


  useEffect(() => {
    if (sections.length > 0) {

      const currentQuestionNumber = currentQuestionIndex + 1;

      const foundSection = sections.find(
        (section) =>
          currentQuestionNumber >= section.start && currentQuestionNumber <= section.end
      );

      if (foundSection) {
        setCurrentSectionName(foundSection.name);
      }
    }
  }, [currentQuestionIndex, sections]);
  const markAndNext = useCallback(() => {
    markForReview();
    navigateToQuestion(currentQuestionIndex + 1);
  }, [markForReview, navigateToQuestion, currentQuestionIndex]);


  const handleSubmitTest = () => {
    setSubmitModalOpen(true);
  };




  const renderUserProfile = () => (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pb: 2,
      borderBottom: `1px solid ${theme.palette.divider}`,
    }}>
      <Avatar
        src={authState.user?.image}
        alt={authState.user?.name}
        sx={{
          width: 60,
          height: 60,
          bgcolor: 'primary.main',
          mb: 1,
          fontSize: '24px',
          fontWeight: 'bold',
        }}
      >
        {!authState.user?.image && authState.user?.name?.[0]}
      </Avatar>
      <Typography variant="subtitle1" fontWeight={600}>
        {authState.user?.name || 'Guest User'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {authState.user?.school || ''}
      </Typography>
    </Box>
  );


  const renderQuestionStatusLegend = () => (
    <Box sx={{
      borderTop: `1px solid ${theme.palette.divider}`,
      borderBottom: `1px solid ${theme.palette.divider}`,
      pt: 2,
      pb: 2,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      gap: 1,
    }}>
      {[
        { label: 'Answered', color: 'success.main' },
        { label: 'Marked for review', color: 'info.main' },
        { label: 'Not Visited', color: 'grey.300' },
        { label: 'Answer&Marked', color: 'warning.main' },
        { label: 'Not Answered', color: 'error.main' },
        { label: 'Partially Answered', color: 'primary.main' },
      ].map((item, idx) => (
        <Box key={idx} sx={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '13px',
          flexBasis: 'calc(50% - 8px)',
          maxWidth: 'calc(50% - 8px)',
          whiteSpace: 'nowrap',
        }}>
          <Box sx={{
            width: 16,
            height: 16,
            borderRadius: '3px',
            mr: 1,
            backgroundColor: item.color,
            border: `1px solid ${theme.palette.divider}`,
          }} />
          {item.label}
        </Box>
      ))}
    </Box>
  );


  const renderQuestionPalette = () => (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Question Palette
      </Typography>
      <Grid container spacing={1}>
        {questions.map((q, index) => (
          <Grid item xs={2} key={q.id || index} sx={{ minWidth: 0 }}>
            <QuestionNumBox
              $current={currentQuestionIndex === index}
              status={questionStatus[q.id || index] || 'not-visited'}
              onClick={() => navigateToQuestion(index)}
            >
              {index + 1}
            </QuestionNumBox>
          </Grid>
        ))}
      </Grid>
    </Box>
  );


  const renderSpeedIndicators = () => (
    <Box sx={{
      borderTop: `1px solid ${theme.palette.divider}`,
      pt: 2,
    }}>
      <Typography variant="subtitle2" gutterBottom>
        Speed Indicators
      </Typography>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 1,
      }}>
        {[
          { icon: <Bolt fontSize="small" />, label: 'Fast' },
          { icon: <Timer fontSize="small" />, label: 'Medium' },
          { icon: <HourglassEmpty fontSize="small" />, label: 'Slow' },
          { icon: <Block fontSize="small" />, label: 'Not Rated' },
        ].map((item, index) => (
          <IndicatorItem key={index}>
            {item.icon}
            <span>{item.label}</span>
          </IndicatorItem>
        ))}
      </Box>
    </Box>
  );


  const renderSidebarButtons = () => (
    <Box sx={{
      mt: 'auto',
      borderTop: `1px solid ${theme.palette.divider}`,
      pt: 2,
      pb: 4,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
    }}>
      <Button variant="contained" color="warning" fullWidth>
        View Question Paper
      </Button>
      <Button
        variant="contained"
        sx={{
          backgroundColor: 'grey.300',
          color: 'text.primary',
          '&:hover': { backgroundColor: 'grey.400' },
        }}
        fullWidth
      >
        Instructions
      </Button>
    </Box>
  );


  const modalContentStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 450 },
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    textAlign: 'center',
    outline: 'none',
  };


  return (
    <ThemeProvider theme={theme}>
      <StyledContainer>
        <Header2
          sections={sections}
          currentSectionName={currentSectionName}
          onSectionClick={handleSectionClick}
          timeDisplay={formatTime(timeLeft)}
          timerColor={timerColor} // ✅ 3. Pass the new prop here
          isPaused={isPaused}
          onPauseToggle={() => setIsPaused(prev => !prev)}
        />
        <MainContainer>
          <LeftPanel>
            <ScrollableContent>
              {!loading && !error && questions.length > 0 && currentQuestion ? (
                <Box key={currentQuestion.id} sx={{ mb: 5 }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    pb: 1,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    flexWrap: 'wrap',
                    gap: 1,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      {currentSectionName && (
                        <Typography variant="h5" color="text.secondary">
                          {currentSectionName}
                        </Typography>
                      )}
                      <Typography variant="h6" fontWeight={600}>
                        Question #{currentQuestionIndex + 1}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      {currentQuestion.marks && (
                        <Typography variant="body2" color="text.secondary">
                          Marks: <Typography component="span" color="success.main" fontWeight="bold">
                            +{currentQuestion.marks.positive}
                          </Typography> / <Typography component="span" color="error.main" fontWeight="bold">
                            -{currentQuestion.marks.negative}
                          </Typography>
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Language fontSize="small" color="action" />
                        <Select
                          size="small"
                          defaultValue="English"
                          sx={{ fontSize: '13px', minWidth: '100px' }}
                        >
                          <MenuItem value="English">English</MenuItem>
                          <MenuItem value="Hindi">Hindi</MenuItem>
                        </Select>
                      </Box>

                      <Button
                        size="small"
                        color="primary"
                        sx={{ fontSize: '13px', minWidth: 0 }}
                        startIcon={<Report fontSize="small" />}
                      >
                        Report
                      </Button>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Type: {currentQuestion.type || 'MCQ'}
                    </Typography>

                    <Typography
                      variant="body1"
                      paragraph
                      sx={{ lineHeight: 1.8 }}
                    >
                      {currentQuestion.question}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      {currentQuestion.options && currentQuestion.options.slice(0, 4).map((option, idx) => (
                        <FormControlLabel
                          key={idx}
                          control={
                            <Radio
                              checked={answers[currentQuestion.id] === option}
                              onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                              color="primary"
                              size="small"
                            />
                          }
                          label={option}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 1,
                            '& .MuiTypography-root': { fontSize: '15px' },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  flexDirection: 'column',
                  textAlign: 'center',
                  color: 'text.secondary',
                }}>
                  {loading && <CircularProgress size={40} />}
                  {!loading && error && (
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      {error}
                    </Typography>
                  )}
                  {!loading && !error && questions.length === 0 && (
                    <Typography variant="h6" sx={{ mt: 2, ml: 30 }}>
                      Unable to fetch the questions. No questions available.
                    </Typography>
                  )}
                </Box>
              )}
            </ScrollableContent>
          </LeftPanel>

          <SidebarOverlay open={sidebarOpen} onClick={toggleSidebar} />
          <RightSidebar open={sidebarOpen}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Typography variant="h6" fontWeight={600}>
                  Question Status
                </Typography>
                <IconButton onClick={toggleSidebar} sx={{ display: { md: 'none' } }}>
                  <ArrowBack />
                </IconButton>
              </Box>
              {renderUserProfile()}
              {renderQuestionStatusLegend()}
              {renderQuestionPalette()}
              {renderSpeedIndicators()}
            </Box>
            {renderSidebarButtons()}
          </RightSidebar>
        </MainContainer>

        <BottomNav elevation={3}>
          <Box sx={{
            display: 'flex',
            gap: 1,
            flexGrow: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              disabled={currentQuestionIndex === 0}
              onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Previous
            </Button>

            <Button
              variant="outlined"
              onClick={clearResponse}
              sx={{
                display: { xs: 'none', md: 'flex' },
                whiteSpace: 'nowrap',
              }}
            >
              Clear Response
            </Button>

            <Button
              variant="outlined"
              onClick={markAndNext}
              sx={{
                display: { xs: 'none', md: 'flex' },
                whiteSpace: 'nowrap',
              }}
            >
              Mark for review
            </Button>
          </Box>

          <Box sx={{
            position: 'relative',
            display: { xs: 'block', md: 'none' },
            mr: { xs: 1, sm: 2 },
          }}>
            <Tooltip title="Quick actions">
              <IconButton
                color="primary"
                onClick={toggleMenu}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'common.white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                  width: 48,
                  height: 48,
                  marginRight: '60px'
                }}
              >
                <Eject />
              </IconButton>
            </Tooltip>

            <PopupMenu id="popupMenu" open={menuOpen}>
              <MenuButton
                colorvariant="simpleRed"
                onClick={() => {
                  handleSubmitTest();
                  setMenuOpen(false);
                }}
              >
                Submit
              </MenuButton>
              <MenuButton
                sx={{
                  color: '#2196f3',
                  backgroundColor: '#ffffff',
                  border: '1px solid #2196f3',
                }}
                onClick={() => {
                  markForReview();
                  setMenuOpen(false);
                }}
              >
                Mark For Review
              </MenuButton>
              <MenuButton
                sx={{
                  color: '#2196f3',
                  backgroundColor: '#ffffff',
                  border: '1px solid #2196f3',
                }}
                onClick={() => {
                  clearResponse();
                  setMenuOpen(false);
                }}
              >
                Clear Response
              </MenuButton>
            </PopupMenu>
          </Box>

          <Box sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            justifyContent: { xs: 'flex-end', md: 'space-between' },
            flexGrow: { xs: 0, md: 1 }
          }}>
            <Button
              variant="contained"
              color="primary"
              onClick={saveAndNext}
              sx={{
                whiteSpace: 'nowrap',
                marginRight: '10px',
                display: { xs: 'flex', md: 'flex' }
              }}
              endIcon={<ArrowForward />}
              disabled={currentQuestionIndex === questions.length - 1 && !answers[currentQuestion?.id]}
            >
              Save & Next
            </Button>

            <Button
              variant="contained"
              color="error"
              sx={{
                display: { xs: 'none', md: 'block' },
                whiteSpace: 'nowrap',
                marginRight: '40px',
              }}
              onClick={handleSubmitTest}
            >
              Submit Test
            </Button>
          </Box>
        </BottomNav>

        <Modal
          open={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
          aria-labelledby="submit-modal-title"
          aria-describedby="submit-modal-description"
        >
          <Box sx={modalContentStyle}>
            <Typography id="submit-modal-title" variant="h6" component="h3" gutterBottom>
              Confirm Submission
            </Typography>
            <Typography id="submit-modal-description" variant="body1" color="text.secondary" paragraph>
              Are you sure you want to submit the test? You won't be able to make any changes after submission.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                color="error"
                onClick={confirmSubmit}
                sx={{ flex: 1 }}
              >
                Confirm
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSubmitModalOpen(false)}
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>

        <Modal
          open={!!error}
          onClose={handleCloseErrorModal}
          aria-labelledby="error-modal-title"
          aria-describedby="error-modal-description"
        >
          <Box sx={modalContentStyle}>
            <Alert severity="error" sx={{ width: '100%' }}>
              <Typography id="error-modal-title" variant="h6" component="h2" gutterBottom>
                Error!
              </Typography>
              <Typography id="error-modal-description" sx={{ mt: 1 }}>
                {error}
              </Typography>
              <Button
                variant="contained"
                color="error"
                onClick={handleCloseErrorModal}
                sx={{ mt: 3 }}
              >
                Dismiss
              </Button>
            </Alert>
          </Box>
        </Modal>
      </StyledContainer>
    </ThemeProvider>
  );
};

export default Page3;