'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, File, ChevronLeft, ChevronRight, HardDrive, RefreshCcw, Search, FileText, MoreVertical, Trash2, Copy, Move, Play, X } from 'lucide-react';

interface FileEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

export default function FileExplorer() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('.');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const fetchFiles = async (path: string = '.') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fs?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
        setCurrentPath(data.currentPath || path);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, entry: FileEntry) => {
    setLoading(true);
    setActiveMenu(null);
    try {
      if (action === 'run') {
        const cmd = entry.name.endsWith('.sh') ? `bash ./${entry.path}` : entry.name.endsWith('.js') ? `node ./${entry.path}` : `./${entry.path}`;
        const res = await fetch('/api/shell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd, yoloMode: localStorage.getItem('omnishell_yolo') === 'true' }),
        });
        const result = await res.json();
        alert(result.stdout || result.stderr || 'Command executed');
      } else if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${entry.name}?`)) return;
        await fetch('/api/fs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', source: entry.path }),
        });
        fetchFiles(currentPath);
      } else if (action === 'copy' || action === 'move') {
        const dest = prompt(`Enter destination path for ${entry.name}:`, entry.path + '_copy');
        if (!dest) return;
        await fetch('/api/fs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, source: entry.path, destination: dest }),
        });
        fetchFiles(currentPath);
      }
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    } finally {
      setLoading(false);
    }
  };

  const readFile = async (entry: FileEntry) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fs?mode=read&path=${encodeURIComponent(entry.path)}`);
      const data = await res.json();
      if (data.content) {
        setSelectedFileContent(data.content);
      }
    } catch (err) {
      console.error('Failed to read file:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentPath);
  }, []);

  const navigateUp = () => {
    const parts = currentPath.split('/');
    parts.pop();
    const newPath = parts.join('/') || '.';
    fetchFiles(newPath);
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-brand-line flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-accent/20 rounded-lg border border-brand-accent/40">
            <HardDrive className="w-5 h-5 text-brand-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-ink text-sm">System Explorer</h3>
            <p className="text-[10px] uppercase font-mono opacity-40">/{currentPath === '.' ? '' : currentPath}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchFiles(currentPath)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-brand-line flex items-center gap-4">
        <div className="flex gap-1">
          <button 
            onClick={navigateUp}
            disabled={currentPath === '.'}
            className="p-1.5 hover:bg-white/10 rounded border border-brand-line disabled:opacity-20"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/20 border border-brand-line rounded-lg pl-9 pr-4 py-1.5 text-xs focus:border-brand-accent outline-none"
          />
        </div>
      </div>

      {/* Explorer Content */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <div className="grid grid-cols-1 gap-1">
          <AnimatePresence mode="popLayout">
            {filteredFiles.map((file) => (
              <motion.div
                key={file.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="group flex items-center justify-between p-2 rounded-lg hover:bg-brand-accent/10 border border-transparent hover:border-brand-accent/30 cursor-pointer transition-all"
              >
                <div 
                  className="flex items-center gap-3 flex-1"
                  onClick={() => file.isDirectory ? fetchFiles(file.path) : readFile(file)}
                >
                  {file.isDirectory ? (
                    <Folder className="w-5 h-5 text-brand-warning fill-brand-warning/20" />
                  ) : (
                    <File className="w-5 h-5 text-brand-ink/60" />
                  )}
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                
                <div className="flex items-center gap-1">
                   <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === file.path ? null : file.path);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {activeMenu === file.path && (
                        <div className="absolute right-0 top-8 w-32 bg-brand-bg border border-brand-line rounded-lg shadow-2xl z-50 overflow-hidden">
                           {!file.isDirectory && (
                             <button onClick={() => handleAction('run', file)} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-brand-accent/20 flex items-center gap-2">
                               <Play size={12} className="text-brand-accent" /> Run
                             </button>
                           )}
                           <button onClick={() => handleAction('copy', file)} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-white/5 flex items-center gap-2">
                             <Copy size={12} /> Copy
                           </button>
                           <button onClick={() => handleAction('move', file)} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-white/5 flex items-center gap-2">
                             <Move size={12} /> Move
                           </button>
                           <button onClick={() => handleAction('delete', file)} className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-brand-error/20 text-brand-error flex items-center gap-2 border-t border-brand-line">
                             <Trash2 size={12} /> Delete
                           </button>
                        </div>
                      )}
                   </div>
                   <div className="opacity-0 group-hover:opacity-60 transition-opacity">
                     <ChevronRight size={14} />
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal / Preview Overlay */}
      <AnimatePresence>
        {selectedFileContent !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl max-h-[80vh] flex flex-col glass-panel rounded-3xl border-brand-line shadow-2xl relative"
            >
              <div className="flex items-center justify-between p-6 border-b border-brand-line">
                <div className="flex items-center gap-3">
                  <FileText className="text-brand-accent" />
                  <h3 className="text-lg font-bold">File Preview</h3>
                </div>
                <button 
                  onClick={() => setSelectedFileContent(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-black/40">
                <pre className="font-mono text-xs text-brand-ink/80 leading-relaxed whitespace-pre-wrap">
                  {selectedFileContent}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
