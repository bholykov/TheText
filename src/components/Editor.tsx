import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';

interface EditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  language?: string;
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

export default function Editor({ initialContent = '', onChange, language = 'text' }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isReady, setIsReady] = useState(false);

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
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          },
          '.cm-content': {
            padding: '8px 0',
          },
          '.cm-line': {
            padding: '0 8px',
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
}
