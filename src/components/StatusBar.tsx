interface StatusBarProps {
  line: number;
  column: number;
  fileSize: number;
  encoding: string;
  language: string;
  wordCount?: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function StatusBar({ line, column, fileSize, encoding, language, wordCount }: StatusBarProps) {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 px-4 py-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-4">
        <span>Ln {line}, Col {column}</span>
        {wordCount !== undefined && <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>}
        <span>{formatFileSize(fileSize)}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>{language.toUpperCase()}</span>
        <span>{encoding}</span>
      </div>
    </div>
  );
}
