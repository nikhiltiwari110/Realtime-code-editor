// codeFormatter.js - Utility for formatting code in different languages

/**
 * Format JavaScript code
 */
const formatJavaScript = (code) => {
  try {
    // Basic JavaScript formatting
    let formatted = code.trim();
    
    // Add proper indentation
    let indent = 0;
    const lines = formatted.split('\n');
    const formattedLines = lines.map(line => {
      let trimmedLine = line.trim();
      
      // Decrease indent for closing brackets
      if (trimmedLine.startsWith('}') || trimmedLine.startsWith(']') || trimmedLine.startsWith(')')) {
        indent = Math.max(0, indent - 1);
      }
      
      const indentedLine = '  '.repeat(indent) + trimmedLine;
      
      // Increase indent for opening brackets
      if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[') || trimmedLine.endsWith('(')) {
        indent++;
      }
      
      return indentedLine;
    });
    
    return formattedLines.join('\n');
  } catch (error) {
    console.error('JavaScript formatting error:', error);
    return code;
  }
};

/**
 * Format Python code
 */
const formatPython = (code) => {
  try {
    let formatted = code.trim();
    let indent = 0;
    const lines = formatted.split('\n');
    
    const formattedLines = lines.map(line => {
      let trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) return '';
      
      // Decrease indent for lines that close blocks
      if (trimmedLine.startsWith('elif ') || 
          trimmedLine.startsWith('else:') || 
          trimmedLine.startsWith('except') || 
          trimmedLine.startsWith('finally:')) {
        indent = Math.max(0, indent - 1);
      }
      
      const indentedLine = '    '.repeat(indent) + trimmedLine;
      
      // Increase indent after lines that open blocks
      if (trimmedLine.endsWith(':')) {
        indent++;
      }
      
      // Decrease indent after return, break, continue, pass
      if (trimmedLine === 'return' || 
          trimmedLine.startsWith('return ') ||
          trimmedLine === 'break' || 
          trimmedLine === 'continue' ||
          trimmedLine === 'pass') {
        indent = Math.max(0, indent - 1);
      }
      
      return indentedLine;
    });
    
    return formattedLines.join('\n');
  } catch (error) {
    console.error('Python formatting error:', error);
    return code;
  }
};

/**
 * Format C++ code
 */
const formatCpp = (code) => {
  try {
    let formatted = code.trim();
    let indent = 0;
    const lines = formatted.split('\n');
    
    const formattedLines = lines.map(line => {
      let trimmedLine = line.trim();
      
      // Skip empty lines and preprocessor directives
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return trimmedLine;
      }
      
      // Decrease indent for closing braces
      if (trimmedLine.startsWith('}')) {
        indent = Math.max(0, indent - 1);
      }
      
      const indentedLine = '    '.repeat(indent) + trimmedLine;
      
      // Increase indent for opening braces
      if (trimmedLine.endsWith('{')) {
        indent++;
      }
      
      return indentedLine;
    });
    
    return formattedLines.join('\n');
  } catch (error) {
    console.error('C++ formatting error:', error);
    return code;
  }
};

/**
 * Format Java code
 */
const formatJava = (code) => {
  try {
    let formatted = code.trim();
    let indent = 0;
    const lines = formatted.split('\n');
    
    const formattedLines = lines.map(line => {
      let trimmedLine = line.trim();
      
      // Skip empty lines and imports
      if (!trimmedLine || trimmedLine.startsWith('import ') || trimmedLine.startsWith('package ')) {
        return trimmedLine;
      }
      
      // Decrease indent for closing braces
      if (trimmedLine.startsWith('}')) {
        indent = Math.max(0, indent - 1);
      }
      
      const indentedLine = '    '.repeat(indent) + trimmedLine;
      
      // Increase indent for opening braces
      if (trimmedLine.endsWith('{')) {
        indent++;
      }
      
      return indentedLine;
    });
    
    return formattedLines.join('\n');
  } catch (error) {
    console.error('Java formatting error:', error);
    return code;
  }
};

/**
 * Main format function - detects language and formats accordingly
 */
export const formatCode = (code, language) => {
  if (!code || !code.trim()) {
    return code;
  }
  
  switch (language) {
    case 'javascript':
      return formatJavaScript(code);
    case 'python':
      return formatPython(code);
    case 'cpp':
      return formatCpp(code);
    case 'java':
      return formatJava(code);
    default:
      return code;
  }
};

/**
 * Get formatting status message
 */
export const getFormattingMessage = (language) => {
  return `✨ Code formatted for ${language.toUpperCase()}`;
};