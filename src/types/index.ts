export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Auth
export interface AuthResponse {
  id: string;
  token: string;
  username?: string;
  phone?: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
}

export interface RegisterRequest {
  username: string;
  phone: string;
  password: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

// Category
export interface Category {
  id: string;
  code: string;
  name: string;
  detailType: "REAL_ESTATE" | "CAR" | "JOB" | "SERVICE" | "GOODS" | null;
  children?: Category[];
  active: boolean;
  sortOrder: number;
}

// Listing — matches actual backend response
export type PriceUnit = "MONTHLY" | "TOTAL" | "NEGOTIABLE";
export type ListingStatus = "ACTIVE" | "INACTIVE" | "SOLD" | "RENTED";

export interface RealEstateDetails {
  city: string;
  district?: string;
  address?: string;
  areaSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  furnished?: boolean;
  availableFrom?: string;
  deposit?: number;
}

export interface CarDetails {
  brand: string;
  model: string;
  manufactureYear: number;
  mileageKm?: number;
  fuelType?: "GASOLINE" | "DIESEL" | "ELECTRIC" | "HYBRID";
  transmission?: "MANUAL" | "AUTOMATIC";
  color?: string;
}

export interface JobDetails {
  jobType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE";
  city: string;
  district?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceYears?: number;
  contactName?: string;
}

export interface ServiceDetails {
  city: string;
  district?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface GoodsDetails {
  condition?: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR";
  brand?: string;
  city?: string;
}

export interface Listing {
  id: string;
  categoryCode: string;
  categoryName: string;
  title: string;
  description?: string;
  price: number;
  priceUnit: PriceUnit;
  status: ListingStatus;
  featured: boolean;
  imageUrls: string[];
  coverImageUrl: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  realEstateDetails?: RealEstateDetails | null;
  carDetails?: CarDetails | null;
  jobDetails?: JobDetails | null;
  serviceDetails?: ServiceDetails | null;
  goodsDetails?: GoodsDetails | null;
}

export interface ListingPage {
  content: Listing[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreateListingRequest {
  categoryCode: string;
  title: string;
  description?: string;
  price: number;
  priceUnit: PriceUnit;
  realEstateDetails?: Omit<RealEstateDetails, "furnished"> & { isFurnished?: boolean };
  carDetails?: CarDetails;
  jobDetails?: JobDetails;
  serviceDetails?: ServiceDetails;
  goodsDetails?: GoodsDetails;
}

// User Profile
export interface UserProfile {
  id: string;
  email?: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  address?: string;
  dateOfBirth?: string;
  zalo?: string;
  lineId?: string;
  facebook?: string;
  tiktok?: string;
  username?: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  verified: boolean;
  createdAt: string;
}

// Upload
export interface UploadResponse {
  urls: string[];
}

// Conversation / Message
export interface ParticipantInfo {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface ConversationResponse {
  id: string;
  listingId?: string;
  listingTitle?: string;
  listingCoverImage?: string;
  participants: ParticipantInfo[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  imageUrl?: string;
  read: boolean;
  createdAt: string;
}

// Notification
export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  content?: string;
  referenceId?: string;
  referenceType?: string;
  read: boolean;
  createdAt: string;
}
