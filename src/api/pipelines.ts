import type {
    CreatePipelineRequest,
    CreatePipelineStepRequest,
    PipelineDTO,
} from "../types/pipeline";
import { BASE_URL, getAuthHeaders, handle } from "./base";

export const pipelinesApi = {
    async listPipelines(jobType?: string): Promise<PipelineDTO[]> {
        const query = jobType ? `?jobType=${encodeURIComponent(jobType)}` : "";
        const res = await fetch(`${BASE_URL}/api/v1/admin/pipelines${query}`, {
            headers: getAuthHeaders(),
        });
        return handle<{ data: PipelineDTO[] }>(res).then((r) => r.data);
    },

    async getPipeline(id: number): Promise<PipelineDTO> {
        const res = await fetch(`${BASE_URL}/api/v1/admin/pipelines/${id}`, {
            headers: getAuthHeaders(),
        });
        return handle<{ data: PipelineDTO }>(res).then((r) => r.data);
    },

    async createPipeline(data: CreatePipelineRequest): Promise<PipelineDTO> {
        const res = await fetch(`${BASE_URL}/api/v1/admin/pipelines`, {
            method: "POST",
            headers: getAuthHeaders({ contentType: "application/json" }),
            body: JSON.stringify(data),
        });
        return handle<{ data: PipelineDTO }>(res).then((r) => r.data);
    },

    async updatePipeline(
        id: number,
        data: { name?: string; description?: string },
    ): Promise<PipelineDTO> {
        const res = await fetch(`${BASE_URL}/api/v1/admin/pipelines/${id}`, {
            method: "PUT",
            headers: getAuthHeaders({ contentType: "application/json" }),
            body: JSON.stringify(data),
        });
        return handle<{ data: PipelineDTO }>(res).then((r) => r.data);
    },

    async deletePipeline(id: number): Promise<void> {
        const res = await fetch(`${BASE_URL}/api/v1/admin/pipelines/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        return handle<void>(res);
    },

    async activatePipeline(id: number): Promise<PipelineDTO> {
        const res = await fetch(`${BASE_URL}/api/v1/admin/pipelines/${id}/activate`, {
            method: "POST",
            headers: getAuthHeaders(),
        });
        return handle<{ data: PipelineDTO }>(res).then((r) => r.data);
    },

    async deactivatePipeline(id: number): Promise<PipelineDTO> {
        const res = await fetch(`${BASE_URL}/api/v1/admin/pipelines/${id}/deactivate`, {
            method: "POST",
            headers: getAuthHeaders(),
        });
        return handle<{ data: PipelineDTO }>(res).then((r) => r.data);
    },

    async addStep(pipelineId: number, data: CreatePipelineStepRequest): Promise<PipelineDTO> {
        const res = await fetch(`${BASE_URL}/api/v1/admin/pipelines/${pipelineId}/steps`, {
            method: "POST",
            headers: getAuthHeaders({ contentType: "application/json" }),
            body: JSON.stringify(data),
        });
        return handle<{ data: PipelineDTO }>(res).then((r) => r.data);
    },

    async updateStep(
        pipelineId: number,
        stepId: number,
        data: Partial<CreatePipelineStepRequest>,
    ): Promise<PipelineDTO> {
        const res = await fetch(
            `${BASE_URL}/api/v1/admin/pipelines/${pipelineId}/steps/${stepId}`,
            {
                method: "PUT",
                headers: getAuthHeaders({ contentType: "application/json" }),
                body: JSON.stringify(data),
            },
        );
        return handle<{ data: PipelineDTO }>(res).then((r) => r.data);
    },

    async deleteStep(pipelineId: number, stepId: number): Promise<PipelineDTO> {
        const res = await fetch(
            `${BASE_URL}/api/v1/admin/pipelines/${pipelineId}/steps/${stepId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders(),
            },
        );
        return handle<{ data: PipelineDTO }>(res).then((r) => r.data);
    },

    async reorderSteps(pipelineId: number, stepIds: number[]): Promise<PipelineDTO> {
        const res = await fetch(`${BASE_URL}/api/v1/admin/pipelines/${pipelineId}/steps/reorder`, {
            method: "PUT",
            headers: getAuthHeaders({ contentType: "application/json" }),
            body: JSON.stringify({ stepIds }),
        });
        return handle<{ data: PipelineDTO }>(res).then((r) => r.data);
    },

    async listStepKeys(): Promise<string[]> {
        const res = await fetch(`${BASE_URL}/api/v1/admin/pipelines/step-keys`, {
            headers: getAuthHeaders(),
        });
        return handle<{ data: string[] }>(res).then((r) => r.data);
    },
};
