import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-4">
      <p className="text-6xl font-bold tracking-tight text-zinc-600">404</p>
      <p className="text-zinc-400">Страница не найдена</p>
      <Link
        to="/"
        className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
      >
        На главную
      </Link>
    </div>
  );
}
