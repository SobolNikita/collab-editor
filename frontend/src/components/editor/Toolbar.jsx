import { isOwner } from "../../shared/api/permissions.js";
import { useState, useEffect} from "react";

const languages = ["javascript", "typescript", "python", "go", "cpp", "json"];

export function Toolbar({
  fileId,
  language,
  onLanguageChange,
  userDisplayName,
  onLogout,
  onRun,
  runLoading,
}) {

  const [isRoomOwner, setIsRoomOwner] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkOwner() {
      try {
        const result = await isOwner(fileId);
        if (isMounted) {
          setIsRoomOwner(result);
        }
      } catch (error) {
        console.error("Error while checking permissions:", error);
        if (isMounted) setIsRoomOwner(false);
      }
    }

    if (fileId) {
      checkOwner();
    }

    return () => {
      isMounted = false;
    };
  }, [fileId]);

  return (
    <header className="flex items-center justify-between border-b border-border bg-panel px-4 py-3">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
          Collab Editor
        </h1>
        <span className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-100">
          file: {fileId}
        </span>
        {onRun ? (
          <button
            type="button"
            onClick={onRun}
            disabled={runLoading}
            className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
            {runLoading ? "Running…" : "Run"}
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-300">
          Language
          <select
            className="ml-2 rounded border border-border bg-slate-800 px-2 py-1 text-xs text-slate-100"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            disabled={!isRoomOwner}>
            {languages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <span className="text-xs text-slate-400">{userDisplayName}</span>
        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="rounded border border-border bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700">
            Log out
          </button>
        ) : null}
      </div>
    </header>
  );
}
