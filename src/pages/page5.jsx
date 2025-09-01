import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";
import Header2 from "../component/header2";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Stack,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
} from "@mui/material";
import { ArrowBack, ArrowForward, CheckCircleOutline, CancelOutlined, Lens } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const API_BASE_URL = "https://test.iblib.com";

const theme = createTheme({
  palette: {
    primary: { main: "#2196F3" },
    secondary: { main: "#007bff" },
    error: { main: "#f44336" },
    success: { main: "#4CAF50" },
  },
});

// #region Styled Components
const StyledContainer = styled(Box)(({ theme }) => ({ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: theme.palette.grey[100] }));
const MainContainer = styled(Box)(({ theme }) => ({ display: "flex", flexGrow: 1, [theme.breakpoints.down("md")]: { flexDirection: "column" } }));
const LeftPanel = styled(Box)(({ theme }) => ({ width: "1130px", flexShrink: 0, backgroundColor: theme.palette.background.paper, borderRight: `1px solid ${theme.palette.divider}`, display: "flex", flexDirection: "column", [theme.breakpoints.down("md")]: { width: "100%", borderRight: "none" } }));
const ScrollableContent = styled(Box)(({ theme }) => ({ flexGrow: 1, overflowY: "auto", padding: theme.spacing(3), paddingBottom: "80px" }));
const BottomNav = styled(Box)(({ theme }) => ({ position: "sticky", bottom: 0, backgroundColor: theme.palette.background.paper, padding: theme.spacing(1.5, 3), borderTop: `1px solid ${theme.palette.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }));
const RightSidebar = styled(Box)(({ theme }) => ({ width: "100%", backgroundColor: theme.palette.background.paper, display: "flex", flexDirection: "column", overflowY: "auto", [theme.breakpoints.down("md")]: { display: "none" } }));
const QuestionNumBox = styled(Box, { shouldForwardProp: (prop) => prop !== "$current" })(({ theme, status, $current }) => ({ width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${theme.palette.divider}`, borderRadius: "4px", fontWeight: 500, cursor: "pointer", backgroundColor: status === "correct" ? theme.palette.success.main : status === "incorrect" ? theme.palette.error.main : theme.palette.grey[200], color: status === "correct" || status === "incorrect" ? theme.palette.common.white : theme.palette.text.primary, ...($current && { border: `2px solid ${theme.palette.primary.main}` }) }));
// #endregion

// #region Helper Functions and Components
const processHTMLContent = (html) => {
  if (!html) return { text: "", image: null };
  const imgMatch = html.match(/<img[^>]+src=["']([^"'>]+)["']/i);
  const image = imgMatch ? imgMatch[1] : null;
  const text = html.replace(/<img[^>]*>/gi, "").replace(/<[^>]+>/g, "").trim();
  return { text, image };
};

const parseSections = (sectionsString, totalQuestions = 0) => {
  if (!sectionsString) return [];
  try {
    return sectionsString.split("@@@").map((sectionStr) => {
      const [name, s, e] = sectionStr.split("#@#");
      return {
        name: name || "Section",
        start: parseInt(s, 10) || 1,
        end: parseInt(e, 10) || totalQuestions || 0,
      };
    });
  } catch {
    return [];
  }
};

