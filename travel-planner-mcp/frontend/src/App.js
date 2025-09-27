import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import TravelPlannerInterface from './components/TravelPlanner/TravelPlannerInterface';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TravelPlannerInterface />
    </ThemeProvider>
  );
}

export default App;