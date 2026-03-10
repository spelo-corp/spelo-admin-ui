// src/pages/lesson/LessonVocabPage.tsx

import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Loader2,
    RefreshCcw,
    Save,
    Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { Btn } from "../../components/ui/Btn";
import { Input } from "../../components/ui/Input";
import type { ListeningLessonDTO, VocabWord } from "../../types";
import type {
    ExtractVocabFromLessonResponse,
    MapVocabScriptResponse,
    VocabJob,
} from "../../types/vocabJob";
import type { LessonOutletContext } from "../LessonViewPage";

interface WordCandidate {
    key: string;
    word: string;
    wordId?: number;
}

const WORD_TOKEN_REGEX = /[\p{L}\p{N}'-]+/gu;

const normalizeWord = (word: string) => word.trim().toLowerCase();

const cleanWordToken = (token: string) =>
    token.replace(/^[^\p{L}\p{N}'-]+|[^\p{L}\p{N}'-]+$/gu, "");

const getSentenceTranscript = (detail: ListeningLessonDTO) =>
    detail.str_script ||
    (detail.script || [])
        .map((word) => word.w)
        .filter((word): word is string => Boolean(word))
        .join(" ");

const buildWordCandidates = (detail: ListeningLessonDTO, transcript: string) => {
    const seen = new Map<string, WordCandidate>();
    const addWord = (raw: string, wordId?: number | null) => {
        const cleaned = cleanWordToken(raw);
        if (!cleaned) return;
        const key = normalizeWord(cleaned);
        const existing = seen.get(key);
        if (!existing) {
            seen.set(key, { key, word: cleaned, wordId: wordId ?? undefined });
        } else if (!existing.wordId && wordId) {
            existing.wordId = wordId;
        }
    };

    detail.script?.forEach((token) => {
        if (token.w) {
            addWord(token.w, token.id);
        }
    });

    const transcriptTokens = transcript.match(WORD_TOKEN_REGEX) ?? [];
    transcriptTokens.forEach((token) => addWord(token));

    detail.new_words?.forEach((word) => addWord(word.word, word.word_id));

    return Array.from(seen.values());
};

const LessonVocabPage = () => {
    const { lessonId } = useParams();
    const { lessonMeta, lessonDetail, setLessonDetail } = useOutletContext<LessonOutletContext>();

    const numericLessonId = Number(lessonId);

    const [includeStopWords, setIncludeStopWords] = useState(false);

    const [extracting, setExtracting] = useState(false);
    const [extractError, setExtractError] = useState<string | null>(null);
    const [extractResult, setExtractResult] = useState<ExtractVocabFromLessonResponse | null>(null);

    const [mapIdsInput, setMapIdsInput] = useState("");
    const [mapping, setMapping] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [mapResult, setMapResult] = useState<MapVocabScriptResponse | null>(null);

    const [jobId, setJobId] = useState<number | null>(null);
    const [job, setJob] = useState<VocabJob | null>(null);
    const [refreshingJob, setRefreshingJob] = useState(false);
    const [jobTitle, setJobTitle] = useState("Vocab Job");

    const [wordIdsInput, setWordIdsInput] = useState("");
    const [wordsLoading, setWordsLoading] = useState(false);
    const [wordsError, setWordsError] = useState<string | null>(null);
    const [wordsByLessonId, setWordsByLessonId] = useState<Record<number, VocabWord[]>>({});
    const [wordSearch, setWordSearch] = useState("");
    const [wordSelections, setWordSelections] = useState<Record<number, string[]>>({});
    const [toolsOpen, setToolsOpen] = useState(false);
    const [toolsTab, setToolsTab] = useState<"extract" | "map" | "job">("extract");
    const [dictOpen, setDictOpen] = useState(false);
    const [extractBanner, setExtractBanner] = useState<string | null>(null);
    const [mapBanner, setMapBanner] = useState<string | null>(null);
    const extractBannerTimer = useRef<ReturnType<typeof setTimeout>>();
    const mapBannerTimer = useRef<ReturnType<typeof setTimeout>>();
    const [savingNewWords, setSavingNewWords] = useState<Record<number, boolean>>({});
    const [newWordErrors, setNewWordErrors] = useState<Record<number, string | null>>({});
    const [newWordSuccess, setNewWordSuccess] = useState<Record<number, string | null>>({});

    useEffect(() => {
        setExtractError(null);
        setExtractResult(null);
        setMapIdsInput("");
        setMapError(null);
        setMapResult(null);
        setJobId(null);
        setJob(null);
        setJobTitle("Vocab Job");
        setWordIdsInput("");
        setWordsError(null);
        setWordsByLessonId({});
        setWordSearch("");
        setWordSelections({});
        setSavingNewWords({});
        setNewWordErrors({});
        setNewWordSuccess({});
    }, [lessonId]);

    useEffect(() => {
        if (!lessonDetail) return;

        const nextSelections: Record<number, string[]> = {};
        lessonDetail.lesson_details?.forEach((detail) => {
            const words = (detail.new_words ?? [])
                .map((word) => normalizeWord(cleanWordToken(word.word)))
                .filter(Boolean);
            nextSelections[detail.id] = Array.from(new Set(words));
        });

        setWordSelections(nextSelections);
    }, [lessonDetail]);

    const normalized = useMemo(() => {
        if (!extractResult) return null;

        const normalizedJobId = extractResult.job_id ?? extractResult.jobId ?? null;
        const extractedTotal =
            extractResult.extracted_words_total ?? extractResult.extractedWordsTotal ?? 0;
        const newTotal = extractResult.new_words_total ?? extractResult.newWordsTotal ?? 0;
        const existingTotal =
            extractResult.existing_words_total ?? extractResult.existingWordsTotal ?? 0;
        const newWords = extractResult.new_words ?? extractResult.newWords ?? [];
        const existingWords = extractResult.existing_words ?? extractResult.existingWords ?? [];

        return {
            jobId: normalizedJobId,
            extractedTotal,
            newTotal,
            existingTotal,
            newWords,
            existingWords,
        };
    }, [extractResult]);

    const availableListeningLessonIds = useMemo(
        () => lessonDetail?.lesson_details?.map((item) => item.id) ?? [],
        [lessonDetail],
    );
    const listeningLessons = lessonDetail?.lesson_details ?? [];

    const refreshLessonDetail = useCallback(async () => {
        if (!Number.isFinite(numericLessonId) || numericLessonId <= 0) return;
        const res = await api.getLessonDetail(numericLessonId, { size: 100 });
        if (res.success && res.lesson) {
            setLessonDetail(res.lesson);
        }
    }, [numericLessonId, setLessonDetail]);

    const parsedMapIds = useMemo(() => {
        const ids = mapIdsInput
            .split(/[,\s]+/)
            .map((raw) => raw.trim())
            .filter(Boolean)
            .map((raw) => Number(raw))
            .filter((n) => Number.isFinite(n) && n > 0);

        return Array.from(new Set(ids)).sort((a, b) => a - b);
    }, [mapIdsInput]);

    const parsedWordIds = useMemo(() => {
        const ids = wordIdsInput
            .split(/[,\s]+/)
            .map((raw) => raw.trim())
            .filter(Boolean)
            .map((raw) => Number(raw))
            .filter((n) => Number.isFinite(n) && n > 0);

        return Array.from(new Set(ids)).sort((a, b) => a - b);
    }, [wordIdsInput]);

    const handleExtract = async () => {
        if (!Number.isFinite(numericLessonId) || numericLessonId <= 0) {
            setExtractError("Invalid lesson id.");
            return;
        }

        setExtracting(true);
        setExtractError(null);
        setExtractResult(null);
        setJob(null);
        setJobId(null);

        try {
            const res = await api.extractVocabFromLesson(numericLessonId, {
                include_stop_words: includeStopWords,
            });

            if (!res.success) {
                setExtractError(res.message || "Failed to extract vocab from lesson.");
                return;
            }

            setExtractResult(res.data);
            const nextJobId = res.data.job_id ?? res.data.jobId ?? null;
            setJobId(nextJobId);
            if (nextJobId) {
                setJobTitle("Vocab Enrichment Job");
                setToolsOpen(true);
                setToolsTab("job");
            } else {
                setToolsOpen(true);
                setToolsTab("extract");
            }

            const normalizedJobId = nextJobId;
            const extractedTotal =
                res.data.extracted_words_total ?? res.data.extractedWordsTotal ?? 0;
            const newTotal = res.data.new_words_total ?? res.data.newWordsTotal ?? 0;
            const existingTotal = res.data.existing_words_total ?? res.data.existingWordsTotal ?? 0;
            const bannerMsg = normalizedJobId
                ? `Extracted ${extractedTotal} words \u2022 ${newTotal} new \u2022 ${existingTotal} existing \u2022 Job #${normalizedJobId} queued`
                : `Extracted ${extractedTotal} words \u2022 ${newTotal} new \u2022 ${existingTotal} existing`;
            clearTimeout(extractBannerTimer.current);
            setExtractBanner(bannerMsg);
            extractBannerTimer.current = setTimeout(() => setExtractBanner(null), 10000);
        } catch (err: unknown) {
            setExtractError(
                err instanceof Error ? err.message : "Failed to extract vocab from lesson.",
            );
        } finally {
            setExtracting(false);
        }
    };

    const normalizedMap = useMemo(() => {
        if (!mapResult) return null;
        return {
            jobId: mapResult.job_id ?? mapResult.jobId ?? null,
            totalLessons: mapResult.total_lessons ?? mapResult.totalLessons ?? null,
            listeningLessonIds:
                mapResult.listening_lesson_ids ?? mapResult.listeningLessonIds ?? [],
        };
    }, [mapResult]);

    const handleMapScript = async () => {
        if (!Number.isFinite(numericLessonId) || numericLessonId <= 0) {
            setMapError("Invalid lesson id.");
            return;
        }

        setMapping(true);
        setMapError(null);
        setMapResult(null);
        setJob(null);
        setJobId(null);

        try {
            const res = await api.mapVocabScriptForLesson(
                numericLessonId,
                parsedMapIds.length ? { listening_lesson_ids: parsedMapIds } : undefined,
            );

            if (!res.success) {
                setMapError(res.message || "Failed to map script tokens to vocab IDs.");
                return;
            }

            setMapResult(res.data);

            const nextJobId = res.data.job_id ?? res.data.jobId ?? null;
            setJobId(nextJobId);
            if (nextJobId) {
                setJobTitle("Vocab Script Map Job");
                setToolsOpen(true);
                setToolsTab("job");
            } else {
                setToolsOpen(true);
                setToolsTab("map");
            }

            const totalLessons = res.data.total_lessons ?? res.data.totalLessons ?? null;
            const mapBannerMsg = nextJobId
                ? `Map Script job #${nextJobId} queued${totalLessons != null ? ` \u2022 ${totalLessons} lessons` : ""}`
                : `Script mapping complete${totalLessons != null ? ` \u2022 ${totalLessons} lessons` : ""}`;
            clearTimeout(mapBannerTimer.current);
            setMapBanner(mapBannerMsg);
            mapBannerTimer.current = setTimeout(() => setMapBanner(null), 10000);
        } catch (err: unknown) {
            setMapError(
                err instanceof Error ? err.message : "Failed to map script tokens to vocab IDs.",
            );
        } finally {
            setMapping(false);
        }
    };

    const fetchJobStatus = useCallback(async (id: number) => {
        try {
            const res = await api.getVocabJob(id);
            if (res.success) {
                const jobData = res.data;
                setJob(jobData);
                return ["COMPLETED", "FAILED", "PARTIAL"].includes(jobData.status);
            }
        } catch {
            // keep last known job state
        }

        return false;
    }, []);

    useEffect(() => {
        if (!jobId) return;

        void fetchJobStatus(jobId);
        const interval = window.setInterval(async () => {
            const finished = await fetchJobStatus(jobId);
            if (finished) window.clearInterval(interval);
        }, 1600);

        return () => window.clearInterval(interval);
    }, [fetchJobStatus, jobId]);

    const handleRefreshJob = async () => {
        if (!jobId) return;
        setRefreshingJob(true);
        await fetchJobStatus(jobId);
        setRefreshingJob(false);
    };

    const playAudio = (url: string | null | undefined) => {
        if (url) void new Audio(url).play();
    };

    const getWordDef = (w: VocabWord) => {
        // map new structure to old interface if needed, or just return the primary sense
        const sense = w.senses?.[0];
        return sense
            ? {
                  meaning: {
                      definition: sense.definition,
                      translation: sense.translation,
                      example: sense.examples?.[0]?.sentence,
                  },
                  pronunciations: w.pronunciations,
              }
            : undefined;
    };

    const handleLoadWords = async () => {
        if (!Number.isFinite(numericLessonId) || numericLessonId <= 0) {
            setWordsError("Invalid lesson id.");
            return;
        }

        const idsToFetch = parsedWordIds.length ? parsedWordIds : availableListeningLessonIds;
        if (idsToFetch.length === 0) {
            setWordsError("No listening lessons found for this lesson.");
            return;
        }

        setWordsLoading(true);
        setWordsError(null);

        try {
            const res = await api.getWordDefinition(idsToFetch);
            const data = (res as { data?: Record<string, VocabWord[]> }).data ?? {};
            const parsed: Record<number, VocabWord[]> = {};

            Object.entries(data).forEach(([key, words]) => {
                const id = Number(key);
                if (Number.isFinite(id)) parsed[id] = words ?? [];
            });

            setWordsByLessonId(parsed);
        } catch (err: unknown) {
            setWordsError(err instanceof Error ? err.message : "Failed to load word definitions.");
        } finally {
            setWordsLoading(false);
        }
    };

    const toggleWordSelection = (lessonItemId: number, key: string) => {
        setWordSelections((prev) => {
            const current = new Set(prev[lessonItemId] ?? []);
            if (current.has(key)) {
                current.delete(key);
            } else {
                current.add(key);
            }
            return { ...prev, [lessonItemId]: Array.from(current) };
        });
    };

    const clearWordSelections = (lessonItemId: number) => {
        setWordSelections((prev) => ({ ...prev, [lessonItemId]: [] }));
    };

    const handleSaveNewWords = async (detail: ListeningLessonDTO, candidates: WordCandidate[]) => {
        const selectedKeys = new Set(wordSelections[detail.id] ?? []);
        const selectedWords = candidates.filter((candidate) => selectedKeys.has(candidate.key));

        setSavingNewWords((prev) => ({ ...prev, [detail.id]: true }));
        setNewWordErrors((prev) => ({ ...prev, [detail.id]: null }));
        setNewWordSuccess((prev) => ({ ...prev, [detail.id]: null }));

        try {
            const clearRes = await api.deleteListeningLessonNewWords(detail.id);
            if (!clearRes.success) {
                throw new Error(clearRes.message || "Failed to clear existing new words.");
            }

            if (selectedWords.length > 0) {
                const createRes = await api.bulkCreateListeningLessonNewWords({
                    listening_lesson_id: detail.id,
                    words: selectedWords.map((word) => ({
                        word: word.word,
                        word_id: word.wordId ?? undefined,
                    })),
                });

                if (!createRes.success) {
                    throw new Error(createRes.message || "Failed to save new words.");
                }
            }

            await refreshLessonDetail();
            setNewWordSuccess((prev) => ({ ...prev, [detail.id]: "New words updated." }));
            window.setTimeout(() => {
                setNewWordSuccess((prev) => ({ ...prev, [detail.id]: null }));
            }, 3000);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to save new words.";
            setNewWordErrors((prev) => ({ ...prev, [detail.id]: message }));
        } finally {
            setSavingNewWords((prev) => ({ ...prev, [detail.id]: false }));
        }
    };

    const headerTitle =
        lessonMeta?.name ?? lessonDetail?.lesson_name ?? `Lesson #${lessonId ?? ""}`;

    const jobTotals = useMemo(() => {
        if (!job) return { total: 0, completed: 0, failed: 0 };
        const anyJob = job as unknown as Record<string, unknown>;

        const total = Number(anyJob.total_words ?? anyJob.total_items ?? anyJob.total ?? 0) || 0;
        const completed =
            Number(anyJob.completed_words ?? anyJob.completed_items ?? anyJob.completed ?? 0) || 0;
        const failed =
            Number(anyJob.failed_words ?? anyJob.failed_items ?? anyJob.failed ?? 0) || 0;

        return { total, completed, failed };
    }, [job]);

    const uniqueWords = useMemo(() => {
        const all = Object.values(wordsByLessonId).flat();
        const byId = new Map<number, VocabWord>();
        all.forEach((w) => {
            if (typeof w?.id === "number" && !byId.has(w.id)) {
                byId.set(w.id, w);
            }
        });
        return Array.from(byId.values()).sort((a, b) =>
            (a.lemma || "").localeCompare(b.lemma || ""),
        );
    }, [wordsByLessonId]);

    const filteredWords = useMemo(() => {
        const term = wordSearch.trim().toLowerCase();
        if (!term) return uniqueWords;
        return uniqueWords.filter((w) => (w.lemma || "").toLowerCase().includes(term));
    }, [uniqueWords, wordSearch]);

    const progress =
        jobTotals.total > 0 ? Math.floor((jobTotals.completed / jobTotals.total) * 100) : 0;

    const jobStatusClass = (() => {
        if (!job) return "bg-slate-100 text-slate-700 border-slate-200";
        if (job.status === "COMPLETED") return "bg-emerald-50 text-emerald-700 border-emerald-100";
        if (job.status === "FAILED") return "bg-rose-50 text-rose-700 border-rose-100";
        if (job.status === "PARTIAL") return "bg-amber-50 text-amber-700 border-amber-100";
        if (job.status === "RUNNING") return "bg-brand/10 text-brand border-brand/30";
        return "bg-amber-50 text-amber-700 border-amber-100";
    })();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void headerTitle; // kept for potential future use

    return (
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
            {/* ══ LEFT COLUMN: Sentences (scrollable) ══ */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Sentences ({listeningLessons.length})
                    </h2>
                    {/* Inline banners */}
                    <div className="flex items-center gap-2">
                        {extractBanner && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                {extractBanner}
                                <button
                                    type="button"
                                    onClick={() => setExtractBanner(null)}
                                    className="ml-1 text-emerald-400 hover:text-emerald-600"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        {mapBanner && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                {mapBanner}
                                <button
                                    type="button"
                                    onClick={() => setMapBanner(null)}
                                    className="ml-1 text-blue-400 hover:text-blue-600"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable sentence list */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                    {listeningLessons.length === 0 ? (
                        <div className="p-4 bg-white border rounded-xl text-sm text-slate-500">
                            No listening lessons found for this lesson.
                        </div>
                    ) : (
                        listeningLessons.map((detail) => {
                            const transcript = getSentenceTranscript(detail);
                            const candidates = buildWordCandidates(detail, transcript);
                            const selectedKeys = wordSelections[detail.id] ?? [];
                            const savingWords = savingNewWords[detail.id] ?? false;
                            const saveError = newWordErrors[detail.id];
                            const saveSuccess = newWordSuccess[detail.id];

                            return (
                                <div
                                    key={detail.id}
                                    className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                                Sentence #{detail.id} • Type {detail.type}
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {transcript || "No transcript provided"}
                                            </p>
                                        </div>
                                        <span className="text-[11px] px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                                            Status {detail.status}
                                        </span>
                                    </div>

                                    <div className="text-xs text-slate-600">
                                        {detail.translated_script || "\u2014"}
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] uppercase text-slate-500">
                                                New Words
                                            </p>
                                            <span className="text-xs text-slate-500">
                                                {selectedKeys.length} selected
                                            </span>
                                        </div>

                                        {candidates.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {candidates.map((candidate) => {
                                                    const isSelected = selectedKeys.includes(
                                                        candidate.key,
                                                    );
                                                    return (
                                                        <button
                                                            key={candidate.key}
                                                            type="button"
                                                            onClick={() =>
                                                                toggleWordSelection(
                                                                    detail.id,
                                                                    candidate.key,
                                                                )
                                                            }
                                                            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                                                isSelected
                                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                                    : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700"
                                                            }`}
                                                        >
                                                            {candidate.word}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-500">
                                                No words found for this sentence.
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSaveNewWords(detail, candidates)
                                                }
                                                disabled={savingWords}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                                            >
                                                {savingWords ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-3.5 h-3.5" />
                                                        Save
                                                    </>
                                                )}
                                            </button>
                                            {selectedKeys.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => clearWordSelections(detail.id)}
                                                    className="text-xs text-slate-500 hover:text-slate-700"
                                                    disabled={savingWords}
                                                >
                                                    Clear
                                                </button>
                                            )}
                                            {saveSuccess && (
                                                <span className="text-xs text-emerald-600">
                                                    {saveSuccess}
                                                </span>
                                            )}
                                            {saveError && (
                                                <span className="text-xs text-rose-600">
                                                    {saveError}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ══ RIGHT COLUMN: Tools panel (sticky) ══ */}
            <div className="w-80 shrink-0 flex flex-col gap-3 overflow-y-auto">
                {/* ── Actions ── */}
                <div className="bg-white border rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900">Actions</h3>

                    <div className="space-y-2">
                        <Btn.Primary
                            onClick={handleExtract}
                            disabled={extracting || !numericLessonId}
                        >
                            {extracting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Extracting...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Extract Vocab
                                </>
                            )}
                        </Btn.Primary>

                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={includeStopWords}
                                onChange={(e) => setIncludeStopWords(e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-brand focus:ring-brand/40"
                            />
                            Include stop words
                        </label>

                        <div className="border-t border-slate-100 pt-2">
                            <Btn.Primary
                                onClick={handleMapScript}
                                disabled={mapping || !numericLessonId}
                            >
                                {mapping ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Mapping...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Map Script
                                    </>
                                )}
                            </Btn.Primary>
                        </div>
                    </div>
                </div>

                {/* ── Error banners ── */}
                {extractError && (
                    <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {extractError}
                    </div>
                )}
                {mapError && (
                    <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {mapError}
                    </div>
                )}

                {/* ── Extract results (inline) ── */}
                {normalized && (
                    <div className="bg-white border rounded-xl p-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                            <span className="font-semibold">
                                Extracted: {normalized.extractedTotal}
                            </span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-emerald-700 font-semibold">
                                New: {normalized.newTotal}
                            </span>
                            <span className="text-slate-300">&bull;</span>
                            <span>Existing: {normalized.existingTotal}</span>
                        </div>
                        <details className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                                Words ({normalized.newWords.length} new,{" "}
                                {normalized.existingWords.length} existing)
                            </summary>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {normalized.newWords.map((w) => (
                                    <span
                                        key={w}
                                        className="text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700"
                                    >
                                        {w}
                                    </span>
                                ))}
                                {normalized.existingWords.map((w) => (
                                    <span
                                        key={w}
                                        className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600"
                                    >
                                        {w}
                                    </span>
                                ))}
                            </div>
                        </details>
                    </div>
                )}

                {/* ── Map Script options ── */}
                <details className="rounded-xl border border-slate-200 bg-white">
                    <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-700">
                        Map Script Options
                    </summary>
                    <div className="px-3 pb-3 pt-1 space-y-2">
                        <Input
                            value={mapIdsInput}
                            onChange={(e) => setMapIdsInput(e.target.value)}
                            placeholder="Listening lesson IDs (optional)"
                        />
                        {availableListeningLessonIds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {availableListeningLessonIds.slice(0, 12).map((id) => {
                                    const selected = parsedMapIds.includes(id);
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => {
                                                setMapIdsInput((prev) => {
                                                    const current = new Set(
                                                        prev
                                                            .split(/[,\s]+/)
                                                            .map((r) => Number(r))
                                                            .filter(
                                                                (n) => Number.isFinite(n) && n > 0,
                                                            ),
                                                    );
                                                    if (current.has(id)) {
                                                        current.delete(id);
                                                    } else {
                                                        current.add(id);
                                                    }
                                                    return Array.from(current)
                                                        .sort((a, b) => a - b)
                                                        .join(", ");
                                                });
                                            }}
                                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition ${
                                                selected
                                                    ? "bg-brand text-white border-brand"
                                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                            }`}
                                        >
                                            #{id}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {normalizedMap && (
                            <div className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1.5">
                                Job #{normalizedMap.jobId ?? "\u2014"}
                                {normalizedMap.totalLessons !== null &&
                                    ` \u2022 ${normalizedMap.totalLessons} lessons`}
                            </div>
                        )}
                    </div>
                </details>

                {/* ── Job Status ── */}
                {jobId && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900">{jobTitle}</span>
                            <button
                                type="button"
                                onClick={handleRefreshJob}
                                disabled={refreshingJob}
                                className="text-xs text-slate-500 hover:text-slate-700"
                            >
                                <RefreshCcw
                                    className={`w-3.5 h-3.5 ${refreshingJob ? "animate-spin" : ""}`}
                                />
                            </button>
                        </div>
                        {job ? (
                            <>
                                <div className="flex items-center gap-2 text-xs">
                                    <span
                                        className={`px-2 py-0.5 rounded-full border font-semibold ${jobStatusClass}`}
                                    >
                                        {job.status}
                                    </span>
                                    <span className="text-slate-500">
                                        {jobTotals.completed}/{jobTotals.total}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-1.5 bg-brand transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Loading...
                            </div>
                        )}
                    </div>
                )}

                {/* ── Word Dictionary ── */}
                <div className="rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <button
                            type="button"
                            onClick={() => setDictOpen((prev) => !prev)}
                            className="flex items-center gap-1.5 text-left"
                        >
                            {dictOpen ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span className="text-xs font-semibold text-slate-900">
                                Dictionary ({uniqueWords.length})
                            </span>
                        </button>
                        <Btn.Primary
                            onClick={handleLoadWords}
                            disabled={wordsLoading || !numericLessonId}
                        >
                            {wordsLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <span className="text-xs">Load</span>
                            )}
                        </Btn.Primary>
                    </div>
                    {dictOpen && (
                        <div className="px-3 pb-3 space-y-2">
                            <Input
                                value={wordSearch}
                                onChange={(e) => setWordSearch(e.target.value)}
                                placeholder="Search..."
                            />
                            {wordsError && (
                                <div className="text-xs text-rose-600">{wordsError}</div>
                            )}
                            {filteredWords.length === 0 && uniqueWords.length > 0 && (
                                <div className="text-xs text-slate-500">No matches.</div>
                            )}
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                {filteredWords.map((w) => {
                                    const def = getWordDef(w);
                                    const meaning = def?.meaning ?? {
                                        definition: "",
                                        translation: "",
                                        example: "",
                                    };
                                    const pronunciations = def?.pronunciations ?? [];
                                    const top = pronunciations[0];
                                    return (
                                        <div
                                            key={w.id}
                                            className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 space-y-1"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <span className="text-xs font-semibold text-slate-900">
                                                        {w.lemma || w.word}
                                                    </span>
                                                    {top?.ipa && (
                                                        <span className="text-[11px] text-slate-400 ml-1.5">
                                                            {top.ipa}
                                                        </span>
                                                    )}
                                                </div>
                                                {top?.audio && (
                                                    <button
                                                        type="button"
                                                        onClick={() => playAudio(top.audio)}
                                                        className="text-[11px] text-brand hover:underline"
                                                    >
                                                        Play
                                                    </button>
                                                )}
                                            </div>
                                            {meaning.translation && (
                                                <div className="text-xs font-medium text-brand">
                                                    {meaning.translation}
                                                </div>
                                            )}
                                            {meaning.definition && (
                                                <div className="text-[11px] text-slate-600 line-clamp-2">
                                                    {meaning.definition}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonVocabPage;
