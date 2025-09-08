import React from 'react';
import { ExternalLink, Edit2, Trash2, User, Calendar } from 'lucide-react';
import { TelegramLink } from '../types/telegramLink';

interface TelegramLinkTableProps {
  telegramLinks: TelegramLink[];
  onEdit: (telegramLink: TelegramLink) => void;
  onDelete: (id: string) => void;
  deletingId?: string | null;
}

const TelegramLinkTable: React.FC<TelegramLinkTableProps> = ({
  telegramLinks,
  onEdit,
  onDelete,
  deletingId = null
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLinkClick = (e: React.MouseEvent, link: string) => {
    e.stopPropagation();
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Telegram Link
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {telegramLinks.map((link) => (
              <tr key={link._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-telegram-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-telegram-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-slate-900">
                        {link.owner_name}
                      </div>
                      <div className="text-sm text-slate-500">Owner</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center group">
                    <span className="text-sm text-slate-700 truncate max-w-xs">
                      {link.telegram_link}
                    </span>
                    <button
                      onClick={(e) => handleLinkClick(e, link.telegram_link)}
                      className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-telegram-100 text-telegram-600 rounded transition-all duration-200"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-slate-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(link.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(link)}
                      className="p-2 hover:bg-telegram-50 text-telegram-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(link._id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      title="Delete"
                      disabled={deletingId === link._id}
                    >
                      {deletingId === link._id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TelegramLinkTable;
