// src/pages/lesson/LessonVocabPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCcw, Save, Sparkles } from "lucide-react";
import { api } from "../../api/client";
import { Btn } from "../../components/ui/Btn";
import { Input } from "../../components/ui/Input";
import type { LessonOutletContext } from "../LessonViewPage";
import type { ExtractVocabFromLessonResponse, MapVocabScriptResponse, VocabJob } from "../../types/vocabJob";
import type { ListeningLessonDTO, VocabWord } from "../../types";

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
            extractResult.extracted_words_total ??
            extractResult.extractedWordsTotal ??
            0;
        const newTotal =
            extractResult.new_words_total ??
            extractResult.newWordsTotal ??
            0;
        const existingTotal =
            extractResult.existing_words_total ??
            extractResult.existingWordsTotal ??
            0;
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
        [lessonDetail]
    );
    const listeningLessons = lessonDetail?.lesson_details ?? [];

    const refreshLessonDetail = useCallback(async () => {
        if (!Number.isFinite(numericLessonId) || numericLessonId <= 0) return;
        const res = await api.getLessonDetail(numericLessonId);
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
            const nextJobId = (res.data.job_id ?? res.data.jobId) ?? null;
            setJobId(nextJobId);
            if (nextJobId) setJobTitle("Vocab Enrichment Job");
        } catch (err: unknown) {
            setExtractError(err instanceof Error ? err.message : "Failed to extract vocab from lesson.");
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
                mapResult.listening_lesson_ids ??
                mapResult.listeningLessonIds ??
                [],
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
                parsedMapIds.length ? { listening_lesson_ids: parsedMapIds } : undefined
            );

            if (!res.success) {
                setMapError(res.message || "Failed to map script tokens to vocab IDs.");
                return;
            }

            setMapResult(res.data);

            const nextJobId = res.data.job_id ?? res.data.jobId ?? null;
            setJobId(nextJobId);
            if (nextJobId) setJobTitle("Vocab Script Map Job");
        } catch (err: unknown) {
            setMapError(err instanceof Error ? err.message : "Failed to map script tokens to vocab IDs.");
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
        return sense ? {
            meaning: {
                definition: sense.definition,
                translation: sense.translation,
                example: sense.examples?.[0]?.sentence
            },
            pronunciations: w.pronunciations
        } : undefined;
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

        const total =
            Number(anyJob.total_words ?? anyJob.total_items ?? anyJob.total ?? 0) || 0;
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
        return Array.from(byId.values()).sort((a, b) => (a.lemma || "").localeCompare(b.lemma || ""));
    }, [wordsByLessonId]);

    const filteredWords = useMemo(() => {
        const term = wordSearch.trim().toLowerCase();
        if (!term) return uniqueWords;
        return uniqueWords.filter((w) => (w.lemma || "").toLowerCase().includes(term));
    }, [uniqueWords, wordSearch]);

    const progress =
        jobTotals.total > 0
            ? Math.floor((jobTotals.completed / jobTotals.total) * 100)
            : 0;

    const jobStatusClass = (() => {
        if (!job) return "bg-slate-100 text-slate-700 border-slate-200";
        if (job.status === "COMPLETED") return "bg-emerald-50 text-emerald-700 border-emerald-100";
        if (job.status === "FAILED") return "bg-rose-50 text-rose-700 border-rose-100";
        if (job.status === "PARTIAL") return "bg-amber-50 text-amber-700 border-amber-100";
        if (job.status === "RUNNING") return "bg-brand/10 text-brand border-brand/30";
        return "bg-amber-50 text-amber-700 border-amber-100";
    })();

    return (
        <div className="space-y-4">
            <div className="p-4 bg-white border rounded-xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-slate-900">Vocabulary</h2>
                        <p className="text-slate-600 text-sm">
                            Extract vocabulary from transcripts in <span className="font-semibold">{headerTitle}</span>.
                        </p>
                    </div>

                    <Btn.Primary onClick={handleExtract} disabled={extracting || !numericLessonId}>
                        {extracting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Extracting…
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Extract From Lesson
                            </>
                        )}
                    </Btn.Primary>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        checked={includeStopWords}
                        onChange={(e) => setIncludeStopWords(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/40"
                    />
                    Include stop words
                </label>

                {extractError && (
                    <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                        {extractError}
                    </div>
                )}

                {normalized && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="text-[11px] uppercase tracking-wide text-slate-500">Extracted</div>
                                <div className="text-xl font-semibold text-slate-900">{normalized.extractedTotal}</div>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                                <div className="text-[11px] uppercase tracking-wide text-emerald-700">New</div>
                                <div className="text-xl font-semibold text-emerald-700">{normalized.newTotal}</div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <div className="text-[11px] uppercase tracking-wide text-slate-500">Existing</div>
                                <div className="text-xl font-semibold text-slate-900">{normalized.existingTotal}</div>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <details className="rounded-xl border border-slate-200 bg-white p-3">
                                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                                    New words ({normalized.newWords.length})
                                </summary>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {normalized.newWords.length ? (
                                        normalized.newWords.map((w) => (
                                            <span
                                                key={w}
                                                className="text-xs px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700"
                                            >
                                                {w}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-500">None</span>
                                    )}
                                </div>
                            </details>

                            <details className="rounded-xl border border-slate-200 bg-white p-3">
                                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                                    Existing words ({normalized.existingWords.length})
                                </summary>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {normalized.existingWords.length ? (
                                        normalized.existingWords.map((w) => (
                                            <span
                                                key={w}
                                                className="text-xs px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700"
                                            >
                                                {w}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-500">None</span>
                                    )}
                                </div>
                            </details>
                        </div>

                        {normalized.jobId ? (
                            <div className="text-sm text-slate-600">
                                Vocab enrichment job queued: <span className="font-semibold">#{normalized.jobId}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                                <CheckCircle2 className="w-4 h-4" />
                                No new words to enrich.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border rounded-xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold text-slate-900">Map Script Tokens</h3>
                        <p className="text-slate-600 text-sm">
                            Rebuild `listening_lessons.script` by mapping transcript tokens to existing vocab IDs.
                        </p>
                    </div>

                    <Btn.Primary onClick={handleMapScript} disabled={mapping || !numericLessonId}>
                        {mapping ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Mapping…
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Map Script
                            </>
                        )}
                    </Btn.Primary>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">
                        Listening lesson IDs (optional, comma separated)
                    </label>
                    <Input
                        value={mapIdsInput}
                        onChange={(e) => setMapIdsInput(e.target.value)}
                        placeholder="20, 21"
                    />
                    <p className="text-xs text-slate-500">
                        Leave empty to process all listening lessons under this lesson.
                    </p>

                    {availableListeningLessonIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {availableListeningLessonIds.slice(0, 18).map((id) => {
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
                                                        .map((raw) => Number(raw))
                                                        .filter((n) => Number.isFinite(n) && n > 0)
                                                );
                                                if (current.has(id)) {
                                                    current.delete(id);
                                                } else {
                                                    current.add(id);
                                                }
                                                return Array.from(current).sort((a, b) => a - b).join(", ");
                                            });
                                        }}
                                        className={`
                                            px-3 py-1 rounded-full text-xs font-semibold border transition
                                            ${selected
                                                ? "bg-brand text-white border-brand"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}
                                        `}
                                    >
                                        #{id}
                                    </button>
                                );
                            })}
                            {availableListeningLessonIds.length > 18 && (
                                <span className="text-xs text-slate-500 self-center">
                                    +{availableListeningLessonIds.length - 18} more
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {mapError && (
                    <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                        {mapError}
                    </div>
                )}

                {normalizedMap && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-1">
                        <div>
                            Job queued:{" "}
                            <span className="font-semibold">
                                #{normalizedMap.jobId ?? "—"}
                            </span>
                        </div>
                        {normalizedMap.totalLessons !== null && (
                            <div>
                                Total lessons:{" "}
                                <span className="font-semibold">{normalizedMap.totalLessons}</span>
                            </div>
                        )}
                        {normalizedMap.listeningLessonIds.length > 0 && (
                            <div className="text-xs text-slate-500">
                                Listening lesson IDs: {normalizedMap.listeningLessonIds.join(", ")}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border rounded-xl space-y-4">
                <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900">Sentence New Words</h3>
                    <p className="text-slate-600 text-sm">
                        Choose which words in each sentence should be marked as new vocabulary.
                    </p>
                </div>

                {listeningLessons.length === 0 ? (
                    <div className="text-sm text-slate-500">No listening lessons found for this lesson.</div>
                ) : (
                    <div className="space-y-3">
                        {listeningLessons.map((detail) => {
                            const transcript = getSentenceTranscript(detail);
                            const candidates = buildWordCandidates(detail, transcript);
                            const selectedKeys = wordSelections[detail.id] ?? [];
                            const savingWords = savingNewWords[detail.id] ?? false;
                            const saveError = newWordErrors[detail.id];
                            const saveSuccess = newWordSuccess[detail.id];

                            return (
                                <div key={detail.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                                Sentence #{detail.id} • Type {detail.type}
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {transcript || "No transcript provided"}
                                            </p>
                                        </div>
                                        <span className="text-[11px] px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                                            Status {detail.status}
                                        </span>
                                    </div>

                                    <div className="text-xs text-slate-600">
                                        {detail.translated_script || "—"}
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] uppercase text-slate-500">New Words</p>
                                            <span className="text-xs text-slate-500">
                                                {selectedKeys.length} selected
                                            </span>
                                        </div>

                                        {candidates.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {candidates.map((candidate) => {
                                                    const isSelected = selectedKeys.includes(candidate.key);
                                                    return (
                                                        <button
                                                            key={candidate.key}
                                                            type="button"
                                                            onClick={() => toggleWordSelection(detail.id, candidate.key)}
                                                            className={`text-xs px-2 py-1 rounded-full border transition-colors ${isSelected
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
                                            <div className="text-xs text-slate-500">No words found for this sentence.</div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleSaveNewWords(detail, candidates)}
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
                                                        Save new words
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
                                                    Clear selection
                                                </button>
                                            )}
                                            {saveSuccess && (
                                                <span className="text-xs text-emerald-600">{saveSuccess}</span>
                                            )}
                                        </div>

                                        {saveError && (
                                            <div className="text-xs text-rose-600">{saveError}</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border rounded-xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold text-slate-900">Lesson Words</h3>
                        <p className="text-slate-600 text-sm">
                            Fetch vocab words referenced by mapped scripts (after Map Script).
                        </p>
                    </div>

                    <Btn.Primary onClick={handleLoadWords} disabled={wordsLoading || !numericLessonId}>
                        {wordsLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading…
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Load Words
                            </>
                        )}
                    </Btn.Primary>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">
                            Listening lesson IDs (optional)
                        </label>
                        <Input
                            value={wordIdsInput}
                            onChange={(e) => setWordIdsInput(e.target.value)}
                            placeholder="20, 21 (leave empty to load all)"
                        />
                        <p className="text-[11px] text-slate-500">
                            API supports up to 10 IDs per request; the frontend batches automatically.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Search words</label>
                        <Input
                            value={wordSearch}
                            onChange={(e) => setWordSearch(e.target.value)}
                            placeholder="Search by word…"
                        />
                    </div>
                </div>

                {availableListeningLessonIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {availableListeningLessonIds.slice(0, 18).map((id) => {
                            const selected = parsedWordIds.includes(id);
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => {
                                        setWordIdsInput((prev) => {
                                            const current = new Set(
                                                prev
                                                    .split(/[,\s]+/)
                                                    .map((raw) => Number(raw))
                                                    .filter((n) => Number.isFinite(n) && n > 0)
                                            );
                                            if (current.has(id)) {
                                                current.delete(id);
                                            } else {
                                                current.add(id);
                                            }
                                            return Array.from(current).sort((a, b) => a - b).join(", ");
                                        });
                                    }}
                                    className={`
                                        px-3 py-1 rounded-full text-xs font-semibold border transition
                                        ${selected
                                            ? "bg-brand text-white border-brand"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}
                                    `}
                                >
                                    #{id}
                                </button>
                            );
                        })}
                        {availableListeningLessonIds.length > 18 && (
                            <span className="text-xs text-slate-500 self-center">
                                +{availableListeningLessonIds.length - 18} more
                            </span>
                        )}
                    </div>
                )}

                {wordsError && (
                    <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                        {wordsError}
                    </div>
                )}

                {Object.keys(wordsByLessonId).length > 0 && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                                {uniqueWords.length} unique words
                            </span>
                            <span className="text-xs">
                                from {Object.keys(wordsByLessonId).length} listening lesson(s)
                            </span>
                        </div>

                        {filteredWords.length === 0 ? (
                            <div className="text-sm text-slate-500">No words found.</div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {filteredWords.map((w) => {
                                    const def = getWordDef(w);
                                    const meaning = def?.meaning ?? { definition: "", translation: "", example: "" };
                                    const pronunciations = def?.pronunciations ?? [];
                                    const top = pronunciations[0];

                                    return (
                                        <div
                                            key={w.id}
                                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {w.lemma || w.word}
                                                    </div>
                                                    {top?.ipa ? (
                                                        <div className="text-xs text-slate-500">{top.ipa}</div>
                                                    ) : null}
                                                </div>

                                                {top?.audio ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => playAudio(top.audio)}
                                                        className="px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Play
                                                    </button>
                                                ) : null}
                                            </div>

                                            {meaning.translation ? (
                                                <div className="text-sm font-semibold text-brand">
                                                    → {meaning.translation}
                                                </div>
                                            ) : null}
                                            {meaning.definition ? (
                                                <div className="text-sm text-slate-700 line-clamp-3">
                                                    {meaning.definition}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-400">No definition</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {jobId && (
                <div className="p-4 bg-white border rounded-xl space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-slate-900">{jobTitle}</h3>
                            <p className="text-xs text-slate-500">
                                Polling `/api/v1/vocab/jobs/{jobId}` for progress.
                            </p>
                        </div>

                        <Btn.Secondary onClick={handleRefreshJob} disabled={refreshingJob}>
                            <RefreshCcw className={`w-4 h-4 ${refreshingJob ? "animate-spin" : ""}`} />
                            Refresh
                        </Btn.Secondary>
                    </div>

                    {job ? (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${jobStatusClass}`}>
                                    {job.status}
                                </span>
                                <span className="text-slate-600">
                                    {jobTotals.completed}/{jobTotals.total} completed • {jobTotals.failed} failed
                                </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-2 bg-brand transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {job.items?.length ? (
                                <details className="rounded-xl border border-slate-200 bg-white p-3">
                                    <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                                        Items ({job.items.length})
                                    </summary>
                                    <div className="mt-3 space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                        {job.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between gap-3 text-sm border border-slate-100 rounded-lg px-3 py-2 bg-slate-50"
                                            >
                                                <span className="font-medium text-slate-900">
                                                    {(item as unknown as { word?: string }).word || `Item #${item.id}`}
                                                </span>
                                                <span className="text-xs text-slate-600">{item.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ) : null}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading job…
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LessonVocabPage;
