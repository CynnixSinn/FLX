import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WorkflowDesigner from './pages/WorkflowDesigner';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<WorkflowDesigner />} />
          <Route path="/workflow/:id" element={<WorkflowDesigner />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;