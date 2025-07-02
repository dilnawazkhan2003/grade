import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import Header from "../component/Header";

// 1. Define the Theme with Square Borders
const theme = createTheme({
  palette: {
    primary: {
      main: "#4285f4", // Google Blue
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8f9fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#666666",
    },
    action: {
      disabledBackground: "#e0e0e0",
      disabled: "#666666",
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h1: {
      fontSize: "18px",
      fontWeight: 500,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      lineHeight: 1.2,
      flexGrow: 1,
      "@media (max-width: 992px)": { fontSize: "17px" },
      "@media (max-width: 768px)": {
        fontSize: "15px",
        whiteSpace: "normal",
        textOverflow: "unset",
      },
      "@media (max-width: 480px)": { fontSize: "14px" },
    },
    h2: {
      fontSize: "1.6rem",
      fontWeight: 600,
      marginBottom: "20px",
      "@media (max-width: 992px)": { fontSize: "1.5rem" },
      "@media (max-width: 768px)": { fontSize: "1.3rem", marginBottom: "15px" },
      "@media (max-width: 480px)": { fontSize: "1.2rem" },
    },
  },
  spacing: 8,
  // --- KEY CHANGE: Set border radius to 0 for square corners ---
  shape: {
    borderRadius: 0,
  },
  // Custom variables for fixed heights
  custom: {
    headerHeight: { desktop: "60px", mobile: "55px" },
    footerHeight: { desktop: "80px", mobile: "65px" },
  },
});

const Page2 = () => {
  const navigate = useNavigate();

  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [language, setLanguage] = useState("select");

  const handleCheckboxChange = (event) => {
    setDeclarationChecked(event.target.checked);
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleReadyClick = () => {
    if (!declarationChecked) {
    } else {
      alert("Starting the test!");
      navigate("/page3");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", flexDirection: "column", height: "100" }}>
        <Header />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto",
            p: { xs: 2, sm: 3, md: 4 },
            mt: {
              xs: theme.custom.headerHeight.mobile,
              md: theme.custom.headerHeight.desktop,
            },
            mb: {
              xs: theme.custom.footerHeight.mobile,
              md: theme.custom.footerHeight.desktop,
            },
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              backgroundColor: "background.paper",
              boxShadow: "0 1px 5px rgba(0,0,0,0.05)",
              p: { xs: 2, md: 4 },
              borderRadius: 0, // Ensure container is square
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
                pb: 2,
                mb: 3,
                borderBottom: "1px dashed #e0e0e0",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Duration: 60 Mins
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Maximum Marks: 200
              </Typography>
            </Box>

            <Typography variant="h2" color="text.primary">
              Read the following instructions carefully.
            </Typography>

            <Box component="ol" sx={{ pl: 4, mb: 3, lineHeight: 1.7 }}>
              <li>
                <Typography>
                  The test contains 4 sections having 100 questions.
                </Typography>
              </li>
              <li>
                <Typography>
                  Each question has 4 options out of which only one is correct.
                </Typography>
              </li>
              <li>
                <Typography>
                  You have to finish the test in 60 minutes.
                </Typography>
              </li>
              <li>
                <Typography>
                  You will be awarded 2 marks for each correct answer and 0.5
                  will be deducted for wrong answer.
                </Typography>
              </li>
              <li>
                <Typography>
                  There is no negative marking for the questions that you have
                  not attempted.
                </Typography>
              </li>
              <li>
                <Typography>
                  You can write this test only once. Make sure that you complete
                  the test before you submit the test and/or close the browser.
                </Typography>
              </li>
            </Box>

            <Box
              sx={{
                p: 2,
                backgroundColor: "background.default",
                border: "1px solid #e0e0e0",
                mb: 3,
                borderRadius: 0,
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="language-select-label">
                  Choose your default language:
                </InputLabel>
                <Select
                  labelId="language-select-label"
                  id="language-select"
                  value={language}
                  label="Choose your default language:"
                  onChange={handleLanguageChange}
                  sx={{ maxWidth: { xs: "100%", md: 280 } }}
                >
                  <MenuItem value="select">--Select--</MenuItem>
                  <MenuItem value="english">English</MenuItem>
                  <MenuItem value="hindi">Hindi</MenuItem>
                </Select>
              </FormControl>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, fontSize: "0.85rem" }}
              >
                Please note all questions will appear in your default language.
                This language can be changed for a particular question later on.
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="h6"
                component="p"
                sx={{ fontWeight: 500, fontSize: "1.1rem", mb: 2 }}
              >
                Declaration:
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={declarationChecked}
                    onChange={handleCheckboxChange}
                    name="declaration-agree"
                    color="primary"
                    sx={{ alignSelf: "flex-start", mt: -0.5, mr: 1 }}
                  />
                }
                label="I have read all the instructions carefully and have understood them. I agree not to cheat or use unfair means in this examination. I understand that using unfair means of any sort for my own or someone else's advantage will lead to my immediate disqualification. The decision of Testbook.com will be final in these matters and cannot be appealed."
                sx={{ color: "text.secondary", alignItems: "flex-start" }}
              />
            </Box>
          </Container>
        </Box>

        {/* Footer */}
        <AppBar
          position="fixed"
          color="background"
          elevation={1}
          sx={{
            top: "auto",
            bottom: 0,
            height: {
              xs: theme.custom.footerHeight.mobile,
              md: theme.custom.footerHeight.desktop,
            },
            borderTop: "1px solid #e0e0e0",
            boxShadow: "0 -2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Button
              onClick={() =>navigate('/')}
                variant="outlined"
                sx={{
                  borderColor: "#e0e0e0",
                  color: "text.primary",
                  "&:hover": {
                    backgroundColor: "#e9ecef",
                    borderColor: "#e0e0e0",
                  },
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                  padding: { xs: "8px 10px", sm: "10px 15px" },
                }}
              >
                Previous
              </Button>
            </Box>
            <Box>
              <Button
                variant="contained"
                color="primary"
                disabled={!declarationChecked}  
                onClick={handleReadyClick}
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.9rem" },
                  padding: { xs: "8px 8px", sm: "10px 15px" },
                }}
              >
                I am ready to begin
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
      </Box>
    </ThemeProvider>
  );
};

export default Page2;
