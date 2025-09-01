// page 4


import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";
import Header2 from "../component/Header2";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
} from "@mui/material";
import { Replay, Analytics, ArrowBack } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#2196F3" },
    secondary: { main: "#007bff" },
    error: { main: "#f44336" },
    success: { main: "#4CAF50" },
    warning: { main: "#FF9800" },
    info: { main: "#9c27b0" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Something went wrong. Please refresh the page.
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  backgroundColor: theme.palette.grey[100],
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  maxWidth: "1200px",
  margin: "0 auto",
  width: "100%",
}));


const SummaryCard = ({ summary }) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography variant="h4" gutterBottom align="center">
        Test Summary
      </Typography>
      <Grid container spacing={2} textAlign="center">
        <Grid item xs={6} sm={3}>
          <Typography variant="h5" color="primary">
            {summary.totalScore || 0} / {summary.maxMarks || 0}
          </Typography>
          <Typography variant="caption">Total Score</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="h5" color="success.main">
            {summary.totalCorrect || 0}
          </Typography>
          <Typography variant="caption">Correct</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="h5" color="error.main">
            {summary.totalIncorrect || 0}
          </Typography>
          <Typography variant="caption">Incorrect</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="h5" color="text.secondary">
            {summary.totalUnattempted || 0}
          </Typography>
          <Typography variant="caption">Unattempted</Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const SectionCard = ({ section }) => (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {section.name}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Typography variant="subtitle1">
            Score:{" "}
            <Typography component="span" fontWeight="bold" color="primary">
              {section.score} / {section.maxMarks}
            </Typography>
          </Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <Typography variant="subtitle1">
            Correct:{" "}
            <Typography component="span" fontWeight="bold" color="success.main">
              {section.correct}
            </Typography>
          </Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <Typography variant="subtitle1">
            Incorrect:{" "}
            <Typography component="span" fontWeight="bold" color="error.main">
              {section.incorrect}
            </Typography>
          </Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <Typography variant="subtitle1">
            Unattempted:{" "}
            <Typography component="span" fontWeight="bold">
              {section.unattempted}
            </Typography>
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );

const QuestionReviewCard = ({ item, questionNumber }) => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="body1" fontWeight="bold" gutterBottom>
        Q{questionNumber}: <span dangerouslySetInnerHTML={{ __html: item.question }} />
      </Typography>
      <Divider sx={{ my: 1 }} />
      <Box>
        <Chip
          label={`Your Answer: ${item.selectedAnswers || "Not Answered"}`}
          color={item.givenMarks > 0 ? "success" : "error"}
          variant="outlined"
          sx={{ mr: 1, mb: 1 }}
        />
        <Chip
          label={`Correct Answer: ${item.answers[0]}`}
          color="success"
          sx={{ mb: 1 }}
        />
      </Box>
      {item.explanation && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, p: 1, bgcolor: "grey.100", borderRadius: 1 }}
        >
          <strong>Explanation:</strong> <span dangerouslySetInnerHTML={{ __html: item.explanation }} />
        </Typography>
      )}
    </Paper>
  );

 

const Page4 = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const { authState, setAuthState } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [detailedResults, setDetailedResults] = useState([]);
  const [viewMode, setViewMode] = useState("summary");  

  const hasViewedAnswers = useMemo(() => {
    return localStorage.getItem(`answers_viewed_${paperId}`) === "true";
  }, [paperId]);

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: "/api", timeout: 15000 });
    instance.interceptors.request.use(
      (config) => {
        if (authState?.accessToken) {
          config.headers.Authorization = authState.accessToken;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setAuthState(null);
        }
        return Promise.reject(error);
      }
    );
    return instance;
  }, [authState?.accessToken, setAuthState]);

  const processResults = (questions) => {
    let totalScore = 0;
    let maxMarks = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalUnattempted = 0;
    
    const sectionsData = {};

    questions.forEach((q, index) => {
      const sectionName = q.section || "General";
      if (!sectionsData[sectionName]) {
        sectionsData[sectionName] = {
            name: sectionName,
            score: 0,
            maxMarks: 0,
            correct: 0,
            incorrect: 0,
            unattempted: 0,
        };
      }

      maxMarks += q.marks;
      sectionsData[sectionName].maxMarks += q.marks;
      
      if (q.selectedAnswers === null || q.selectedAnswers === "") {
        totalUnattempted++;
        sectionsData[sectionName].unattempted++;
      } else if (q.givenMarks > 0) {
        totalCorrect++;
        sectionsData[sectionName].correct++;
        totalScore += q.givenMarks;
        sectionsData[sectionName].score += q.givenMarks;
      } else {
        totalIncorrect++;
        sectionsData[sectionName].incorrect++;
        totalScore -= q.negativeMarks;
        sectionsData[sectionName].score -= q.negativeMarks;
      }
    });

    return {
        totalScore,
        maxMarks,
        totalCorrect,
        totalIncorrect,
        totalUnattempted,
        sections: Object.values(sectionsData),
    };
  };

  const fetchDetailedResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
   
      const { data } = await api.get(`/questions/${paperId}`);
      
      const processedSummary = processResults(data);
      setSummary(processedSummary);
      setDetailedResults(data);
      setViewMode("detailed");

    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e.message ||
          "Failed to fetch detailed results."
      );
    } finally {
      setLoading(false);
    }
  }, [api, paperId]);


  useEffect(() => {
    if (hasViewedAnswers) {
      fetchDetailedResults();
    }
     
  }, [hasViewedAnswers, fetchDetailedResults]);

  const handleViewDetailedAnswers = () => {
    localStorage.setItem(`answers_viewed_${paperId}`, "true");
    fetchDetailedResults();
  };

  const handleRetry = () => {
    navigate(`/page3/${paperId}`);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <StyledContainer>
          <Header2
            authState={authState}
            title="Test Results"
          />
          <MainContent>
            {viewMode === "summary" && (
              <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h4" gutterBottom>
                  Test Submitted!
                </Typography>
                <Typography variant="h6" gutterBottom>
                  What would you like to do next?
                </Typography>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Replay />}
                    onClick={handleRetry}
                    size="large"
                  >
                    Retry Test
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Analytics />}
                    onClick={handleViewDetailedAnswers}
                    size="large"
                  >
                    View Final Result
                  </Button>
                </Box>
              </Paper>
            )}

            {viewMode === "detailed" && summary && (
              <>
                <SummaryCard summary={summary} />

                <Box sx={{ mt: 4 }}>
                   <Typography variant="h5" gutterBottom>
                    Section-wise Performance
                  </Typography>
                  {summary.sections.map((section, index) => (
                    <SectionCard key={index} section={section} />
                  ))}
                </Box>

                <Typography variant="h5" gutterBottom sx={{mt: 4}}>
                  Detailed Review
                </Typography>
                {detailedResults.map((item, index) => (
                  <QuestionReviewCard key={item.id || index} item={item} questionNumber={index + 1} />
                ))}
                <Button
                    variant="contained"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate(`/page3/${paperId}`)} 
                    sx={{mt: 3}}
                  >
                    Back to Dashboard
                  </Button>
              </>
            )}
          </MainContent>
        </StyledContainer>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default Page4;