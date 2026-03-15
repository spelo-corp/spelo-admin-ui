import { audioApi } from "./audioProcessing";
import { booksApi } from "./books";
import { categoriesApi } from "./categories";
import { collectionsApi } from "./collections";
import { comprehensionApi } from "./comprehension";
import { dashboardApi } from "./dashboard";
import { dialogueScenariosApi } from "./dialogueScenarios";
import { filesApi } from "./files";
import { jobsApi } from "./jobs";
import { lessonsApi } from "./lessons";
import { pipelinesApi } from "./pipelines";
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
    ...pipelinesApi,
    ...dialogueScenariosApi,
    ...comprehensionApi,
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
    pipelinesApi,
    dialogueScenariosApi,
    comprehensionApi,
};
