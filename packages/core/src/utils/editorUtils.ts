export const handleNoteKeyDown = (
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  content: string,
  setContent: (val: string) => void
) => {
  if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Get the current line
    const textBefore = content.substring(0, start);
    const lastNewline = textBefore.lastIndexOf('\n');
    const currentLine = textBefore.substring(lastNewline + 1);
    
    // Match numbering like "1. ", "2. ", etc.
    const match = currentLine.match(/^(\d+)\.\s/);
    
    if (match) {
      e.preventDefault();
      const num = parseInt(match[1], 10);
      const nextNum = num + 1;
      const insertText = `\n${nextNum}. `;
      
      const newContent = content.substring(0, start) + insertText + content.substring(end);
      setContent(newContent);
      
      // We need to set the cursor position after React re-renders. 
      // Using a timeout is a common hack for controlled inputs.
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
      }, 0);
    }
  }
};
