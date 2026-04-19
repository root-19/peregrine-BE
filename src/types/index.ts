export enum UserRole {
  COO = 'COO',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  HR = 'HR',
  HSE = 'HSE',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RESIGNED = 'resigned',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  position?: string;
  hiredate?: string;
  profileimage?: string;
  phone?: string;
  about?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  startDate: string;
  endDate?: string;
  budget?: number;
  location?: string;
  client?: string;
  managerId: string;
  teamMembers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IncidentReport {
  id: string;
  type: 'NEAR_MISS' | 'ACCIDENT' | 'SECURITY';
  description: string;
  location: string;
  date: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string;
  actions: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFolder {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  parentId?: string;
  assignedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  folderId: string;
  name: string;
  url?: string;
  size: string;
  uploadDate: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  postedBy: string;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: 'Vacation' | 'Sick' | 'Emergency' | 'Service Incentive';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  hrComment?: string;
  processedDate?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCounts: { [userId: string]: number };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
