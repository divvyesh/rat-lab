import React, { useRef, useEffect } from 'react';
import { Edit, RefreshCw, Trash2, Copy } from 'lucide-react';

interface SocietyActionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onDuplicate?: () => void;
  onClose: () => void;
}

const SocietyActionsMenu: React.FC<SocietyActionsMenuProps> = ({
  onEdit,
  onDelete,
  onRefresh,
  onDuplicate,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-8 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 min-w-[160px] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <button
        onClick={() => handleAction(onEdit)}
        className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
      >
        <Edit size={16} />
        Edit
      </button>
      <button
        onClick={() => handleAction(onRefresh)}
        className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
      >
        <RefreshCw size={16} />
        Refresh
      </button>
      {onDuplicate && (
        <button
          onClick={() => handleAction(onDuplicate)}
          className="w-full px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <Copy size={16} />
          Duplicate
        </button>
      )}
      <div className="border-t border-white/5" />
      <button
        onClick={() => handleAction(onDelete)}
        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
      >
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  );
};

export default SocietyActionsMenu;



