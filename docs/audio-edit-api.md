# Audio Job Finalization

Finalize an audio processing job by materializing the aligned sentences into `ListeningLesson` entities that belong to a lesson.

## Endpoint

- **Method:** `POST`
- **URL:** `/api/v1/audio-processing/jobs/{id}/finalize`
- **Path parameters:** `id` — numeric id of the audio processing job to finalize.
- **Request body:** none

## Behavior

1. Loads the job and validates it is of type `AUDIO_PROCESSING`.
2. Merges the serialized `inputPayload` and the `resultPayload` (or job item output) so the final audio URL, lesson id, and sentence list are available.
3. Validates that:
   - sentence list exists (`AudioSentenceDTO`s produced by the worker),
   - the job contains a lesson id, and
   - an audio URL/object name can be resolved (`resolveAudioUrl` throws `BadRequestException` if it cannot).
4. For each sentence, creates a `ListeningLesson` record with:
   - `lessonId` and optional `lessonType` from the job metadata,
   - the aligned sentence text and translated script,
   - `ListeningLessonData` including `audio` URL and the inferred `audioObjectName`, and
   - parsed script tokens (`ListeningLessonScript`).
5. Persists all lessons via `listeningLessonRepository.saveAll(...)` and returns them as the response payload.

## Response

A `200 OK` `ApiResponse<List<ListeningLesson>>` containing the newly created lessons. Each lesson includes fields such as `id`, `lesson_id`, `type`, `status`, `script`, `original_script`, `translated_script`, and the `data` object with `audio`, `audio_object_name`, `start`, and `end` times.

### Example success payload

```json
{
  "success": true,
  "code": 200,
  "message": "Successfully!",
  "data": [
    {
      "id": 123,
      "lesson_id": 42,
      "type": 1,
      "status": 1,
      "script": [ { "word": "The" }, { "word": "cat" } ],
      "original_script": "The cat sat on the mat",
      "translated_script": "Con mèo ngồi trên thảm",
      "data": {
        "audio": "https://cdn.example.com/bucket/temp/audio/uuid_file.mp3",
        "audio_object_name": "temp/audio/uuid_file.mp3",
        "start": 0.0,
        "end": 1.2
      }
    }
  ]
}
```

## Errors

- `400 Bad Request` when the job is missing, the job is not an audio processing job, there are no sentences, the lesson id is absent, or the audio URL/object cannot be resolved (`BadRequestException`).
- `500 Internal Server Error` for unexpected failures (e.g., persistence errors).

Refer to `AudioProcessingService.finalizeJob(...)` for the exact validation and persistence logic.

