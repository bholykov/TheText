import { FileData } from '../types';
import { X } from 'lucide-react';

interface TabBarProps {
  files: FileData[];
  activeIndex: number;
  onTabClick: (index: number) => void;
  onTabClose: (index: number) => void;
}

export default function TabBar({ files, activeIndex, onTabClick, onTabClose }: TabBarProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 overflow-x-auto">
      {files.map((file, index) => (
        <div
          key={`${file.path || 'untitled'}-${index}`}
          className={`
            group flex items-center gap-2 px-4 py-2 min-w-[120px] max-w-[200px] cursor-pointer
            border-r border-gray-300 dark:border-gray-700
            ${
              index === activeIndex
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
          onClick={() => onTabClick(index)}
        >
          <span className="truncate flex-1 text-sm">
            {file.name}
            {file.isDirty && <span className="ml-1">●</span>}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(index);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-600 rounded p-0.5 transition-opacity"
            aria-label="Close tab"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
