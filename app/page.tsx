"use client";
import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const NoteApp = () => {
  const [notes, setNotes] = useState<string[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [preview, setPreview] = useState<string>('');
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize and handle responsive view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Load saved data
  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const savedCurrentNote = localStorage.getItem('currentNote');
    if (savedCurrentNote) setCurrentNote(savedCurrentNote);

    const savedSelectedNoteIndex = localStorage.getItem('selectedNoteIndex');
    if (savedSelectedNoteIndex !== null) setSelectedNoteIndex(JSON.parse(savedSelectedNoteIndex));

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) setIsDarkMode(JSON.parse(savedDarkMode));
  }, []);

  // Save data
  useEffect(() => { localStorage.setItem('notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('currentNote', currentNote); }, [currentNote]);
  useEffect(() => { localStorage.setItem('selectedNoteIndex', JSON.stringify(selectedNoteIndex)); }, [selectedNoteIndex]);
  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(isDarkMode)); }, [isDarkMode]);

  // Parse markdown to HTML
  useEffect(() => {
    const parseMarkdown = async () => {
      const rawHtml = await marked(currentNote || '');
      const sanitizedHtml = DOMPurify.sanitize(rawHtml);
      setPreview(sanitizedHtml);
    };
    parseMarkdown();
  }, [currentNote]);

  // Formatting functions
  const insertAtCursor = (prefix: string, suffix: string = '', defaultText: string = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const selectedText = currentNote.substring(startPos, endPos);
    const beforeText = currentNote.substring(0, startPos);
    const afterText = currentNote.substring(endPos);
    
    let newText;
    if (selectedText) {
      newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
    } else {
      newText = `${beforeText}${prefix}${defaultText}${suffix}${afterText}`;
    }
    
    setCurrentNote(newText);
    
    // Set cursor position
    setTimeout(() => {
      if (selectedText) {
        textarea.selectionStart = startPos + prefix.length;
        textarea.selectionEnd = endPos + prefix.length;
      } else {
        textarea.selectionStart = startPos + prefix.length;
        textarea.selectionEnd = startPos + prefix.length + defaultText.length;
      }
      textarea.focus();
    }, 0);
  };

  const formatBold = () => insertAtCursor('**', '**', 'bold text');
  const formatItalic = () => insertAtCursor('_', '_', 'italic text');
  const formatHeading = (level: number) => insertAtCursor('#'.repeat(level) + ' ', '', 'Heading');
  const formatCode = () => insertAtCursor('```\n', '\n```', 'code here');
  const formatLink = () => insertAtCursor('[', '](url)', 'link text');
  const formatImage = () => insertAtCursor('![', '](image-url)', 'alt text');
  const formatList = (ordered: boolean) => insertAtCursor(ordered ? '1. ' : '- ', '\n' + (ordered ? '2. ' : '- '), 'List item');
  const formatTable = () => {
    const tableMarkdown = `| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n`;
    insertAtCursor('\n' + tableMarkdown + '\n');
  };
  const formatQuote = () => insertAtCursor('> ', '', 'Quote');
  const formatHorizontalRule = () => insertAtCursor('\n---\n');

  // Note management functions
  const handleAddNote = () => {
    const newNotes = [...notes, ''];
    setNotes(newNotes);
    setSelectedNoteIndex(newNotes.length - 1);
    setCurrentNote('');
    if (isMobileView) setShowPreview(false);
  };

  const handleDeleteNote = (index: number) => {
    const newNotes = [...notes];
    newNotes.splice(index, 1);
    setNotes(newNotes);

    if (index === selectedNoteIndex) {
      setSelectedNoteIndex(null);
      setCurrentNote('');
    } else if (selectedNoteIndex !== null && index < selectedNoteIndex) {
      setSelectedNoteIndex(selectedNoteIndex - 1);
    }
  };

  const handleSelectNote = (index: number) => {
    setSelectedNoteIndex(index);
    setCurrentNote(notes[index]);
    if (isMobileView) setShowPreview(false);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedNote = e.target.value;
    setCurrentNote(updatedNote);

    if (selectedNoteIndex !== null) {
      const newNotes = [...notes];
      newNotes[selectedNoteIndex] = updatedNote;
      setNotes(newNotes);
    }
  };

  const handleDarkModeToggle = () => setIsDarkMode(!isDarkMode);

  const getNoteTitle = (note: string) => {
    if (!note.trim()) return 'Untitled';
    const firstLine = note.split('\n').find(line => line.trim().length > 0) || '';
    return firstLine.replace(/^#+\s*/, '').replace(/\*\*|__|\*|_|`|~~/g, '').trim() || 'Untitled';
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark' : ''}`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        
        body {
          font-family: 'Poppins', sans-serif;
          margin: 0;
          padding: 0;
          background-color: ${isDarkMode ? '#1a1a1a' : '#f0f0f0'};
          color: ${isDarkMode ? '#e0e0e0' : '#1a1a1a'};
          overflow: hidden;
        }
        
        .markdown-preview {
          line-height: 1.6;
          padding: 1rem;
          font-family: 'Poppins', sans-serif;
        }
        
        .markdown-preview > *:first-child {
          margin-top: 0;
        }
        
        .markdown-preview > *:last-child {
          margin-bottom: 0;
        }
        
        /* Markdown preview styles */
        .markdown-preview h1, .markdown-preview h2, .markdown-preview h3, 
        .markdown-preview h4, .markdown-preview h5, .markdown-preview h6 {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        
        .markdown-preview h1 { font-size: 2em; }
        .markdown-preview h2 { font-size: 1.5em; }
        .markdown-preview h3 { font-size: 1.3em; }
        
        .markdown-preview p {
          margin-bottom: 1em;
        }
        
        .markdown-preview ul, .markdown-preview ol {
          margin-bottom: 1em;
          padding-left: 2em;
        }
        
        .markdown-preview blockquote {
          border-left: 4px solid #4a90e2;
          padding-left: 1em;
          margin-left: 0;
          font-style: italic;
          color: ${isDarkMode ? '#ccc' : '#555'};
        }
        
        .markdown-preview pre {
          background-color: ${isDarkMode ? '#2d2d2d' : '#f5f5f5'};
          padding: 1em;
          border-radius: 4px;
          overflow-x: auto;
        }
        
        .markdown-preview code {
          font-family: 'JetBrains Mono', monospace;
          background-color: ${isDarkMode ? '#2d2d2d' : '#f5f5f5'};
          padding: 0.2em 0.4em;
          border-radius: 4px;
        }
        
        .markdown-preview table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1em;
        }
        
        .markdown-preview th, .markdown-preview td {
          border: 1px solid ${isDarkMode ? '#555' : '#ddd'};
          padding: 0.5em;
          text-align: left;
        }
        
        .markdown-preview th {
          background-color: ${isDarkMode ? '#2d2d2d' : '#f5f5f5'};
        }
        
        .markdown-preview img {
          max-width: 100%;
          height: auto;
        }
        
        .markdown-preview hr {
          border: 0;
          height: 1px;
          background: ${isDarkMode ? '#555' : '#ddd'};
          margin: 1.5em 0;
        }
      `}</style>

      {/* Sidebar */}
      <div className={`${isMobileView ? 'absolute z-10 w-64 h-full transition-transform duration-300' : 'w-64'} bg-gray-100 dark:bg-gray-800 p-4 flex flex-col border-r border-gray-300 dark:border-gray-600 ${isMobileView && selectedNoteIndex !== null ? '-translate-x-full' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Notes</h1>
          <button 
            onClick={handleAddNote}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4 transition-colors duration-200"
          >
            Add Note
          </button>
          <ul className="space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
            {notes.map((note, index) => (
              <li 
                key={index}
                className={`group relative rounded cursor-pointer ${
                  selectedNoteIndex === index 
                    ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
                    : (isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100')
                }`}
              >
                <div 
                  className="p-2 pr-8 truncate"
                  onClick={() => handleSelectNote(index)}
                >
                  <span className="font-medium">{getNoteTitle(note)}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(index);
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    selectedNoteIndex === index ? 'text-white hover:bg-blue-700' : (isDarkMode ? 'text-gray-300 hover:bg-gray-500' : 'text-gray-500 hover:bg-gray-200')
                  }`}
                  aria-label="Delete note"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-300 dark:border-gray-600">
          <button 
            onClick={handleDarkModeToggle}
            className={`w-full flex items-center justify-center px-4 py-2 rounded font-bold transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedNoteIndex !== null ? (
          <>
            {/* Mobile header */}
            {isMobileView && (
              <div className="flex items-center p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                <button 
                  onClick={() => setSelectedNoteIndex(null)}
                  className="p-2 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <h2 className="text-lg font-medium flex-1 truncate">{getNoteTitle(notes[selectedNoteIndex])}</h2>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {showPreview ? (
                    <span className="text-sm font-medium">Edit</span>
                  ) : (
                    <span className="text-sm font-medium">Preview</span>
                  )}
                </button>
              </div>
            )}

            {/* Desktop toggle buttons */}
            {!isMobileView && (
              <div className="flex border-b border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => setShowPreview(false)}
                  className={`flex-1 py-2 font-medium ${!showPreview ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className={`flex-1 py-2 font-medium ${showPreview ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  Preview
                </button>
              </div>
            )}

            {/* Editor with toolbar */}
            {!showPreview ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {!isMobileView && (
                  <div className="flex flex-wrap items-center p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                    <button onClick={formatBold} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Bold">
                      <span className="font-bold">B</span>
                    </button>
                    <button onClick={formatItalic} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Italic">
                      <span className="italic">I</span>
                    </button>
                    <div className="border-r border-gray-300 dark:border-gray-600 h-6 mx-1"></div>
                    <button onClick={() => formatHeading(1)} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Heading 1">
                      H1
                    </button>
                    <button onClick={() => formatHeading(2)} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Heading 2">
                      H2
                    </button>
                    <button onClick={() => formatHeading(3)} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Heading 3">
                      H3
                    </button>
                    <div className="border-r border-gray-300 dark:border-gray-600 h-6 mx-1"></div>
                    <button onClick={formatCode} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Code block">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button onClick={formatLink} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Link">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button onClick={formatImage} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Image">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="border-r border-gray-300 dark:border-gray-600 h-6 mx-1"></div>
                    <button onClick={() => formatList(false)} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Bullet list">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zM2 5a1 1 0 112 0 1 1 0 01-2 0zm1 6a1 1 0 100 2 1 1 0 000-2zm0 6a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button onClick={() => formatList(true)} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Numbered list">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zM2 5a1 1 0 112 0 1 1 0 01-2 0zm2 1a1 1 0 100 2 1 1 0 000-2zm-2 5a1 1 0 112 0 1 1 0 01-2 0zm2 1a1 1 0 100 2 1 1 0 000-2zm-2 5a1 1 0 112 0 1 1 0 01-2 0zm2 1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button onClick={formatQuote} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Quote">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button onClick={formatTable} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Table">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zM2 7a1 1 0 112 0 1 1 0 01-2 0zm2 3a1 1 0 112 0 1 1 0 01-2 0zm2 3a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button onClick={formatHorizontalRule} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Horizontal rule">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  className="w-full h-full p-4 bg-gray-50 dark:bg-gray-800 border-0 text-gray-800 dark:text-gray-100 focus:outline-none resize-none"
                  value={currentNote}
                  onChange={handleNoteChange}
                  placeholder="Start typing your note here (supports markdown)..."
                />
              </div>
            ) : (
              <div 
                className="w-full h-full p-4 bg-gray-50 dark:bg-gray-800 markdown-preview text-gray-800 dark:text-gray-100 overflow-auto"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            )}
          </>
        ) : (
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">No note selected</h2>
              <p className="text-gray-600 dark:text-gray-400">Select a note from the list or create a new one</p>
              {isMobileView && (
                <button
                  onClick={handleAddNote}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                >
                  Create New Note
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteApp;