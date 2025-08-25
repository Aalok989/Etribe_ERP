import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Strike } from '@tiptap/extension-strike';
import { Highlight } from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

const RichTextEditor = ({ 
  data, 
  onChange, 
  placeholder = '',
  height = '300px',
  disabled = false 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Strike,
      Highlight,
      TextStyle,
      Color,
    ],
    content: data || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange && onChange(editor.getHTML());
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  useEffect(() => {
    if (editor && data !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== data) {
        editor.commands.setContent(data || '');
      }
    }
  }, [data, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-gray-600">
        <p>Loading editor...</p>
      </div>
    );
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
  const toggleStrike = () => editor.chain().focus().toggleStrike().run();
  const toggleHighlight = () => editor.chain().focus().toggleHighlight().run();
  const setHeading = (level) => editor.chain().focus().toggleHeading({ level }).run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run();
  const setTextAlign = (align) => editor.chain().focus().setTextAlign(align).run();
  const setLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="rich-text-editor border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={toggleBold}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-blue-200' : ''}`}
          title="Bold"
          disabled={disabled}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={toggleItalic}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-blue-200' : ''}`}
          title="Italic"
          disabled={disabled}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={toggleUnderline}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-blue-200' : ''}`}
          title="Underline"
          disabled={disabled}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={toggleStrike}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-blue-200' : ''}`}
          title="Strikethrough"
          disabled={disabled}
        >
          <s>S</s>
        </button>
        <button
          type="button"
          onClick={toggleHighlight}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('highlight') ? 'bg-blue-200' : ''}`}
          title="Highlight"
          disabled={disabled}
        >
          <span className="bg-yellow-200 px-1">H</span>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Headings */}
        <button
          type="button"
          onClick={() => setHeading(1)}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-200' : ''}`}
          title="Heading 1"
          disabled={disabled}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => setHeading(2)}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-200' : ''}`}
          title="Heading 2"
          disabled={disabled}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => setHeading(3)}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-200' : ''}`}
          title="Heading 3"
          disabled={disabled}
        >
          H3
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Lists */}
        <button
          type="button"
          onClick={toggleBulletList}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-blue-200' : ''}`}
          title="Bullet List"
          disabled={disabled}
        >
          •
        </button>
        <button
          type="button"
          onClick={toggleOrderedList}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-blue-200' : ''}`}
          title="Numbered List"
          disabled={disabled}
        >
          1.
        </button>
        <button
          type="button"
          onClick={toggleBlockquote}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-blue-200' : ''}`}
          title="Quote"
          disabled={disabled}
        >
          "
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => setTextAlign('left')}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-200' : ''}`}
          title="Align Left"
          disabled={disabled}
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => setTextAlign('center')}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-200' : ''}`}
          title="Align Center"
          disabled={disabled}
        >
          ↔
        </button>
        <button
          type="button"
          onClick={() => setTextAlign('right')}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-200' : ''}`}
          title="Align Right"
          disabled={disabled}
        >
          ➡
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Link */}
        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-blue-200' : ''}`}
          title="Insert Link"
          disabled={disabled}
        >
          🔗
        </button>
      </div>

      {/* Editor Content */}
      <div 
        className={`p-3 ${disabled ? 'bg-gray-100' : 'bg-white'}`}
        style={{ minHeight: height }}
      >
        <EditorContent 
          editor={editor} 
          className={`prose max-w-none ${isFocused ? 'ring-2 ring-blue-400' : ''}`}
        />
        {!data && !isFocused && (
          <div className="text-gray-400 pointer-events-none">
            {placeholder || 'Start typing...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;


