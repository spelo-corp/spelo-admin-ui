// src/routes/routes.tsx
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "../components/layout/AdminLayout";

import DashboardPage from "../pages/DashboardPage";
import ProcessingJobsPage from "../pages/ProcessingJobsPage";
import AudioReviewPage from "../pages/AudioReviewPage";
import LessonListPage from "../pages/LessonListPage";
import AudioFilesPage from "../pages/AudioFilesPage";
import UsersPage from "../pages/UsersPage";

import LessonViewPage from "../pages/LessonViewPage";
import LessonInfoPage from "../pages/lesson/LessonInfoPage";
import LessonAudioPage from "../pages/lesson/LessonAudioPage";
import LessonExercisesPage from "../pages/lesson/LessonExercisesPage";
import LessonVocabPage from "../pages/lesson/LessonVocabPage";
import DictionaryPage from "../pages/DictionaryPage.tsx";

export const AppRoutes = () => {
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
                <Route path="dictionary" element={<DictionaryPage />} />

                <Route path="lessons/:lessonId" element={<LessonViewPage />}>
                    <Route index element={<LessonInfoPage />} />
                    <Route path="info" element={<LessonInfoPage />} />
                    <Route path="audio" element={<LessonAudioPage />} />
                    <Route path="exercises" element={<LessonExercisesPage />} />
                    <Route path="vocab" element={<LessonVocabPage />} />
                </Route>
            </Route>
        </Routes>
    );
};
