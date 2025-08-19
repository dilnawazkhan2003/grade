import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Avatar, Divider, LinearProgress,
  Grid, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert
} from '@mui/material';
import {
  ArrowBack, BarChart, PieChart, Timeline,
  CheckCircle, Cancel, Help, Flag, Replay, Warning
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';

/* -------------------------- THEME -------------------------- */
const theme = createTheme({
  palette: {
    primary: { main: '#2196F3' },
    secondary: { main: '#007bff' },
    error: { main: '#f44336' },
    success: { main: '#4CAF50' },
    warning: { main: '#FF9800' },
    info: { main: '#9c27b0' },
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
  padding: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2)
  }
}));

const PerformanceCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
  borderRadius: theme.shape.borderRadius * 2
}));

/* ----------------- HELPERS (KEY FIXES HERE) ----------------- */

/** Safely coerce to number. */
const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/** Normalize any answer for safe comparison (handles arrays, numbers, strings). */
const normalizeVal = (v) => {
  if (Array.isArray(v)) {
    return JSON.stringify([...v].map(String).map(s => s.trim().toLowerCase()).sort());
  }
  if (v === null || v === undefined) return '';
  return String(v).trim().toLowerCase();
};

/**
 * Normalize questions so that each has a stable "id", "correctAnswer", and "marks".
 * (Avoids random IDs that will never match answers.)
 */
const normalizeQuestions = (rawQuestions = []) =>
  rawQuestions.map((q, idx) => {
    const id =
      q.qid ??
      q.id ??
      q._id ??
      q.questionId ??
      q.key ??
      q.uuid ??
      String(idx); // stable fallback: index-based

    // Try common fields for correct answer
    const correctAnswer =
      q.correctAnswer ??
      q.answer ??
      q.correct ??
      q.correct_option ??
      q.correctIndex ??
      q.correctOption;

    // Positive/negative marks (with safe defaults)
    const m = q.marks ?? {};
    const positive =
      num(m.positive ?? m.pos ?? q.positiveMarks ?? q.mark ?? q.marksPositive, 1);
    const negative =
      num(m.negative ?? m.neg ?? q.negativeMarks ?? q.negMark ?? q.marksNegative, 0.25);

    return {
      ...q,
      id,
      correctAnswer,
      marks: { positive, negative },
      __idx: idx, // keep original index as a last-resort mapping key
    };
  });

/**
 * Normalize answers to a map keyed by the normalized question.id
 * Supports:
 *  - Object map { [qid]: answer }
 *  - Array of primitives [answer0, answer1, ...] (index-based)
 *  - Array of objects [{ qid/id/questionId, answer/selected/userAnswer/value }]
 */
const normalizeAnswers = (rawAnswers, questions) => {
  const out = {};

  if (!rawAnswers) return out;

  const indexKeyToId = (key) => {
    const idx = Number(key);
    if (Number.isInteger(idx) && questions[idx]) return questions[idx].id;
    return null;
  };

  if (Array.isArray(rawAnswers)) {
    if (rawAnswers.length > 0 && typeof rawAnswers[0] === 'object' && rawAnswers[0] !== null) {
      // Array of objects
      rawAnswers.forEach((a, idx) => {
        const qid =
          a.qid ??
          a.id ??
          a._id ??
          a.questionId ??
          (questions[idx] && questions[idx].id);

        const val =
          a.answer ??
          a.selected ??
          a.selectedOption ??
          a.userAnswer ??
          a.choice ??
          a.value;

        if (qid != null && val !== undefined) {
          out[String(qid)] = val;
        }
      });
    } else {
      // Array of primitives -> index-based mapping
      rawAnswers.forEach((val, idx) => {
        if (questions[idx]) {
          out[questions[idx].id] = val;
        }
      });
    }
  } else if (typeof rawAnswers === 'object') {
    // Object map (keys may be qids or indices)
    Object.entries(rawAnswers).forEach(([key, val]) => {
      // Try to match directly to any of the question identity fields
      const match =
        questions.find(q =>
          [q.id, q.qid, q._id, q.questionId, String(q.__idx)].some(k => String(k) === String(key))
        );

      if (match) {
        out[match.id] = val;
      } else {
        // Try numeric key as array index
        const idFromIndex = indexKeyToId(key);
        if (idFromIndex) out[idFromIndex] = val;
        else out[String(key)] = val; // last resort, may still match if id strings coincide
      }
    });
  }

  return out;
};

