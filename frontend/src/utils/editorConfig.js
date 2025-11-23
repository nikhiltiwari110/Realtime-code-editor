// editorConfig.js - Monaco Editor configuration and language templates

export const languageTemplates = {
  javascript: "// Start coding...",
  python: "# Start coding...",
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Start coding...\n    return 0;\n}`,
  java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Start coding...\n    }\n}`,
};

/**
 * Define custom Monaco theme
 */
export const defineCustomTheme = (monaco) => {
  monaco.editor.defineTheme('custom-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'type', foreground: '4EC9B0' },
    ],
    colors: {
      'editor.background': '#1a1d2e',
      'editor.foreground': '#e0e0e0',
      'editor.lineHighlightBackground': '#2a2d3e',
      'editorLineNumber.foreground': '#5a5a6c',
      'editorLineNumber.activeForeground': '#61dafb',
      'editor.selectionBackground': '#3a4a5a',
      'editor.inactiveSelectionBackground': '#2a3a4a',
      'editorCursor.foreground': '#61dafb',
      'editorWhitespace.foreground': '#3a3a54',
      'editorIndentGuide.background': '#2a2d3e',
      'editorIndentGuide.activeBackground': '#3a3d4e',
    }
  });
  
  monaco.editor.setTheme('custom-dark');
};

/**
 * Monaco Editor options
 */
export const editorOptions = {
  fontSize: 15,
  fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
  fontLigatures: true,
  lineHeight: 24,
  letterSpacing: 0.5,
  minimap: { enabled: true, scale: 1 },
  automaticLayout: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: "on",
  tabCompletion: "on",
  quickSuggestions: true,
  wordWrap: "on",
  lineNumbers: "on",
  renderLineHighlight: "all",
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  smoothScrolling: true,
  padding: { top: 16, bottom: 16 },
  bracketPairColorization: {
    enabled: true
  },
  guides: {
    bracketPairs: true,
    indentation: true
  },
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    useShadows: true,
    verticalScrollbarSize: 12,
    horizontalScrollbarSize: 12,
  },
};