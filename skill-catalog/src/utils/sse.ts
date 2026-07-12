/**
 * Minimal Server-Sent Events reader for `fetch` streaming responses.
 *
 * Port AI streams events shaped as:
 *   event: <name>\n
 *   data: <json-or-text>\n
 *   \n
 *
 * We can't use the browser `EventSource` API because that only supports GET;
 * Port AI is invoked via POST with an auth header and a JSON body.
 */
export type SseEvent = { event: string; data: string };

export async function* readSse(
  response: Response,
  signal?: AbortSignal
): AsyncGenerator<SseEvent> {
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) return;
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Events are separated by a blank line.
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const parsed = parseEvent(raw);
        if (parsed) yield parsed;
      }
    }

    const tail = parseEvent(buffer);
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}

function parseEvent(raw: string): SseEvent | null {
  if (!raw.trim()) return null;

  let event = "message";
  const dataLines: string[] = [];

  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^ /, ""));
    }
  }

  return { event, data: dataLines.join("\n") };
}
