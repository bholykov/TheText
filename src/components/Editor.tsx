import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { undo, redo } from '@codemirror/commands';
import { SearchQuery } from '@codemirror/search';
import { markdown } from '@codemirror/lang-markdown';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';

interface EditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  language?: string;
}

export interface EditorHandle {
  undo: () => void;
  redo: () => void;
  cut: () => void;
  copy: () => void;
  paste: () => void;
  find: (query: string, options: { caseSensitive: boolean }) => void;
  findNext: () => void;
  findPrevious: () => void;
  replace: (query: string, replacement: string, options: { caseSensitive: boolean }) => void;
  replaceAll: (query: string, replacement: string, options: { caseSensitive: boolean }) => void;
  getView: () => EditorView | null;
}

const getLanguageExtension = (lang: string) => {
  switch (lang.toLowerCase()) {
    case 'markdown':
    case 'md':
      return markdown();
    case 'javascript':
    case 'js':
    case 'jsx':
      return javascript({ jsx: true });
    case 'typescript':
    case 'ts':
    case 'tsx':
      return javascript({ jsx: true, typescript: true });
    case 'html':
      return html();
    case 'css':
      return css();
    case 'json':
      return json();
    case 'python':
    case 'py':
      return python();
    default:
      return [];
  }
};

const Editor = forwardRef<EditorHandle, EditorProps>(({ initialContent = '', onChange, onCursorChange, language = 'text' }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isReady, setIsReady] = useState(false);

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (viewRef.current) {
        undo(viewRef.current);
      }
    },
    redo: () => {
      if (viewRef.current) {
        redo(viewRef.current);
      }
    },
    cut: () => {
      if (viewRef.current) {
        document.execCommand('cut');
      }
    },
    copy: () => {
      if (viewRef.current) {
        document.execCommand('copy');
      }
    },
    paste: () => {
      if (viewRef.current) {
        document.execCommand('paste');
      }
    },
    find: (query: string, options: { caseSensitive: boolean }) => {
      if (viewRef.current) {
        const searchQuery = new SearchQuery({
          search: query,
          caseSensitive: options.caseSensitive,
        });
        const { from } = viewRef.current.state.selection.main;
        const cursor = searchQuery.getCursor(viewRef.current.state.doc, from);
        const result = cursor.next();
        if (!result.done) {
          viewRef.current.dispatch({
            selection: { anchor: result.value.from, head: result.value.to },
            scrollIntoView: true,
          });
        }
      }
    },
    findNext: () => {
      if (viewRef.current) {
        // Use CodeMirror's built-in find next
        const panel = viewRef.current.dom.querySelector('.cm-search') as HTMLElement;
        const nextButton = panel?.querySelector('[name="next"]') as HTMLButtonElement;
        nextButton?.click();
      }
    },
    findPrevious: () => {
      if (viewRef.current) {
        // Use CodeMirror's built-in find previous
        const panel = viewRef.current.dom.querySelector('.cm-search') as HTMLElement;
        const prevButton = panel?.querySelector('[name="prev"]') as HTMLButtonElement;
        prevButton?.click();
      }
    },
    replace: (query: string, replacement: string, options: { caseSensitive: boolean }) => {
      if (viewRef.current) {
        const searchQuery = new SearchQuery({
          search: query,
          caseSensitive: options.caseSensitive,
        });
        const { from } = viewRef.current.state.selection.main;
        const cursor = searchQuery.getCursor(viewRef.current.state.doc, from);
        const result = cursor.next();
        if (!result.done) {
          viewRef.current.dispatch({
            changes: { from: result.value.from, to: result.value.to, insert: replacement },
            selection: { anchor: result.value.from + replacement.length },
          });
        }
      }
    },
    replaceAll: (query: string, replacement: string, options: { caseSensitive: boolean }) => {
      if (viewRef.current) {
        const searchQuery = new SearchQuery({
          search: query,
          caseSensitive: options.caseSensitive,
        });
        const cursor = searchQuery.getCursor(viewRef.current.state.doc);
        const changes = [];
        let result = cursor.next();
        while (!result.done) {
          changes.push({ from: result.value.from, to: result.value.to, insert: replacement });
          result = cursor.next();
        }
        if (changes.length > 0) {
          viewRef.current.dispatch({ changes });
        }
      }
    },
    getView: () => viewRef.current,
  }));

  useEffect(() => {
    if (!editorRef.current) return;

    const languageExt = getLanguageExtension(language);

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        basicSetup,
        languageExt,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
          if (update.selectionSet && onCursorChange) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            const lineNumber = line.number;
            const column = pos - line.from + 1;
            onCursorChange(lineNumber, column);
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '16px',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: "'SF Mono', 'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'Courier New', monospace",
            lineHeight: '1.6',
          },
          '.cm-content': {
            padding: '12px 0',
          },
          '.cm-line': {
            padding: '0 12px',
            letterSpacing: '0.3px',
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    setIsReady(true);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language]);

  // Update content when initialContent changes
  useEffect(() => {
    if (viewRef.current && isReady) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== initialContent) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: initialContent,
          },
        });
      }
    }
  }, [initialContent, isReady]);

  return <div ref={editorRef} className="w-full h-full" />;
});

Editor.displayName = 'Editor';

export default Editor;
