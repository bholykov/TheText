import { useState } from 'react';

interface SearchPanelProps {
  onClose: () => void;
  onFind: (query: string, options: { caseSensitive: boolean }) => void;
  onReplace: (query: string, replacement: string, options: { caseSensitive: boolean }) => void;
  onReplaceAll: (query: string, replacement: string, options: { caseSensitive: boolean }) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
}

export default function SearchPanel({
  onClose,
  onFind,
  onReplace,
  onReplaceAll,
  onFindNext,
  onFindPrevious,
}: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [showReplace, setShowReplace] = useState(false);

  const handleFind = () => {
    if (searchQuery) {
      onFind(searchQuery, { caseSensitive });
    }
  };

  const handleReplace = () => {
    if (searchQuery) {
      onReplace(searchQuery, replaceText, { caseSensitive });
    }
  };

  const handleReplaceAll = () => {
    if (searchQuery) {
      onReplaceAll(searchQuery, replaceText, { caseSensitive });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        onFindPrevious();
      } else {
        onFindNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 p-2">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          placeholder="Find"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value) {
              onFind(e.target.value, { caseSensitive });
            }
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
          autoFocus
        />
        <button
          onClick={onFindPrevious}
          className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
          title="Previous (Shift+Enter)"
        >
          ↑
        </button>
        <button
          onClick={onFindNext}
          className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
          title="Next (Enter)"
        >
          ↓
        </button>
        <label className="flex items-center text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => {
              setCaseSensitive(e.target.checked);
              if (searchQuery) {
                onFind(searchQuery, { caseSensitive: e.target.checked });
              }
            }}
            className="mr-1"
          />
          Aa
        </label>
        <button
          onClick={() => setShowReplace(!showReplace)}
          className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
          title="Toggle Replace"
        >
          {showReplace ? '▼' : '▶'} Replace
        </button>
        <button
          onClick={onClose}
          className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>

      {showReplace && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Replace"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
          />
          <button
            onClick={handleReplace}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Replace All
          </button>
        </div>
      )}
    </div>
  );
}
