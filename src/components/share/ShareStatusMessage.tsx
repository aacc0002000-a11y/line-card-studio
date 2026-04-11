export function ShareStatusMessage({
  kind,
  message,
}: {
  kind: "success" | "error" | "info";
  message: string;
}) {
  const toneClassName =
    kind === "error"
      ? "text-red-600"
      : kind === "success"
        ? "text-emerald-700"
        : "text-accent";

  return <p className={`text-sm ${toneClassName}`}>{message}</p>;
}
