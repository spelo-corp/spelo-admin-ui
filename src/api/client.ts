import { dashboardApi } from "./dashboard";
import { jobsApi } from "./jobs";
import { lessonsApi } from "./lessons";
import { filesApi } from "./files";
import { audioApi } from "./audioProcessing";
import { vocabApi } from "./vocab";
import { categoriesApi } from "./categories";
import { collectionsApi } from "./collections";

export const api = {
    ...dashboardApi,
    ...jobsApi,
    ...lessonsApi,
    ...filesApi,
    ...audioApi,
    ...vocabApi,
    ...categoriesApi,
    ...collectionsApi,
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
};
