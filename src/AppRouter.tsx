import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import HistoryStudyBuddy from './suite/apps/history-study-buddy/HistoryStudyBuddy';
import SiliceoNotes from './suite/apps/siliceo-notes/SiliceoNotes';
import SiliceoResearch from './suite/apps/siliceo-research/SiliceoResearch';
import ChineseLearning from './suite/apps/chinese-learning/ChineseLearning';
import { SuiteDashboard } from './suite/SuiteDashboard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/suite" element={<SuiteDashboard />} />
        <Route path="/history-study-buddy" element={<HistoryStudyBuddy />} />
        <Route path="/siliceo-notes" element={<SiliceoNotes />} />
        <Route path="/siliceo-research" element={<SiliceoResearch />} />
        <Route path="/chinese-learning" element={<ChineseLearning />} />
        <Route path="/" element={<App />} />
        <Route path="*" element={<Navigate to="/suite" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
