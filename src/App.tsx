import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import DashboardPage from "./pages/DashboardPage";
import ProcessingJobsPage from "./pages/ProcessingJobsPage";
import LessonListPage from "./pages/LessonListPage";
import AudioFilesPage from "./pages/AudioFilesPage";
import UsersPage from "./pages/UsersPage";
import JobReviewPage from "./pages/JobReviewPage";

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="processing-jobs" element={<ProcessingJobsPage />} />
                <Route path="processing-jobs/:jobId/review" element={<JobReviewPage />} />
                <Route path="lessons" element={<LessonListPage />} />
                <Route path="audio-files" element={<AudioFilesPage />} />
                <Route path="users" element={<UsersPage />} />
            </Route>
        </Routes>
    );
};

export default App;
