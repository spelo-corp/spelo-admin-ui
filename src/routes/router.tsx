// src/routes/routes.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdminAuth } from "../auth/RequireAdminAuth";
import { RouteErrorBoundary } from "../components/common/RouteErrorBoundary";
import AdminLayout from "../components/layout/AdminLayout";
import AdminLoginPage from "../pages/AdminLoginPage";
import AudioFilesPage from "../pages/AudioFilesPage";
import AudioReviewPage from "../pages/AudioReviewPage";
import AudioProcessingDashboardPage from "../pages/audioProcessing/AudioProcessingDashboardPage";
import AudioProcessingJobAudioEditPage from "../pages/audioProcessing/AudioProcessingJobAudioEditPage";
import AudioProcessingJobOverviewPage from "../pages/audioProcessing/AudioProcessingJobOverviewPage";
import AudioProcessingJobPage from "../pages/audioProcessing/AudioProcessingJobPage";
import AudioProcessingJobSentencesPage from "../pages/audioProcessing/AudioProcessingJobSentencesPage";
import AudioProcessingJobTranscriptPage from "../pages/audioProcessing/AudioProcessingJobTranscriptPage";
import AudioProcessingUploadPage from "../pages/audioProcessing/AudioProcessingUploadPage";
import BookDetailPage from "../pages/books/BookDetailPage";
import BookListPage from "../pages/books/BookListPage";
import BookUploadPage from "../pages/books/BookUploadPage";
import CategoryManagementPage from "../pages/CategoryManagementPage";
import CollectionsPage from "../pages/CollectionsPage";
import CollectionWordsPage from "../pages/CollectionWordsPage";
import DashboardPage from "../pages/DashboardPage";
import DictionaryPage from "../pages/DictionaryPage.tsx";
import JobsDashboardPage from "../pages/jobs/JobsDashboardPage";
import YoutubeJobOverviewPage from "../pages/jobs/YoutubeJobOverviewPage";
import YoutubeJobPage from "../pages/jobs/YoutubeJobPage";
import YoutubeJobSentencesPage from "../pages/jobs/YoutubeJobSentencesPage";
import LessonListPage from "../pages/LessonListPage";
import LessonViewPage from "../pages/LessonViewPage";
import LessonAudioPage from "../pages/lesson/LessonAudioPage";
import LessonExercisesPage from "../pages/lesson/LessonExercisesPage";
import LessonInfoPage from "../pages/lesson/LessonInfoPage";
import LessonJobsPage from "../pages/lesson/LessonJobsPage";
import LessonVocabPage from "../pages/lesson/LessonVocabPage";
import ProcessingJobsPage from "../pages/ProcessingJobsPage";
import PipelineEditorPage from "../pages/pipelines/PipelineEditorPage";
import PipelineListPage from "../pages/pipelines/PipelineListPage";
import UsersPage from "../pages/UsersPage";

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
                <Route
                    path="jobs/audio/jobs/:jobId/review"
                    element={<AudioProcessingJobPage mode="review" />}
                >
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
                <Route
                    path="audio-processing"
                    element={<Navigate to="/admin/jobs/audio" replace />}
                />
                <Route
                    path="audio-processing/upload"
                    element={<Navigate to="/admin/jobs/audio/upload" replace />}
                />
                <Route
                    path="audio-processing/jobs/:jobId/*"
                    element={<AudioProcessingRedirect />}
                />

                {/* Pipelines */}
                <Route
                    path="pipelines"
                    element={
                        <RouteErrorBoundary routeName="Pipelines">
                            <PipelineListPage />
                        </RouteErrorBoundary>
                    }
                />
                <Route
                    path="pipelines/:pipelineId"
                    element={
                        <RouteErrorBoundary routeName="Pipeline Editor">
                            <PipelineEditorPage />
                        </RouteErrorBoundary>
                    }
                />

                {/* Books */}
                <Route
                    path="books"
                    element={
                        <RouteErrorBoundary routeName="Books">
                            <BookListPage />
                        </RouteErrorBoundary>
                    }
                />
                <Route path="books/upload" element={<BookUploadPage />} />
                <Route path="books/:sourceId" element={<BookDetailPage />} />

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
