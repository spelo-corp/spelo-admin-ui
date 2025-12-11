import { dashboardApi } from "./dashboard";
import { jobsApi } from "./jobs";
import { lessonsApi } from "./lessons";
import { filesApi } from "./files";
import { audioApi } from "./audioProcessing";
import { vocabApi } from "./vocab";

export const api = {
    ...dashboardApi,
    ...jobsApi,
    ...lessonsApi,
    ...filesApi,
    ...audioApi,
    ...vocabApi,
};

export {
    dashboardApi,
    jobsApi,
    lessonsApi,
    filesApi,
    audioApi,
    vocabApi,
};
