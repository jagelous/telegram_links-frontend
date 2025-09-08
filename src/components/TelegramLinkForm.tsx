import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Edit3, Copy } from 'lucide-react';
import { TelegramLink, CreateTelegramLinkData, UpdateTelegramLinkData } from '../types/telegramLink';
import { telegramLinkService } from '../services/api';

interface TelegramLinkFormProps {
  onSubmit: (data: CreateTelegramLinkData | UpdateTelegramLinkData) => Promise<void>;
  onCancel: () => void;
  initialData?: TelegramLink;
  isLoading?: boolean;
}

const TelegramLinkForm: React.FC<TelegramLinkFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    telegram_link: initialData?.telegram_link || '',
    owner_name: initialData?.owner_name || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [ownerNames, setOwnerNames] = useState<string[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const modalRef = useRef<HTMLDivElement>(null);
  const ownerNameInputRef = useRef<HTMLInputElement>(null);
  const telegramLinkInputRef = useRef<HTMLInputElement>(null);

  // Fetch owner names from database
  const fetchOwnerNames = async () => {
    try {
      setLoadingOwners(true);
      const response = await telegramLinkService.getOwnerNames();
      if (response.success && response.data) {
        setOwnerNames(response.data);
      }
    } catch (error) {
      console.error('Error fetching owner names:', error);
    } finally {
      setLoadingOwners(false);
    }
  };

  // Generate username suggestions based on database owner names
  const generateSuggestions = useCallback((searchTerm: string) => {
    if (!searchTerm.trim() || ownerNames.length === 0 || searchTerm.trim().length < 2) {
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      return;
    }

    const term = searchTerm.trim().toLowerCase();
    const filteredOwners = ownerNames
      .filter(owner => {
        const ownerLower = owner.toLowerCase();
        return ownerLower.includes(term) || 
               ownerLower.startsWith(term) ||
               ownerLower.split(' ').some(word => word.startsWith(term));
      })
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        
        // Prioritize exact matches and starts with
        if (aLower === term) return -1;
        if (bLower === term) return 1;
        if (aLower.startsWith(term) && !bLower.startsWith(term)) return -1;
        if (bLower.startsWith(term) && !aLower.startsWith(term)) return 1;
        
        // Then by length (shorter first)
        return a.length - b.length;
      })
      .slice(0, 5);

    setSuggestions(filteredOwners);
    setSelectedSuggestionIndex(-1);
  }, [ownerNames]);

  // Load owner names on component mount
  useEffect(() => {
    if (!initialData) {
      fetchOwnerNames();
    }
  }, [initialData]);

  // Update suggestions when owner name changes
  useEffect(() => {
    if (formData.owner_name && !initialData && formData.owner_name.trim().length >= 2) {
      generateSuggestions(formData.owner_name);
      setShowSuggestions(true);
    } else if (formData.owner_name && formData.owner_name.trim().length < 2) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [formData.owner_name, initialData, generateSuggestions]);

  // Focus management and click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close suggestions if clicking outside suggestions container
      if (showSuggestions && !target.closest('.suggestions-container')) {
        setShowSuggestions(false);
      }
      
      // Close modal if clicking outside modal (but not on suggestions)
      if (modalRef.current && !modalRef.current.contains(target) && !target.closest('.suggestions-container')) {
        onCancel();
      }
    };

    // Focus on telegram link input when modal opens
    if (telegramLinkInputRef.current) {
      telegramLinkInputRef.current.focus();
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions, onCancel]);

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({
      ...prev,
      owner_name: suggestion
    }));
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.telegram_link.trim()) {
      newErrors.telegram_link = 'Telegram link is required';
    } else if (!/^https?:\/\/(t\.me|telegram\.me)\/.+/.test(formData.telegram_link)) {
      newErrors.telegram_link = 'Please enter a valid Telegram link (e.g., https://t.me/username)';
    }

    if (!formData.owner_name.trim()) {
      newErrors.owner_name = 'Owner name is required';
    } else if (formData.owner_name.trim().length < 2) {
      newErrors.owner_name = 'Owner name must be at least 2 characters long';
    } else if (formData.owner_name.trim().length > 100) {
      newErrors.owner_name = 'Owner name cannot exceed 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        telegram_link: formData.telegram_link.trim(),
        owner_name: formData.owner_name.trim()
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="card w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {initialData ? (
              <>
                <Edit3 className="w-6 h-6 text-telegram-600" />
                Edit Link
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 text-telegram-600" />
                Add New Link
              </>
            )}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="telegram_link" className="block text-sm font-medium text-slate-700 mb-2">
              Telegram Link *
            </label>
            <input
              ref={telegramLinkInputRef}
              type="url"
              id="telegram_link"
              name="telegram_link"
              value={formData.telegram_link}
              onChange={handleChange}
              placeholder="https://t.me/username"
              className={`input-field ${errors.telegram_link ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.telegram_link && (
              <p className="mt-1 text-sm text-red-600">{errors.telegram_link}</p>
            )}
          </div>

          <div>
            <label htmlFor="owner_name" className="block text-sm font-medium text-slate-700 mb-2">
              Owner Name *
            </label>
            <div className="relative suggestions-container">
              <input
                ref={ownerNameInputRef}
                type="text"
                id="owner_name"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                onFocus={() => {
                  if (formData.owner_name.trim().length >= 2 && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter owner name"
                className={`input-field ${errors.owner_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
              />
              {showSuggestions && !initialData && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-xl z-20 max-h-40 overflow-y-auto animate-slide-down">
                  {loadingOwners ? (
                    <div className="px-3 py-2 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="py-1">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full px-3 py-1.5 text-left text-sm flex items-center justify-between group transition-colors ${
                            index === selectedSuggestionIndex 
                              ? 'bg-telegram-50 text-telegram-700 border-l-2 border-telegram-500' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{suggestion}</span>
                          <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600 flex-shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-2 text-center text-xs text-slate-500">
                      No matching owners found
                    </div>
                  )}
                </div>
              )}
            </div>
            {errors.owner_name && (
              <p className="mt-1 text-sm text-red-600">{errors.owner_name}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {initialData ? 'Update Link' : 'Add Link'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TelegramLinkForm;

