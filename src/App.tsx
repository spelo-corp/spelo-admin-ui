import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import DashboardPage from "./pages/DashboardPage";
import ProcessingJobsPage from "./pages/ProcessingJobsPage";
import LessonListPage from "./pages/LessonListPage";
import AudioFilesPage from "./pages/AudioFilesPage";
import UsersPage from "./pages/UsersPage";
import AudioReviewPage from "./pages/AudioReviewPage.tsx";
import LessonViewPage from "./pages/LessonViewPage.tsx";

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="processing-jobs" element={<ProcessingJobsPage />} />
                <Route path="processing-jobs/:jobId/review" element={<AudioReviewPage />} />
                <Route path="lessons" element={<LessonListPage />} />
                <Route path="audio-files" element={<AudioFilesPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="lesson/:lessonId" element={<LessonViewPage />}
                />
            </Route>
        </Routes>
    );
};

export default App;
