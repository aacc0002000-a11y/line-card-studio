export function toLiffErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export function isLiffCancellationError(error: unknown) {
  const message = toLiffErrorMessage(error, "").toLowerCase();

  return message.includes("cancel") || message.includes("canceled") || message.includes("cancelled");
}
