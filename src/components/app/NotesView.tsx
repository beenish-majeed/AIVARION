import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Search,
  Lock,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Note } from '../../types';
import { dbLocal } from '../../db';

export const NotesView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  // Load notes from local IndexedDB
  const loadNotes = async () => {
    const all = await dbLocal.notes.orderBy('updatedAt').reverse().toArray();
    setNotes(all);
    if (all.length > 0 && !activeNoteId) {
      setActiveNoteId(all[0].id);
      setTitleInput(all[0].title);
      setContentInput(all[0].content);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setTitleInput(note.title);
    setContentInput(note.content);
    setIsSaved(true);
  };

  const handleCreateNewNote = async () => {
    const newNote: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: 'Untitled Note',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbLocal.notes.add(newNote);
    await loadNotes();
    setActiveNoteId(newNote.id);
    setTitleInput(newNote.title);
    setContentInput(newNote.content);
    setIsSaved(true);
  };

  const handleSaveCurrentNote = async () => {
    if (!activeNoteId) return;
    const finalTitle = titleInput.trim() || 'Untitled Note';
    await dbLocal.notes.update(activeNoteId, {
      title: finalTitle,
      content: contentInput,
      updatedAt: Date.now(),
    });
    setIsSaved(true);
    await loadNotes();
  };

  const handleDeleteCurrentNote = async () => {
    if (!activeNoteId) return;
    await dbLocal.notes.delete(activeNoteId);
    setActiveNoteId(null);
    setTitleInput('');
    setContentInput('');
    await loadNotes();
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex h-full bg-white dark:bg-[#0B0B0B] text-zinc-900 dark:text-white overflow-hidden transition-colors duration-300">
      {/* Left Column: Notes List & Search */}
      <div className="w-72 bg-zinc-50 dark:bg-[#121214] border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 transition-colors">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FF2DA8]" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-display">Personal Notes</h2>
            </div>
            <button
              onClick={handleCreateNewNote}
              className="p-1.5 rounded-lg bg-[#FF2DA8] hover:bg-[#E02094] text-white transition-all shadow-sm"
              title="Create New Note"
              aria-label="Create New Note"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search local notes..."
              className="w-full bg-white dark:bg-[#18181B] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg pl-8 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF2DA8]"
            />
          </div>
        </div>

        {/* Notes Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.map((note) => {
            const isActive = activeNoteId === note.id;
            return (
              <button
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <div className="font-semibold text-xs text-zinc-900 dark:text-white truncate mb-1">
                  {note.title || 'Untitled Note'}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mb-1">
                  {note.content || 'No additional content'}
                </div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </button>
            );
          })}

          {filteredNotes.length === 0 && (
            <div className="p-6 text-center text-xs text-zinc-500">
              No notes found. Click + to create your first note.
            </div>
          )}
        </div>

        {/* Bottom Local Storage Verification Indicator */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/80 dark:bg-[#0E0E10] text-[11px] text-zinc-500 flex items-center justify-between font-mono">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-[#D4FF3F]" />
            <span>IndexedDB Local Only</span>
          </span>
          <span>{notes.length} notes</span>
        </div>
      </div>

      {/* Right Column: Note Editor */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0B0B0B] overflow-hidden transition-colors">
        {activeNoteId ? (
          <>
            {/* Editor Top Toolbar */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-[#141416]/50">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => {
                  setTitleInput(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="Note title..."
                className="bg-transparent text-lg font-bold text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none flex-1 font-display"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveCurrentNote}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSaved
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                      : 'bg-[#FF2DA8] hover:bg-[#E02094] text-white shadow-md shadow-[#FF2DA8]/20'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'Saved Locally' : 'Save Changes'}</span>
                </button>

                <button
                  onClick={handleDeleteCurrentNote}
                  className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Delete Note"
                  aria-label="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Privacy Warning Header Banner */}
            <div className="px-6 py-2.5 bg-zinc-900/60 border-b border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-400">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Note: Free-text notes remain stored on your physical machine. Never copy sensitive credentials into unencrypted prompts.
              </span>
            </div>

            {/* Content Textarea */}
            <div className="flex-1 p-6 overflow-y-auto">
              <textarea
                value={contentInput}
                onChange={(e) => {
                  setContentInput(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="Write confidential thoughts, research notes, or Python code snippets here..."
                className="w-full h-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed selection:bg-[#FF2DA8] selection:text-white"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <FileText className="w-8 h-8 text-[#FF2DA8]" />
            </div>
            <h3 className="text-base font-bold text-white">No Note Selected</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              Select a note from the sidebar or click + to create a new offline personal note.
            </p>
            <button
              onClick={handleCreateNewNote}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF2DA8] hover:bg-[#E02094] text-white text-xs font-semibold shadow-lg shadow-[#FF2DA8]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Note</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesView;
