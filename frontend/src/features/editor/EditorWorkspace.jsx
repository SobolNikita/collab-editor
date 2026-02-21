import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { useCollabSession } from "./collab/useCollabSession.js";
import { getRoomName } from "../../shared/api/contracts.js";

const sampleCodeByLanguage = {
  javascript: "function hello() {\n  return 'Hello collaborative world';\n}\n",
  typescript: "function hello(): string {\n  return 'Hello collaborative world';\n}\n",
  python: "def hello():\n    return 'Hello collaborative world'\n",
  go: "package main\n\nfunc main() {\n\tprintln(\"Hello collaborative world\")\n}\n",
  cpp: "#include <iostream>\n\nint main() {\n  std::cout << \"Hello collaborative world\";\n}\n",
  json: '{\n  "message": "Hello collaborative world"\n}\n',
};

export const EditorWorkspace = forwardRef(function EditorWorkspace(
  {
    fileId,
    language,
    username,
    wsUrl,
    token,
    onStatusChange,
  },
  ref,
) {
  const [editorRef, setEditorRef] = useState(null);
  const [monacoRef, setMonacoRef] = useState(null);
  const [modelRef, setModelRef] = useState(null);
  const roomName = useMemo(() => getRoomName(fileId), [fileId]);

  useImperativeHandle(ref, () => ({
    getContent() {
      return editorRef?.getValue() ?? "";
    },
  }), [editorRef]);

  const { connectionStatus, isSynced, participants } = useCollabSession({
    wsUrl,
    roomName,
    monaco: monacoRef,
    editor: editorRef,
    model: modelRef,
    username,
    token,
  });

  useEffect(() => {
    onStatusChange({
      roomName,
      connectionStatus,
      isSynced,
      participants,
    });
  }, [connectionStatus, isSynced, onStatusChange, participants, roomName]);

  return (
    <div className="h-full w-full bg-surface">
      <Editor
        height="100%"
        language={language}
        defaultLanguage={language}
        defaultValue={sampleCodeByLanguage[language] ?? ""}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          tabSize: 2,
          automaticLayout: true,
          lineNumbers: "on",
        }}
        onMount={(editor, monaco) => {
          setEditorRef(editor);
          setMonacoRef(monaco);
          setModelRef(editor.getModel());
        }}
      />
    </div>
  );
});