/** Compute performance given normalized questions + answers map. */
const calculatePerformance = (questions, answersMap) => {
  if (!questions?.length) return null;

  const res = questions.reduce(
    (acc, q) => {
      // Only count questions with a defined correct answer
      if (q.correctAnswer !== undefined) {
        const userAnswer = answersMap[q.id];

        const isAttempted = !(userAnswer === undefined || userAnswer === null || userAnswer === '');
        if (!isAttempted) {
          acc.unanswered += 1;
          acc.totalMarks += num(q.marks?.positive, 1);
          return acc;
        }

        const correct = normalizeVal(userAnswer) === normalizeVal(q.correctAnswer);
        if (correct) {
          acc.correct += 1;
          acc.obtainedMarks += num(q.marks?.positive, 1);
        } else {
          acc.incorrect += 1;
          acc.obtainedMarks -= num(q.marks?.negative, 0.25);
        }

        acc.totalMarks += num(q.marks?.positive, 1);
      }
      return acc;
    },
    {
      correct: 0,
      incorrect: 0,
      unanswered: 0,
      totalMarks: 0,
      obtainedMarks: 0,
      attempted: 0,
    }
  );

  res.attempted = res.correct + res.incorrect;
  res.accuracy = res.attempted > 0 ? Math.round((res.correct / res.attempted) * 100) : 0;
  res.percentage = res.totalMarks > 0 ? Math.round((res.obtainedMarks / res.totalMarks) * 100) : 0;
  res.totalQuestions = questions.length;

  return res;
};

/* ---------------------------- PAGE --------------------------- */

