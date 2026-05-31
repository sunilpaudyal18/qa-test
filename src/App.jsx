import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import './App.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const TestCases = lazy(() => import('./pages/TestCases'));
const TestSuites = lazy(() => import('./pages/TestSuites'));
const Reports = lazy(() => import('./pages/Reports'));
const ImportExport = lazy(() => import('./pages/ImportExport'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/testcases" element={<TestCases />} />
          <Route path="/suites" element={<TestSuites />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/import-export" element={<ImportExport />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </div>
  );
}
