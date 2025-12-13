// src/routes/routes.tsx
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "../components/layout/AdminLayout";

import DashboardPage from "../pages/DashboardPage";
import ProcessingJobsPage from "../pages/ProcessingJobsPage";
import AudioReviewPage from "../pages/AudioReviewPage";
import AudioProcessingDashboardPage from "../pages/audioProcessing/AudioProcessingDashboardPage";
import AudioProcessingUploadPage from "../pages/audioProcessing/AudioProcessingUploadPage";
import AudioProcessingJobPage from "../pages/audioProcessing/AudioProcessingJobPage";
import AudioProcessingJobOverviewPage from "../pages/audioProcessing/AudioProcessingJobOverviewPage";
import AudioProcessingJobTranscriptPage from "../pages/audioProcessing/AudioProcessingJobTranscriptPage";
import AudioProcessingJobSentencesPage from "../pages/audioProcessing/AudioProcessingJobSentencesPage";
import AudioProcessingJobAudioEditPage from "../pages/audioProcessing/AudioProcessingJobAudioEditPage";
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
                <Route path="audio-processing" element={<AudioProcessingDashboardPage />} />
                <Route path="audio-processing/upload" element={<AudioProcessingUploadPage />} />
                <Route path="audio-processing/jobs/:jobId" element={<AudioProcessingJobPage />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<AudioProcessingJobOverviewPage />} />
                    <Route path="transcript" element={<AudioProcessingJobTranscriptPage />} />
                    <Route path="sentences" element={<AudioProcessingJobSentencesPage />} />
                    <Route path="audio" element={<AudioProcessingJobAudioEditPage />} />
                </Route>
                <Route path="audio-processing/jobs/:jobId/review" element={<AudioProcessingJobPage mode="review" />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<AudioProcessingJobOverviewPage />} />
                    <Route path="transcript" element={<AudioProcessingJobTranscriptPage />} />
                    <Route path="sentences" element={<AudioProcessingJobSentencesPage />} />
                    <Route path="audio" element={<AudioProcessingJobAudioEditPage />} />
                </Route>

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
