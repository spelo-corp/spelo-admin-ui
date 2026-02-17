// src/routes/routes.tsx
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "../components/layout/AdminLayout";
import { RequireAdminAuth } from "../auth/RequireAdminAuth";
import { RouteErrorBoundary } from "../components/common/RouteErrorBoundary";

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
import JobsDashboardPage from "../pages/jobs/JobsDashboardPage";
import YoutubeJobPage from "../pages/jobs/YoutubeJobPage";
import YoutubeJobOverviewPage from "../pages/jobs/YoutubeJobOverviewPage";
import YoutubeJobSentencesPage from "../pages/jobs/YoutubeJobSentencesPage";
import LessonListPage from "../pages/LessonListPage";
import AudioFilesPage from "../pages/AudioFilesPage";
import UsersPage from "../pages/UsersPage";

import LessonViewPage from "../pages/LessonViewPage";
import LessonInfoPage from "../pages/lesson/LessonInfoPage";
import LessonAudioPage from "../pages/lesson/LessonAudioPage";
import LessonJobsPage from "../pages/lesson/LessonJobsPage";
import LessonExercisesPage from "../pages/lesson/LessonExercisesPage";
import LessonVocabPage from "../pages/lesson/LessonVocabPage";
import DictionaryPage from "../pages/DictionaryPage.tsx";
import AdminLoginPage from "../pages/AdminLoginPage";
import CategoryManagementPage from "../pages/CategoryManagementPage";
import CollectionsPage from "../pages/CollectionsPage";
import CollectionWordsPage from "../pages/CollectionWordsPage";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />

            <Route path="/admin/login" element={<AdminLoginPage />} />

            <Route
                path="/admin"
                element={
                    <RequireAdminAuth>
                        <AdminLayout />
                    </RequireAdminAuth>
                }
            >
                <Route
                    index
                    element={
                        <RouteErrorBoundary routeName="Dashboard">
                            <DashboardPage />
                        </RouteErrorBoundary>
                    }
                />

                <Route
                    path="processing-jobs"
                    element={
                        <RouteErrorBoundary routeName="Processing Jobs">
                            <ProcessingJobsPage />
                        </RouteErrorBoundary>
                    }
                />
                <Route path="processing-jobs/:jobId/review" element={<AudioReviewPage />} />

                {/* Unified Jobs Dashboard */}
                <Route path="jobs" element={<JobsDashboardPage />} />

                {/* Audio jobs under /jobs/audio */}
                <Route path="jobs/audio" element={<AudioProcessingDashboardPage />} />
                <Route path="jobs/audio/upload" element={<AudioProcessingUploadPage />} />
                <Route path="jobs/audio/jobs/:jobId" element={<AudioProcessingJobPage />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<AudioProcessingJobOverviewPage />} />
                    <Route path="transcript" element={<AudioProcessingJobTranscriptPage />} />
                    <Route path="sentences" element={<AudioProcessingJobSentencesPage />} />
                    <Route path="audio" element={<AudioProcessingJobAudioEditPage />} />
                </Route>
                <Route path="jobs/audio/jobs/:jobId/review" element={<AudioProcessingJobPage mode="review" />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<AudioProcessingJobOverviewPage />} />
                    <Route path="transcript" element={<AudioProcessingJobTranscriptPage />} />
                    <Route path="sentences" element={<AudioProcessingJobSentencesPage />} />
                    <Route path="audio" element={<AudioProcessingJobAudioEditPage />} />
                </Route>

                {/* YouTube jobs under /jobs/youtube */}
                <Route path="jobs/youtube/:jobId" element={<YoutubeJobPage />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<YoutubeJobOverviewPage />} />
                    <Route path="sentences" element={<YoutubeJobSentencesPage />} />
                </Route>

                {/* Redirects for old audio-processing URLs */}
                <Route path="audio-processing" element={<Navigate to="/admin/jobs/audio" replace />} />
                <Route path="audio-processing/upload" element={<Navigate to="/admin/jobs/audio/upload" replace />} />
                <Route path="audio-processing/jobs/:jobId/*" element={<AudioProcessingRedirect />} />

                <Route
                    path="lessons"
                    element={
                        <RouteErrorBoundary routeName="Lessons">
                            <LessonListPage />
                        </RouteErrorBoundary>
                    }
                />
                <Route
                    path="categories"
                    element={
                        <RouteErrorBoundary routeName="Categories">
                            <CategoryManagementPage />
                        </RouteErrorBoundary>
                    }
                />
                <Route path="audio-files" element={<AudioFilesPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route
                    path="dictionary"
                    element={
                        <RouteErrorBoundary routeName="Dictionary">
                            <DictionaryPage />
                        </RouteErrorBoundary>
                    }
                />
                <Route
                    path="collections"
                    element={
                        <RouteErrorBoundary routeName="Collections">
                            <CollectionsPage />
                        </RouteErrorBoundary>
                    }
                />
                <Route
                    path="collections/:collectionId"
                    element={
                        <RouteErrorBoundary routeName="Collection Words">
                            <CollectionWordsPage />
                        </RouteErrorBoundary>
                    }
                />

                <Route path="lessons/:lessonId" element={<LessonViewPage />}>
                    <Route index element={<LessonInfoPage />} />
                    <Route path="info" element={<LessonInfoPage />} />
                    <Route path="audio" element={<LessonAudioPage />} />
                    <Route path="jobs" element={<LessonJobsPage />} />
                    <Route path="exercises" element={<LessonExercisesPage />} />
                    <Route path="vocab" element={<LessonVocabPage />} />
                </Route>
            </Route>
        </Routes>
    );
};

/** Redirect /admin/audio-processing/jobs/:jobId/* → /admin/jobs/audio/jobs/:jobId/* */
function AudioProcessingRedirect() {
    const path = window.location.pathname;
    const newPath = path.replace("/admin/audio-processing/jobs/", "/admin/jobs/audio/jobs/");
    return <Navigate to={newPath} replace />;
}
