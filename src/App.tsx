import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Plus, Link2, Users, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

import { TelegramLink, CreateTelegramLinkData, UpdateTelegramLinkData } from './types/telegramLink';
import { telegramLinkService } from './services/api';
import TelegramLinkForm from './components/TelegramLinkForm';
import TelegramLinkTable from './components/TelegramLinkTable';
import SearchBar from './components/SearchBar';
import Pagination from './components/Pagination';
import LoadingSpinner from './components/LoadingSpinner';
import EmptyState from './components/EmptyState';

const App: React.FC = () => {
  const [telegramLinks, setTelegramLinks] = useState<TelegramLink[]>([]);
  const [allTelegramLinks, setAllTelegramLinks] = useState<TelegramLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<TelegramLink | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const itemsPerPage = 6;

  // Fetch all telegram links for statistics calculation
  const fetchAllTelegramLinks = async () => {
    try {
      const response = await telegramLinkService.getTelegramLinks(1, 100, ''); // Start with reasonable limit
      
      if (response.success && response.data) {
        setAllTelegramLinks(response.data);
        setTotalItems(response.pagination?.totalItems || response.data.length);
      } else {
        console.error('Failed to fetch all links:', response.error);
      }
    } catch (error: any) {
      console.error('Error fetching all telegram links:', error);
      // Don't show toast error for background statistics fetch
    }
  };

  const fetchTelegramLinks = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await telegramLinkService.getTelegramLinks(page, itemsPerPage, search);
      
      if (response.success && response.data) {
        setTelegramLinks(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalItems(response.pagination.totalItems);
        }
      } else {
        toast.error(response.error || 'Failed to fetch links');
      }
    } catch (error: any) {
      console.error('Error fetching telegram links:', error);
      toast.error('Failed to fetch links. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelegramLinks(currentPage, searchTerm);
    // Fetch all links for statistics when component mounts
    if (allTelegramLinks.length === 0) {
      fetchAllTelegramLinks();
    }
  }, [currentPage, searchTerm]);

  // Fetch all links for statistics on component mount
  useEffect(() => {
    fetchAllTelegramLinks();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+X to add new link
      if (event.altKey && event.key.toLowerCase() === 'x') {
        event.preventDefault();
        setShowForm(true);
      }
      // Escape to close form
      if (event.key === 'Escape' && (showForm || editingLink)) {
        handleCancelForm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showForm, editingLink]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateLink = async (data: CreateTelegramLinkData) => {
    try {
      setFormLoading(true);
      const response = await telegramLinkService.createTelegramLink(data);
      
      if (response.success) {
        toast.success('Telegram link created successfully!');
        setShowForm(false);
        fetchTelegramLinks(currentPage, searchTerm);
        fetchAllTelegramLinks(); // Refresh all links for updated statistics
      } else {
        toast.error(response.error || 'Failed to create link');
      }
    } catch (error: any) {
      console.error('Error creating telegram link:', error);
      toast.error(error.response?.data?.error || 'Failed to create link');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateLink = async (data: UpdateTelegramLinkData) => {
    if (!editingLink) return;

    try {
      setFormLoading(true);
      const response = await telegramLinkService.updateTelegramLink(editingLink._id, data);
      
      if (response.success) {
        toast.success('Telegram link updated successfully!');
        setEditingLink(null);
        fetchTelegramLinks(currentPage, searchTerm);
        fetchAllTelegramLinks(); // Refresh all links for updated statistics
      } else {
        toast.error(response.error || 'Failed to update link');
      }
    } catch (error: any) {
      console.error('Error updating telegram link:', error);
      toast.error(error.response?.data?.error || 'Failed to update link');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this telegram link?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await telegramLinkService.deleteTelegramLink(id);
      
      if (response.success) {
        toast.success('Telegram link deleted successfully!');
        fetchTelegramLinks(currentPage, searchTerm);
        fetchAllTelegramLinks(); // Refresh all links for updated statistics
      } else {
        toast.error(response.error || 'Failed to delete link');
      }
    } catch (error: any) {
      console.error('Error deleting telegram link:', error);
      toast.error(error.response?.data?.error || 'Failed to delete link');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditLink = (link: TelegramLink) => {
    setEditingLink(link);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingLink(null);
  };

  // Calculate statistics using Set methods and proper data processing
  const calculateUniqueUsers = () => {
    // Using Set to get unique owner names (like Issac, Hector, Max, Welcome, Diamond)
    const uniqueOwners = new Set<string>();
    
    allTelegramLinks.forEach(link => {
      if (link.owner_name && link.owner_name.trim()) {
        uniqueOwners.add(link.owner_name.trim());
      }
    });
    
    return uniqueOwners.size;
  };

  const calculateThisMonthLinks = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter links created this month and sort by date
    const thisMonthLinks = allTelegramLinks
      .filter(link => {
        const linkDate = new Date(link.createdAt);
        return linkDate.getMonth() === currentMonth && linkDate.getFullYear() === currentYear;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return thisMonthLinks.length;
  };

  const stats = [
    {
      label: 'Total Links',
      value: totalItems,
      icon: Link2,
      color: 'text-telegram-600'
    },
    {
      label: 'Unique Users',
      value: calculateUniqueUsers(),
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'This Month',
      value: calculateThisMonthLinks(),
      icon: Calendar,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-telegram-500 to-telegram-600 rounded-xl flex items-center justify-center">
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Telegram Links</h1>
                <p className="text-slate-600 text-sm">Manage your telegram links and owners</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2"
              title="Add new link (Alt+X)"
            >
              <Plus className="w-5 h-5" />
              Add Link
              <span className="text-xs opacity-75">Alt+X</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-slate-50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8">
          <SearchBar
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by link or owner name..."
            className="max-w-md"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : telegramLinks.length === 0 ? (
          <EmptyState
            title={searchTerm ? "No links found" : "No telegram links yet"}
            description={searchTerm 
              ? `No links match "${searchTerm}". Try adjusting your search.`
              : "Get started by adding your first telegram link and owner information."
            }
            actionText={searchTerm ? undefined : "Add Your First Link"}
            onAction={searchTerm ? undefined : () => setShowForm(true)}
          />
        ) : (
          <>
            {/* Links Table */}
            <div className="mb-8">
              <TelegramLinkTable
                telegramLinks={telegramLinks}
                onEdit={handleEditLink}
                onDelete={handleDeleteLink}
                deletingId={deletingId}
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>

      {/* Form Modal */}
      {(showForm || editingLink) && (
        <TelegramLinkForm
          onSubmit={editingLink ? handleUpdateLink : handleCreateLink}
          onCancel={handleCancelForm}
          initialData={editingLink || undefined}
          isLoading={formLoading}
        />
      )}
    </div>
  );
};

export default App;
