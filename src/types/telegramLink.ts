export interface TelegramLink {
  _id: string;
  telegram_link: string;
  owner_name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTelegramLinkData {
  telegram_link: string;
  owner_name: string;
}

export interface UpdateTelegramLinkData {
  telegram_link: string;
  owner_name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
