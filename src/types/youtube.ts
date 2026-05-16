export type VideoIngestionStatus =
    | "NEW"
    | "QUEUED"
    | "PROCESSING"
    | "READY_FOR_REVIEW"
    | "COMPLETED"
    | "FAILED"
    | "SKIPPED"
    | "IGNORED";

export interface YouTubeChannel {
    id: number;
    channel_id: string;
    handle: string | null;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    uploads_playlist_id: string;
    subscriber_count: number | null;
    video_count: number | null;
    default_lesson_level: string | null;
    default_category_id: number | null;
    min_duration_sec: number | null;
    max_duration_sec: number | null;
    auto_sync_enabled: boolean;
    auto_queue_enabled: boolean;
    auto_finalize_enabled: boolean;
    auto_finalize_min_confidence: number | null;
    level_inference_enabled: boolean;
    is_active: boolean;
    last_synced_at: string | null;
    last_auto_queued_at: string | null;
    last_video_published_at: string | null;
    stats?: YouTubeChannelStats;
    created_at: string;
    updated_at: string;
}

export interface YouTubeChannelStats {
    total_videos: number;
    new_videos: number;
    queued_videos: number;
    processing_videos: number;
    completed_videos: number;
    failed_videos: number;
}

export interface YouTubeVideo {
    id: number;
    youtube_video_id: string;
    channel_id: number;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    duration_sec: number | null;
    published_at: string;
    view_count: number | null;
    has_captions: boolean | null;
    ingestion_status: VideoIngestionStatus;
    lesson_id: number | null;
    job_id: number | null;
    skip_reason: string | null;
    inferred_level: string | null;
    inferred_category_id: number | null;
    inference_confidence: number | null;
    auto_finalized: boolean;
    metadata_synced_at: string;
    created_at: string;
}

export interface CatalogSyncResult {
    new_count: number;
    updated_count: number;
    ignored_count: number;
    total_units_used: number;
    quota_exceeded: boolean;
}

export interface QuotaStatus {
    today_usage: number;
    daily_limit: number;
    remaining: number;
}

export type BatchItemStatus =
    | "PENDING"
    | "LESSON_CREATED"
    | "JOB_DISPATCHED"
    | "READY_FOR_REVIEW"
    | "FINALIZED"
    | "FAILED";

export interface YouTubeIngestionBatch {
    id: number;
    name: string | null;
    channel_id: number | null;
    total_videos: number;
    queued_count: number;
    completed_count: number;
    failed_count: number;
    default_lesson_level: string | null;
    default_category_id: number | null;
    created_by: number;
    created_at: string;
    updated_at: string;
}

export interface BatchItem {
    id: number;
    batch_id: number;
    youtube_pk: number;
    youtube_video_id: string;
    video_title: string;
    thumbnail_url: string | null;
    duration_sec: number | null;
    status: BatchItemStatus;
    lesson_id: number | null;
    job_id: number | null;
    error_message: string | null;
    created_at: string;
}

export interface BatchDetail extends YouTubeIngestionBatch {
    items: BatchItem[];
}

export interface YouTubeSyncLog {
    id: number;
    channel_id: number;
    triggered_by: "MANUAL" | "SCHEDULED";
    mode: "FULL" | "INCREMENTAL";
    new_videos_count: number;
    updated_videos_count: number;
    auto_queued_count: number;
    quota_units_used: number;
    started_at: string;
    finished_at: string | null;
    error_message: string | null;
}

export interface DailyMetrics {
    metric_date: string;
    channel_id: number;
    videos_discovered: number;
    videos_queued: number;
    videos_finalized: number;
    videos_auto_finalized: number;
    videos_failed: number;
    avg_align_seconds: number | null;
    quota_units_used: number;
}

export interface DashboardStats {
    quota: { today_usage: number; daily_limit: number };
    pending_review_count: number;
}
