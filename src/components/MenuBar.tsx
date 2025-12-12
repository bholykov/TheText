import { useState } from 'react';

interface MenuBarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onOpenRecent?: (filePath: string) => void;
  recentFiles?: string[];
  currentFileName?: string;
  hasUnsavedChanges?: boolean;
}

export default function MenuBar({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onOpenRecent,
  recentFiles = [],
  currentFileName,
  hasUnsavedChanges,
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
      <div className="flex items-center h-8 text-sm">
        {/* File Menu */}
        <div className="relative">
          <button
            className="px-3 h-8 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => handleMenuClick('file')}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div className="absolute top-8 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg min-w-48 z-50">
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                onClick={() => handleMenuItemClick(onNew)}
              >
                <span>New</span>
                <span className="text-gray-500 text-xs">Ctrl+N</span>
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                onClick={() => handleMenuItemClick(onOpen)}
              >
                <span>Open...</span>
                <span className="text-gray-500 text-xs">Ctrl+O</span>
              </button>
              <div className="border-t border-gray-300 dark:border-gray-600 my-1"></div>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                onClick={() => handleMenuItemClick(onSave)}
              >
                <span>Save</span>
                <span className="text-gray-500 text-xs">Ctrl+S</span>
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                onClick={() => handleMenuItemClick(onSaveAs)}
              >
                <span>Save As...</span>
                <span className="text-gray-500 text-xs">Ctrl+Shift+S</span>
              </button>
              {recentFiles.length > 0 && (
                <>
                  <div className="border-t border-gray-300 dark:border-gray-600 my-1"></div>
                  <div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400">Recent Files</div>
                  {recentFiles.map((file, index) => (
                    <button
                      key={file}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm truncate"
                      onClick={() => handleMenuItemClick(() => onOpenRecent?.(file))}
                      title={file}
                    >
                      {file.split('/').pop() || file.split('\\').pop()}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            className="px-3 h-8 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => handleMenuClick('edit')}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div className="absolute top-8 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg min-w-48 z-50">
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                onClick={() => handleMenuItemClick(() => onUndo?.())}
              >
                <span>Undo</span>
                <span className="text-gray-500 text-xs">Ctrl+Z</span>
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                onClick={() => handleMenuItemClick(() => onRedo?.())}
              >
                <span>Redo</span>
                <span className="text-gray-500 text-xs">Ctrl+Y</span>
              </button>
              <div className="border-t border-gray-300 dark:border-gray-600 my-1"></div>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                onClick={() => handleMenuItemClick(() => onCut?.())}
              >
                <span>Cut</span>
                <span className="text-gray-500 text-xs">Ctrl+X</span>
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                onClick={() => handleMenuItemClick(() => onCopy?.())}
              >
                <span>Copy</span>
                <span className="text-gray-500 text-xs">Ctrl+C</span>
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                onClick={() => handleMenuItemClick(() => onPaste?.())}
              >
                <span>Paste</span>
                <span className="text-gray-500 text-xs">Ctrl+V</span>
              </button>
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 px-4 text-gray-600 dark:text-gray-400">
          {currentFileName ? (
            <span>
              {currentFileName}
              {hasUnsavedChanges && <span className="ml-1">•</span>}
            </span>
          ) : (
            <span className="italic">Untitled{hasUnsavedChanges && ' •'}</span>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
