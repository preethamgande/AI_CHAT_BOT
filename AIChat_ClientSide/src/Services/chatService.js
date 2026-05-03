const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function streamChatMessage(chatId, message, onChunk, onDone, onError) {
  const url = `${BASE_URL}/chat/stream?chatId=${chatId}&message=${encodeURIComponent(message)}`;

  const eventSource = new EventSource(url, {
    withCredentials: true,
  });

  eventSource.onmessage = (event) => {
    if (event.data === "[DONE]") {
      eventSource.close();
      onDone?.();
      return;
    }

    onChunk(event.data);
  };

  eventSource.onerror = () => {
    eventSource.close();
    onError?.("Unable to stream response.");
  };

  return eventSource;
}
