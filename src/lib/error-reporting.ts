// Error reporting — simple console.error (plus de Lovable).

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[AgroSphere Error]", error, context);
}