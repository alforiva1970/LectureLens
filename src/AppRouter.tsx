import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LectureLensApp from './suite/apps/lecture-lens/LectureLensApp';
import HistoryStudyBuddy from './suite/apps/history-study-buddy/HistoryStudyBuddyApp';
import SiliceoNotes from './suite/apps/siliceo-notes/SiliceoNotesApp';
import SiliceoResearch from './suite/apps/siliceo-research/SiliceoResearchApp';
import ChineseLearning from './suite/apps/chinese-learning/ChineseLearningApp';
import { SuiteDashboard } from './suite/SuiteDashboard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/lecture-lens" element={<LectureLensApp />} />
        <Route path="/history-study-buddy" element={<HistoryStudyBuddy />} />
        <Route path="/siliceo-notes" element={<SiliceoNotes />} />
        <Route path="/siliceo-research" element={<SiliceoResearch />} />
        <Route path="/chinese-learning" element={<ChineseLearning />} />
        <Route path="/" element={<SuiteDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
