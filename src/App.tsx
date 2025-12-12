import { useState, useCallback, useEffect, useRef } from 'react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import Editor, { EditorHandle } from './components/Editor';
import MenuBar from './components/MenuBar';
import SearchPanel from './components/SearchPanel';
import StatusBar from './components/StatusBar';
import { FileData } from './types';

const getFileExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || 'text';
  return ext;
};

const getLanguageFromExtension = (ext: string): string => {
  const extMap: Record<string, string> = {
    'md': 'markdown',
    'markdown': 'markdown',
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'py': 'python',
    'txt': 'text',
  };
  return extMap[ext] || 'text';
};

const RECENT_FILES_KEY = 'thetext_recent_files';
const MAX_RECENT_FILES = 10;

function App() {
  const editorRef = useRef<EditorHandle>(null);
  const [currentFile, setCurrentFile] = useState<FileData>({
    path: null,
    name: 'Untitled',
    content: '',
    language: 'text',
    isDirty: false,
  });
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [recentFiles, setRecentFiles] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_FILES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToRecentFiles = useCallback((filePath: string) => {
    setRecentFiles((prev) => {
      const filtered = prev.filter((f) => f !== filePath);
      const updated = [filePath, ...filtered].slice(0, MAX_RECENT_FILES);
      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleNew = useCallback(() => {
    if (currentFile.isDirty) {
      const confirmNew = window.confirm('You have unsaved changes. Create new file anyway?');
      if (!confirmNew) return;
    }

    setCurrentFile({
      path: null,
      name: 'Untitled',
      content: '',
      language: 'text',
      isDirty: false,
    });
  }, [currentFile.isDirty]);

  const handleOpen = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Text Files',
            extensions: ['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py'],
          },
          {
            name: 'All Files',
            extensions: ['*'],
          },
        ],
      });

      if (selected && typeof selected === 'string') {
        const content = await readTextFile(selected);
        const fileName = selected.split('/').pop() || selected.split('\\').pop() || 'Untitled';
        const ext = getFileExtension(fileName);
        const language = getLanguageFromExtension(ext);

        setCurrentFile({
          path: selected,
          name: fileName,
          content,
          language,
          isDirty: false,
        });
        addToRecentFiles(selected);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      alert('Failed to open file: ' + error);
    }
  }, [addToRecentFiles]);

  const handleOpenRecent = useCallback(async (filePath: string) => {
    try {
      const content = await readTextFile(filePath);
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'Untitled';
      const ext = getFileExtension(fileName);
      const language = getLanguageFromExtension(ext);

      setCurrentFile({
        path: filePath,
        name: fileName,
        content,
        language,
        isDirty: false,
      });
      addToRecentFiles(filePath);
    } catch (error) {
      console.error('Error opening recent file:', error);
      alert('Failed to open file: ' + error);
      // Remove from recent files if it failed to open
      setRecentFiles((prev) => {
        const updated = prev.filter((f) => f !== filePath);
        localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [addToRecentFiles]);

  const handleSave = useCallback(async () => {
    try {
      if (currentFile.path) {
        // Save to existing path
        await writeTextFile(currentFile.path, currentFile.content);
        setCurrentFile((prev) => ({ ...prev, isDirty: false }));
      } else {
        // No path yet, trigger Save As
        await handleSaveAs();
      }
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Failed to save file: ' + error);
    }
  }, [currentFile.path, currentFile.content]);

  const handleSaveAs = useCallback(async () => {
    try {
      const selected = await save({
        defaultPath: currentFile.name,
        filters: [
          {
            name: 'Text Files',
            extensions: ['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py'],
          },
          {
            name: 'All Files',
            extensions: ['*'],
          },
        ],
      });

      if (selected) {
        await writeTextFile(selected, currentFile.content);
        const fileName = selected.split('/').pop() || selected.split('\\').pop() || 'Untitled';
        const ext = getFileExtension(fileName);
        const language = getLanguageFromExtension(ext);

        setCurrentFile((prev) => ({
          ...prev,
          path: selected,
          name: fileName,
          language,
          isDirty: false,
        }));
      }
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Failed to save file: ' + error);
    }
  }, [currentFile.name, currentFile.content]);

  const handleContentChange = useCallback((newContent: string) => {
    setCurrentFile((prev) => ({
      ...prev,
      content: newContent,
      isDirty: true,
    }));
  }, []);

  const handleUndo = useCallback(() => {
    editorRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.redo();
  }, []);

  const handleCut = useCallback(() => {
    editorRef.current?.cut();
  }, []);

  const handleCopy = useCallback(() => {
    editorRef.current?.copy();
  }, []);

  const handlePaste = useCallback(() => {
    editorRef.current?.paste();
  }, []);

  const handleFind = useCallback((query: string, options: { caseSensitive: boolean }) => {
    editorRef.current?.find(query, options);
  }, []);

  const handleFindNext = useCallback(() => {
    editorRef.current?.findNext();
  }, []);

  const handleFindPrevious = useCallback(() => {
    editorRef.current?.findPrevious();
  }, []);

  const handleReplace = useCallback((query: string, replacement: string, options: { caseSensitive: boolean }) => {
    editorRef.current?.replace(query, replacement, options);
  }, []);

  const handleReplaceAll = useCallback((query: string, replacement: string, options: { caseSensitive: boolean }) => {
    editorRef.current?.replaceAll(query, replacement, options);
  }, []);

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorPosition({ line, column });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            handleNew();
            break;
          case 'o':
            e.preventDefault();
            handleOpen();
            break;
          case 's':
            e.preventDefault();
            if (e.shiftKey) {
              handleSaveAs();
            } else {
              handleSave();
            }
            break;
          case 'f':
            e.preventDefault();
            setShowSearchPanel(true);
            break;
          case 'h':
            e.preventDefault();
            setShowSearchPanel(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNew, handleOpen, handleSave, handleSaveAs]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <MenuBar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onOpenRecent={handleOpenRecent}
        recentFiles={recentFiles}
        currentFileName={currentFile.name}
        hasUnsavedChanges={currentFile.isDirty}
      />
      {showSearchPanel && (
        <SearchPanel
          onClose={() => setShowSearchPanel(false)}
          onFind={handleFind}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onFindNext={handleFindNext}
          onFindPrevious={handleFindPrevious}
        />
      )}
      <div className="flex-1 overflow-hidden">
        <Editor
          ref={editorRef}
          initialContent={currentFile.content}
          onChange={handleContentChange}
          onCursorChange={handleCursorChange}
          language={currentFile.language}
        />
      </div>
      <StatusBar
        line={cursorPosition.line}
        column={cursorPosition.column}
        fileSize={new Blob([currentFile.content]).size}
        encoding="UTF-8"
        language={currentFile.language}
      />
    </div>
  );
}

export default App;
