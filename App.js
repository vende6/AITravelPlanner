import React from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
// ...existing code...

// Recruiter Dashboard Components
import RecruiterDashboard from './components/recruiter/RecruiterDashboard';
import CandidateReels from './components/recruiter/CandidateReels';
import CandidateAnalytics from './components/recruiter/CandidateAnalytics';
import ShortlistView from './components/recruiter/ShortlistView';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="main-nav">
          // ...existing code...
          {userRole === 'recruiter' && (
            <div className="recruiter-nav">
              <Link to="/recruiter-dashboard">Dashboard</Link>
              <Link to="/candidate-reels">Candidate Reels</Link>
              <Link to="/analytics">Analytics</Link>
              <Link to="/shortlist">Shortlisted</Link>
            </div>
          )}
        </nav>
        
        <Switch>
          // ...existing code...
          
          {/* Recruiter Routes */}
          <Route path="/recruiter-dashboard" component={RecruiterDashboard} />
          <Route path="/candidate-reels" component={CandidateReels} />
          <Route path="/analytics" component={CandidateAnalytics} />
          <Route path="/shortlist" component={ShortlistView} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;