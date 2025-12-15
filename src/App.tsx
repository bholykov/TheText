import { useState, useCallback, useEffect, useRef } from 'react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { listen } from '@tauri-apps/api/event';
import Editor, { EditorHandle } from './components/Editor';
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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
      }
    } catch (error) {
      console.error('Error opening file:', error);
      alert('Failed to open file: ' + error);
    }
  }, []);

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

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const handleAbout = useCallback(() => {
    alert(
      'TheText v0.1.0\n\n' +
      'A fast, efficient text editor built with Tauri, React, and TypeScript.\n\n' +
      'Features:\n' +
      '• CodeMirror 6 for powerful editing\n' +
      '• Multi-language syntax highlighting\n' +
      '• Find and Replace with search panel\n' +
      '• Recent files tracking\n' +
      '• Dark/Light theme support\n' +
      '• Native macOS menu integration\n' +
      '• Small binary (~12MB)\n' +
      '• Low memory usage (~80MB)\n\n' +
      'Built with ❤️ using Tauri + React + TypeScript'
    );
  }, []);

  // Listen for native menu events
  useEffect(() => {
    const unlistenNew = listen('menu-new-file', () => handleNew());
    const unlistenOpen = listen('menu-open-file', () => handleOpen());
    const unlistenSave = listen('menu-save-file', () => handleSave());
    const unlistenSaveAs = listen('menu-save-file-as', () => handleSaveAs());
    const unlistenUndo = listen('menu-undo', () => handleUndo());
    const unlistenRedo = listen('menu-redo', () => handleRedo());
    const unlistenCut = listen('menu-cut', () => handleCut());
    const unlistenCopy = listen('menu-copy', () => handleCopy());
    const unlistenPaste = listen('menu-paste', () => handlePaste());
    const unlistenFind = listen('menu-find', () => setShowSearchPanel(true));
    const unlistenReplace = listen('menu-replace', () => setShowSearchPanel(true));
    const unlistenToggleTheme = listen('menu-toggle-theme', () => handleToggleTheme());
    const unlistenAbout = listen('menu-about', () => handleAbout());

    // Cleanup listeners
    return () => {
      unlistenNew.then((fn) => fn());
      unlistenOpen.then((fn) => fn());
      unlistenSave.then((fn) => fn());
      unlistenSaveAs.then((fn) => fn());
      unlistenUndo.then((fn) => fn());
      unlistenRedo.then((fn) => fn());
      unlistenCut.then((fn) => fn());
      unlistenCopy.then((fn) => fn());
      unlistenPaste.then((fn) => fn());
      unlistenFind.then((fn) => fn());
      unlistenReplace.then((fn) => fn());
      unlistenToggleTheme.then((fn) => fn());
      unlistenAbout.then((fn) => fn());
    };
  }, [handleNew, handleOpen, handleSave, handleSaveAs, handleUndo, handleRedo, handleCut, handleCopy, handlePaste, handleToggleTheme, handleAbout]);

  // Update window title with filename and dirty state
  useEffect(() => {
    const title = currentFile.name + (currentFile.isDirty ? ' •' : '') + ' - TheText';
    document.title = title;
  }, [currentFile.name, currentFile.isDirty]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
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
