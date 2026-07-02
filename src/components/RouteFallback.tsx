import { Loader2 } from "lucide-react";

/** Fallback do Suspense enquanto o chunk da rota (lazy) carrega. */
export function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main">
      <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
    </div>
  );
}
