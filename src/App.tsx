import { useState, useCallback, useEffect } from 'react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import Editor from './components/Editor';
import MenuBar from './components/MenuBar';
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
  const [currentFile, setCurrentFile] = useState<FileData>({
    path: null,
    name: 'Untitled',
    content: '',
    language: 'text',
    isDirty: false,
  });

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
        currentFileName={currentFile.name}
        hasUnsavedChanges={currentFile.isDirty}
      />
      <div className="flex-1 overflow-hidden">
        <Editor
          initialContent={currentFile.content}
          onChange={handleContentChange}
          language={currentFile.language}
        />
      </div>
    </div>
  );
}

export default App;
