/**
 * Polyfills for Safari < 18 compatibility.
 *
 * ReadableStream async iteration is required by pdfjs-dist v5's getTextContent(),
 * which does `for await (const value of readableStream)`.
 * Safari added Symbol.asyncIterator on ReadableStream in v18 and ReadableStream.from() later still.
 */

if (
  typeof ReadableStream !== "undefined" &&
  !(ReadableStream.prototype as any)[Symbol.asyncIterator]
) {
  (ReadableStream.prototype as any)[Symbol.asyncIterator] =
    async function* (): AsyncGenerator {
      const reader = (this as ReadableStream).getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    };
}

if (typeof ReadableStream !== "undefined" && !(ReadableStream as any).from) {
  (ReadableStream as any).from = function <T>(
    asyncIterable: AsyncIterable<T> | Iterable<T>,
  ): ReadableStream<T> {
    const iter =
      (asyncIterable as AsyncIterable<T>)[Symbol.asyncIterator]?.() ??
      (asyncIterable as Iterable<T>)[Symbol.iterator]?.();
    return new ReadableStream<T>({
      async pull(controller) {
        const { done, value } = await iter.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
      async cancel(reason?: unknown) {
        await iter.return?.(reason);
      },
    });
  };
}
