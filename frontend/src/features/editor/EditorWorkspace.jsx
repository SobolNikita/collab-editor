import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import Editor from "@monaco-editor/react";
import { useCollabSession } from "./collab/useCollabSession.js";
import { loadDocument } from "../../shared/api/roomApi.js";

const sampleCodeByLanguage = {
  javascript: "function hello() {\n  return 'Hello collaborative world';\n}\n",
  typescript:
    "function hello(): string {\n  return 'Hello collaborative world';\n}\n",
  python: "def hello():\n    return 'Hello collaborative world'\n",
  go: 'package main\n\nfunc main() {\n\tprintln("Hello collaborative world")\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n  std::cout << "Hello collaborative world";\n}\n',
  json: '{\n  "message": "Hello collaborative world"\n}\n',
};

export const EditorWorkspace = forwardRef(function EditorWorkspace(
  {
    roomCode: roomCodeProp,
    language,
    username,
    wsUrl,
    token,
    onStatusChange,
    isRoomOwner,
    onLanguageChange,
    myColorFromApi,
  },
  ref,
) {
  const [editorRef, setEditorRef] = useState(null);
  const [monacoRef, setMonacoRef] = useState(null);
  const [modelRef, setModelRef] = useState(null);
  const [docLoadedForRoom, setDocLoadedForRoom] = useState(null);

  const roomName = roomCodeProp ?? "";
  const yjsIsLoading = Boolean(roomName) && docLoadedForRoom !== roomName;

  const {
    connectionStatus,
    isSynced,
    participants,
    setSharedLanguage: setCollabLanguage,
    onEditorReady,
  } = useCollabSession({
    wsUrl,
    roomName,
    monaco: monacoRef,
    editor: editorRef,
    model: modelRef,
    username,
    token,
    defaultText: sampleCodeByLanguage[language] ?? "",
    language,
    onLanguageChangeFromCollab: onLanguageChange,
    isRoomOwner,
    myColorFromApi,
  });

  useImperativeHandle(
    ref,
    () => ({
      getContent() {
        return editorRef?.getValue() ?? "";
      },
      setSharedLanguage(lang) {
        setCollabLanguage(lang);
      },
    }),
    [editorRef, setCollabLanguage],
  );

  useEffect(() => {
    onStatusChange({
      roomName,
      connectionStatus,
      isSynced,
      participants,
    });
  }, [connectionStatus, isSynced, onStatusChange, participants, roomName]);

  useEffect(() => {
    if (!roomName) return undefined;

    let cancelled = false;
    loadDocument(roomName)
      .then((data) => {
        if (!cancelled && data.ok && data.yjsState?.length) {
          onEditorReady(data.yjsState);
        }
      })
      .catch((error) => {
        console.error("Error loading YJS state:", error);
      })
      .finally(() => {
        if (!cancelled) {
          setDocLoadedForRoom(roomName);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [onEditorReady, roomName]);

  const showCollabWarmup =
    !yjsIsLoading &&
    !isSynced &&
    connectionStatus !== "offline";

  return yjsIsLoading ? (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-surface">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent"
        aria-hidden
      />
      <p className="text-sm font-medium tracking-wide text-zinc-400">
        Загрузка содержимого…
      </p>
    </div>
  ) : (
    <div className="relative h-full w-full bg-surface">
      <Editor
        height="100%"
        language={language}
        defaultLanguage={language}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          tabSize: 2,
          automaticLayout: true,
          lineNumbers: "on",
          trimAutoWhitespace: true,
        }}
        onMount={(editor, monaco) => {
          setEditorRef(editor);
          setMonacoRef(monaco);
          setModelRef(editor.getModel());
        }}
      />
      {showCollabWarmup ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-surface/85 backdrop-blur-[2px]">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent"
            aria-hidden
          />
          <p className="text-sm font-medium text-zinc-400">
            Синхронизация редактора…
          </p>
        </div>
      ) : null}
    </div>
  );
});
