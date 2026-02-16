import { BASE_URL, getAuthHeaders, handle } from "./base";
import type {
    CollectionListResponse,
    CollectionRequestDTO,
    CollectionTerminologyDTO,
} from "../types/collection";

async function getCollections() {
    return handle<CollectionListResponse>(
        await fetch(`${BASE_URL}/api/v1/collections`, {
            method: "GET",
            headers: getAuthHeaders(),
        })
    );
}

async function getLibraryCollections(page = 0, size = 20) {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    return handle<CollectionListResponse>(
        await fetch(`${BASE_URL}/api/v1/collections/library?${query.toString()}`, {
            method: "GET",
            headers: getAuthHeaders(),
        })
    );
}

async function createCollection(payload: CollectionRequestDTO) {
    return handle<{ success: boolean; data?: any }>(
        await fetch(`${BASE_URL}/api/v1/collections`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );
}

async function updateCollection(collectionId: number, payload: CollectionRequestDTO) {
    return handle<{ success: boolean; data?: any }>(
        await fetch(`${BASE_URL}/api/v1/collections/${collectionId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );
}

async function deleteCollection(collectionId: number) {
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL}/api/v1/collections/${collectionId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        })
    );
}

async function getCollectionTerminologies(collectionId: number) {
    const query = new URLSearchParams({ collection_id: String(collectionId) });
    return handle<{ success: boolean; data: CollectionTerminologyDTO[] }>(
        await fetch(`${BASE_URL}/api/v1/collections/terminologies?${query.toString()}`, {
            method: "GET",
            headers: getAuthHeaders(),
        })
    );
}

async function addTerminologiesToCollection(payload: CollectionTerminologyDTO[]) {
    return handle<{ success: boolean; data?: any }>(
        await fetch(`${BASE_URL}/api/v1/collections/terminologies`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        })
    );
}

async function deleteWordFromCollection(collectionId: number, wordId: number) {
    const query = new URLSearchParams({
        collection_id: String(collectionId),
        word_id: String(wordId),
    });
    return handle<{ success: boolean }>(
        await fetch(`${BASE_URL}/api/v1/collections/word?${query.toString()}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        })
    );
}

export const collectionsApi = {
    getCollections,
    getLibraryCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    getCollectionTerminologies,
    addTerminologiesToCollection,
    deleteWordFromCollection,
};