const Page5 = () => {
  const navigate = useNavigate();
  const { paperId } = useParams();
  const { authState } = useUser();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: '/api',
      timeout: 15000,
    });

    instance.interceptors.request.use(
      (config) => {
        if (authState?.accessToken) {
          config.headers.Authorization = `Bearer ${authState.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setError('Session expired. Please login again.');
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [authState?.accessToken]);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsOffline(false);

      const response = await api.get(`/study/testpaper/results/${paperId}`);
      const apiData = response.data;
      if (!apiData) throw new Error('No results data received from server');

      // Support multiple possible field names
      const rawQuestions = apiData.questions ?? apiData.questionList ?? [];
      const normQuestions = normalizeQuestions(rawQuestions);
      const answersMap = normalizeAnswers(apiData.userAnswers ?? apiData.answers, normQuestions);

      const formattedData = {
        questions: normQuestions,
        answers: answersMap,
        testName: apiData.testName ?? apiData.title ?? "Test Results",
        timestamp: apiData.timestamp ?? apiData.completedAt ?? new Date().toISOString()
      };

      const perf = calculatePerformance(formattedData.questions, formattedData.answers);

      setResults(formattedData);
      setPerformanceData(perf);

      const uid = authState?.user?.id ?? authState?.user?._id ?? 'anon';
      localStorage.setItem(
        `test_results_${paperId}_${uid}`,
        JSON.stringify({ ...formattedData, performance: perf, timestamp: new Date().toISOString() })
      );
    } catch (err) {
      console.error('Error fetching results', err);
      setIsOffline(true);

      const uid = authState?.user?.id ?? authState?.user?._id ?? 'anon';
      const localStorageKey = `test_results_${paperId}_${uid}`;
      const stored = localStorage.getItem(localStorageKey);

      if (stored) {
        const parsed = JSON.parse(stored);
        const normQuestions = normalizeQuestions(parsed.questions ?? []);
        const answersMap = normalizeAnswers(parsed.answers, normQuestions);
        const perf = parsed.performance ?? calculatePerformance(normQuestions, answersMap);

        setResults({ ...parsed, questions: normQuestions, answers: answersMap });
        setPerformanceData(perf);
      } else {
        setError(err?.response?.data?.message || err.message || 'Failed to load results. Please check your connection.');

        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            // Re-call fetchResults safely
            (async () => {
              try {
                await api.get('/__noop'); // noop to keep closure alive (optional)
              } catch {setRetryCount}
              fetchResults();
            })();
          }, 3000);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [api, paperId, authState?.user?.id, authState?.user?._id, retryCount]);

  useEffect(() => {
    if (authState?.accessToken && paperId) {
      fetchResults();
    } else if (!authState?.accessToken) {
      setError('Authentication required. Please login to view results.');
      setLoading(false);
    }
  }, [authState?.accessToken, paperId, fetchResults]);

  const handleRetakeTest = useCallback(() => {
    navigate(`/page3/${paperId}`);
  }, [navigate, paperId]);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /* -------------------------- RENDER -------------------------- */

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <StyledContainer>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
            gap: 2
          }}>
            <CircularProgress size={60} />
            <Typography variant="body1" color="text.secondary">
              Loading your results...
            </Typography>
            {retryCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                Attempt {retryCount + 1} of 3
              </Typography>
            )}
          </Box>
        </StyledContainer>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <StyledContainer>
          <Box sx={{
            textAlign: 'center',
            mt: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3
          }}>
            <Typography variant="h5" color="error" gutterBottom>
              {error.includes('Network') ? 'Connection Issue' : 'Error Loading Results'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, maxWidth: '600px' }}>
              {error.includes('Network') ? (
                'Could not connect to the server. Showing cached results if available.'
              ) : (
                error
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={fetchResults}
                startIcon={<Replay />}
                disabled={retryCount >= 3}
              >
                {retryCount >= 3 ? 'Max Retries Reached' : 'Retry'}
              </Button>
              <Button variant="outlined" onClick={handleGoHome}>
                Go Home
              </Button>
            </Box>
          </Box>
        </StyledContainer>
      </ThemeProvider>
    );
  }

  if (!results || !performanceData) {
    return (
      <ThemeProvider theme={theme}>
        <StyledContainer>
          <Box sx={{
            textAlign: 'center',
            mt: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3
          }}>
            <Typography variant="h5" gutterBottom>
              No Results Available
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, maxWidth: '600px' }}>
              We couldn't find any results for this test.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary" onClick={handleRetakeTest}>
                Take Test Again
              </Button>
              <Button variant="outlined" onClick={handleGoHome}>
                Go Home
              </Button>
            </Box>
          </Box>
        </StyledContainer>
      </ThemeProvider>
    );
  }

  const performanceMetrics = [
    {
      icon: <BarChart color="primary" sx={{ fontSize: 40, mr: 1 }} />,
      title: 'Score',
      value: `${performanceData.obtainedMarks.toFixed(2)}/${performanceData.totalMarks}`,
      progress: performanceData.percentage,
      color: 'primary',
      description: 'Marks obtained vs total'
    },
    {
      icon: <PieChart color="success" sx={{ fontSize: 40, mr: 1 }} />,
      title: 'Accuracy',
      value: `${performanceData.accuracy}%`,
      progress: performanceData.accuracy,
      color: 'success',
      description: 'Correct answers from attempted'
    },
    {
      icon: <Timeline color="warning" sx={{ fontSize: 40, mr: 1 }} />,
      title: 'Attempted',
      value: `${performanceData.attempted}/${performanceData.totalQuestions}`,
      progress: (performanceData.attempted / performanceData.totalQuestions) * 100,
      color: 'warning',
      description: 'Questions answered'
    },
    {
      icon: <Flag color="info" sx={{ fontSize: 40, mr: 1 }} />,
      title: 'Performance',
      value: `${performanceData.percentage}%`,
      progress: performanceData.percentage,
      color: 'info',
      description: 'Overall test performance'
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <StyledContainer>
        <Box sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Button startIcon={<ArrowBack />} onClick={handleGoHome} sx={{ mr: 2 }}>
            Back to Dashboard
          </Button>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600, textAlign: 'center', flex: 1, minWidth: '300px' }}
          >
            Test Results {isOffline && '(Offline)'}
          </Typography>
          <Box sx={{ width: { xs: 0, sm: 150 } }} />
        </Box>

        {isOffline && (
          <Alert severity="warning" sx={{ mb: 3, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Warning sx={{ mr: 1 }} />
              Showing cached results
            </Box>
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Avatar
                src={authState?.user?.image}
                alt={authState?.user?.name}
                sx={{ width: 60, height: 60, mr: 2 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="bold">
                  {authState?.user?.name || 'Test Taker'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Test: {results.testName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed: {new Date(results.timestamp).toLocaleString()}
                </Typography>
              </Box>
              <Button variant="outlined" onClick={fetchResults} startIcon={<Replay />} size="small">
                Refresh
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={3}>
              {performanceMetrics.map((metric, index) => (
                <Grid item xs={12} sm={6} lg={3} key={index}>
                  <PerformanceCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {metric.icon}
                        <Box>
                          <Typography variant="h5" fontWeight="bold">
                            {metric.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {metric.description}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography
                        variant="h3"
                        sx={{ mb: 2, textAlign: 'center', fontWeight: 700 }}
                      >
                        {metric.value}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={metric.progress}
                        // FIX: style the bar color via theme so it works for all palette keys
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: 'grey.300',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: (t) =>
                              (t.palette[metric.color] && t.palette[metric.color].main) ||
                              t.palette.primary.main,
                          },
                        }}
                      />
                    </CardContent>
                  </PerformanceCard>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Question-wise Analysis
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Q.No</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Your Answer</TableCell>
                      <TableCell>Correct Answer</TableCell>
                      <TableCell>Marks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.questions.map((question, index) => {
                      const userAnswer = results.answers[question.id];
                      const isAttempted = !(userAnswer === undefined || userAnswer === null || userAnswer === '');
                      const isCorrect =
                        isAttempted && normalizeVal(userAnswer) === normalizeVal(question.correctAnswer);

                      const displayVal = (v) =>
                        Array.isArray(v) ? v.join(', ') : (v ?? '-');

                      return (
                        <TableRow key={`q-${question.id || index}`} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {isAttempted ? (
                                isCorrect ? <CheckCircle color="success" /> : <Cancel color="error" />
                              ) : (
                                <Help color="warning" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{isAttempted ? displayVal(userAnswer) : 'Not Attempted'}</TableCell>
                          <TableCell>{displayVal(question.correctAnswer)}</TableCell>
                          <TableCell>
                            {isAttempted ? (
                              isCorrect ? (
                                <Typography sx={{ color: (t) => t.palette.success.main, fontWeight: 'bold' }}>
                                  +{num(question.marks?.positive, 1)}
                                </Typography>
                              ) : (
                                <Typography sx={{ color: (t) => t.palette.error.main, fontWeight: 'bold' }}>
                                  -{Math.abs(num(question.marks?.negative, 0.25))}
                                </Typography>
                              )
                            ) : (
                              '0'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Test Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Test:</strong> {results.testName}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Date:</strong> {new Date(results.timestamp).toLocaleString()}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Performance Metrics
              </Typography>
              <Box sx={{ '& > *': { mb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Total Questions:</Typography>
                  <Typography fontWeight="bold">{performanceData.totalQuestions}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Attempted:</Typography>
                  <Typography fontWeight="bold">{performanceData.attempted}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Correct:</Typography>
                  <Typography sx={{ color: (t) => t.palette.success.main }} fontWeight="bold">
                    {performanceData.correct}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Incorrect:</Typography>
                  <Typography sx={{ color: (t) => t.palette.error.main }} fontWeight="bold">
                    {performanceData.incorrect}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Unanswered:</Typography>
                  <Typography fontWeight="bold">{performanceData.unanswered}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Total Marks:</Typography>
                  <Typography fontWeight="bold">{performanceData.totalMarks}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Obtained Marks:</Typography>
                  <Typography fontWeight="bold">{performanceData.obtainedMarks.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Percentage:</Typography>
                  <Typography fontWeight="bold">{performanceData.percentage}%</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Accuracy:</Typography>
                  <Typography fontWeight="bold">{performanceData.accuracy}%</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRetakeTest}
                  startIcon={<Replay />}
                  fullWidth
                >
                  Retake Test
                </Button>
                <Button variant="outlined" onClick={handleGoHome} fullWidth>
                  Back to Dashboard
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </StyledContainer>
    </ThemeProvider>
  );
};

export default Page5;
