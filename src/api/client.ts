import { audioApi } from "./audioProcessing";
import { booksApi } from "./books";
import { categoriesApi } from "./categories";
import { collectionsApi } from "./collections";
import { dashboardApi } from "./dashboard";
import { filesApi } from "./files";
import { jobsApi } from "./jobs";
import { lessonsApi } from "./lessons";
import { vocabApi } from "./vocab";

export const api = {
    ...dashboardApi,
    ...jobsApi,
    ...lessonsApi,
    ...filesApi,
    ...audioApi,
    ...vocabApi,
    ...categoriesApi,
    ...collectionsApi,
    ...booksApi,
};

export {
    dashboardApi,
    jobsApi,
    lessonsApi,
    filesApi,
    audioApi,
    vocabApi,
    categoriesApi,
    collectionsApi,
    booksApi,
};