const QuestionContentResults = ({ question }) => {
  if (!question) return null;

  const isUserAnswer = (index) => {
    if (question.userAnswer === null || question.userAnswer === undefined) {
      return false;
    }
    return Array.isArray(question.userAnswer)
      ? question.userAnswer.includes(index)
      : Number(question.userAnswer) === index;
  };

  const isCorrectAnswer = (index) => Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(index) : Number(question.correctAnswer) === index;

  const optionsToDisplay = question.kind === 'single' 
    ? question.options.slice(0, 4) 
    : question.options;

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          Question #{question.questionNumber}
        </Typography>
        {question.isAttempted ? (
          question.isCorrect ? (
            <Chip icon={<CheckCircleOutline />} label="Correct" color="success" variant="outlined" size="small" />
          ) : (
            <Chip icon={<CancelOutlined />} label="Incorrect" color="error" variant="outlined" size="small" />
          )
        ) : (
          <Chip label="Not Answered" variant="outlined" size="small" />
        )}
      </Box>
      <Divider sx={{ my: 1.5 }} />

      <Box sx={{ my: 2, lineHeight: 1.8 }}>
        <Typography>{question.questionText}</Typography>
        {question.questionImage && <Box sx={{ mt: 2 }}><img src={question.questionImage.startsWith('http') ? question.questionImage : `${API_BASE_URL}${question.questionImage}`} alt="question" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }} /></Box>}
      </Box>

      {question.kind === 'text' ? (
        <Stack spacing={2} mt={3}>
          <TextField label="Your Answer" value={question.userAnswer || ''} fullWidth InputProps={{ readOnly: true }} color={question.isCorrect ? "success" : "error"} focused />
          <TextField label="Correct Answer" value={question.correctAnswer || 'N/A'} fullWidth InputProps={{ readOnly: true }} color="success" focused />
        </Stack>
      ) : (
        <Stack spacing={1} mt={2}>
          {optionsToDisplay.map((opt, index) => {
            if (question.kind === 'multiple' && !opt.text && !opt.image) {
              return null;
            }

            const userSelected = isUserAnswer(index);
            const isCorrect = isCorrectAnswer(index);
            let controlColor = 'default';
            let textColor = 'text.primary';

            if (isCorrect) {
              controlColor = 'success';
              textColor = 'success.main';
            } else if (userSelected) {
              controlColor = 'error';
              textColor = 'error.main';
            }

            const ControlComponent = question.kind === 'multiple' ? Checkbox : Radio;

            return (
              <FormControlLabel
                key={index}
                sx={{ 
                    pointerEvents: 'none', 
                    ml: 0.1, 
                    alignItems: 'flex-start',
                    '& .MuiFormControlLabel-label': { 
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        pt: 0.5
                    }
                }}
                control={
                  <ControlComponent
                    checked={userSelected}
                    color={controlColor}
                    sx={{ pt: 1 }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 0.5 }}>
                    <Typography sx={{ color: textColor, lineHeight: '1.2' }}>{opt.text}</Typography>
                    {opt.image && (
                      <img
                        src={opt.image.startsWith('http') ? opt.image : `${API_BASE_URL}${opt.image}`}
                        alt={`option ${index + 1}`}
                        style={{ maxHeight: '80px', maxWidth: '120px', borderRadius: '4px' }}
                      />
                    )}
                  </Box>
                }
              />
            );
          })}
        </Stack>
      )}

      {question.explanation && question.explanation.trim() && question.explanation.trim() !== '<br>' && (
        <Box sx={{ mt: 3, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
            Explanation:
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {processHTMLContent(question.explanation).text}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

const ResultStatusLegend = () => (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Legend</Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Lens sx={{ color: "success.main" }} fontSize="small" /><Typography variant="body2">Correct</Typography></Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Lens sx={{ color: "error.main" }} fontSize="small" /><Typography variant="body2">Incorrect</Typography></Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Lens sx={{ color: "grey.400" }} fontSize="small" /><Typography variant="body2">Not Answered</Typography></Box>
      </Stack>
    </Box>
);
// #endregion

const Page5 = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const { authState } = useUser();

  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const questionStatus = useMemo(() => {
    if (!questions || questions.length === 0) {
      return {};
    }
    // Translate the page5 status ('correct') into a status Header2 understands ('answered')
    return questions.reduce((acc, q) => {
      let headerStatus = 'not-visited'; // Default gray color
      
      if (q.status === 'correct') {
        headerStatus = 'answered'; // This will make the box GREEN in Header2
      } else if (q.status === 'incorrect') {
        headerStatus = 'not-answered'; // This will make the box RED in Header2
      }
      
      acc[q.id] = headerStatus;
      return acc;
    }, {});
  }, [questions]);

  const fetchData = useCallback(async (token) => {
    setLoading(true);
    setError(null);
    try {
      const [resultsRes, paperRes] = await Promise.all([
        axios.get(`/api/questions/${paperId}?isCompleted=1`, { headers: { Authorization: token } }),
        axios.get(`/api/testpaper/${paperId}`, { headers: { Authorization: token } })
      ]);
      
      const rawQuestions = Array.isArray(resultsRes.data) ? resultsRes.data : [];
      const paperDetails = paperRes.data || {};
      
      const parsedSections = parseSections(paperDetails.sections, rawQuestions.length);
      setSections(parsedSections);
      
      if (rawQuestions.length === 0) {
        setQuestions([]);
        return;
      }
      
      const reviewQuestions = rawQuestions.map((q, index) => {
        const { text: questionText, image: questionImage } = processHTMLContent(q.question);
        const options = (q.options || []).map(opt => processHTMLContent(opt));
        const kind = q.questionType === 'checkbox' ? 'multiple' : (q.questionType === 'radio' ? 'single' : 'text');
        
        let userAnswer = null;
        if (q.selectedAnswers && q.selectedAnswers.length > 0 && q.selectedAnswers[0] !== "") {
            if (kind === 'multiple') {
                if (q.selectedAnswers.length > 1) userAnswer = q.selectedAnswers.map(Number);
                else userAnswer = q.selectedAnswers[0].split(',').map(Number);
            } else {
                const ansString = q.selectedAnswers[0];
                userAnswer = kind === 'radio' ? Number(ansString) : ansString;
            }
        }
        
        let correctAnswer = null;
        const correctAnswersFromApi = (q.answers || []).filter(ans => ans && ans.trim());
        if (correctAnswersFromApi.length > 0) {
            if (kind === 'text') {
                correctAnswer = processHTMLContent(correctAnswersFromApi[0]).text;
            } else if (kind === 'multiple') {
                correctAnswer = correctAnswersFromApi.map(ans => options.findIndex(opt => opt.text === processHTMLContent(ans).text)).filter(idx => idx !== -1);
            } else {
                const idx = options.findIndex(opt => opt.text === processHTMLContent(correctAnswersFromApi[0]).text);
                if (idx !== -1) correctAnswer = idx;
            }
        }
        
        const isAttempted = userAnswer !== null;
        let isCorrect = false;
        if (isAttempted) {
          if (kind === "multiple") {
            const userSet = new Set(userAnswer);
            const correctSet = new Set(correctAnswer);
            isCorrect = userSet.size === correctSet.size && [...userSet].every(ans => correctSet.has(ans));
          } else if (kind === 'text') {
            isCorrect = String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
          } else {
            isCorrect = Number(userAnswer) === Number(correctAnswer);
          }
        }

        return { 
            ...q, questionText, questionImage, options, kind, userAnswer, correctAnswer, isAttempted, isCorrect,
            questionNumber: index + 1,
            status: isAttempted ? (isCorrect ? 'correct' : 'incorrect') : 'not-answered'
        };
      });
      setQuestions(reviewQuestions);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [paperId]);

  useEffect(() => {
    if (authState?.accessToken) {
      fetchData(authState.accessToken);
    } else if (authState === null) {
      setError('Please login to view results');
      setLoading(false);
    }
  }, [authState, paperId, fetchData]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 2, mt: 4 }}><Alert severity="error">{error}</Alert></Box>;

  const currentQuestion = questions[currentQuestionIndex];
  const currentSectionName = sections.find(s => currentQuestionIndex + 1 >= s.start && currentQuestionIndex + 1 <= s.end)?.name;

  return (
    <ThemeProvider theme={theme}>
      <StyledContainer>
        <Header2 
            sections={sections} 
            currentSectionName={currentSectionName}
            onSectionClick={(start) => setCurrentQuestionIndex(start - 1)}
            authState={authState}
            questions={questions}
            questionStatus={questionStatus}
            currentQuestionNumber={currentQuestionIndex + 1}
            onQuestionSelect={(questionNumber) => setCurrentQuestionIndex(questionNumber - 1)}
        />
        <MainContainer>
          <LeftPanel>
            <ScrollableContent>
              {questions.length > 0 && currentQuestion ? (
                 <QuestionContentResults question={currentQuestion} />
              ) : (
                <Alert severity="info">No questions found for this test.</Alert>
              )}
            </ScrollableContent>
            <BottomNav>
              <Button variant="outlined" startIcon={<ArrowBack />} disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(i => i - 1)}>Previous</Button>
              <Button variant="contained" color="primary" onClick={() => navigate('/select-test')}>Back to Tests</Button>
              <Button variant="outlined" endIcon={<ArrowForward />} disabled={currentQuestionIndex >= questions.length - 1} onClick={() => setCurrentQuestionIndex(i => i + 1)}>Next</Button>
            </BottomNav>
          </LeftPanel>
          <RightSidebar>
            <Box sx={{ p:2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Avatar src={authState?.user?.image} /><Typography fontWeight="bold">{authState?.user?.name}</Typography>
            </Box>
            <ResultStatusLegend />
            <Box sx={{ p:2, flexGrow:1, overflowY: 'auto' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Question Palette</Typography>
              <Grid container spacing={1}>
                {questions.map((q, idx) => (
                  <Grid item key={q.id ?? q.qid ?? idx}>
                    <QuestionNumBox status={q.status} $current={currentQuestionIndex === idx} onClick={() => setCurrentQuestionIndex(idx)}>
                        {idx + 1}
                    </QuestionNumBox>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </RightSidebar>
        </MainContainer>
      </StyledContainer>
    </ThemeProvider>
  );
};

export default Page5;