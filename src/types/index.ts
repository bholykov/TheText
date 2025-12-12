export interface FileData {
  path: string | null;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
}

export interface EditorState {
  currentFile: FileData;
  recentFiles: string[];
}
