import { dashboardApi } from "./dashboard";
import { jobsApi } from "./jobs";
import { lessonsApi } from "./lessons";
import { filesApi } from "./files";
import { audioApi } from "./audioProcessing";
import { vocabApi } from "./vocab";
import { categoriesApi } from "./categories";

export const api = {
    ...dashboardApi,
    ...jobsApi,
    ...lessonsApi,
    ...filesApi,
    ...audioApi,
    ...vocabApi,
    ...categoriesApi,
};

export {
    dashboardApi,
    jobsApi,
    lessonsApi,
    filesApi,
    audioApi,
    vocabApi,
    categoriesApi,
};
