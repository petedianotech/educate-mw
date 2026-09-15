export type GroupRole = 'owner' | 'admin' | 'teacher' | 'moderator' | 'student';

export interface GroupMember {
  userId: string;
  name: string;
  initial?: string;
  avatarColor?: string;
  role: GroupRole;
  isRestricted?: boolean; // cannot send messages
  joinedAt?: any;
  isOnline?: boolean;
}

export interface GroupRule {
  id: string;
  text: string;
  addedBy?: string;
}

export type GroupNotificationSetting = 
  | 'all' 
  | 'mentions' 
  | 'announcements' 
  | 'assignments' 
  | 'events' 
  | 'muted';

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: 'Sciences' | 'Humanities' | 'Languages' | 'General MSCE' | 'Teacher Classrooms' | 'Study Circles';
  creatorId: string;
  creatorName: string;
  membersCount: number;
  adminIds: string[];
  teacherIds: string[];
  moderatorIds: string[];
  memberIds: string[];
  rules: GroupRule[];
  inviteCode: string;
  isPrivate?: boolean;
  color?: string;
  accent?: string;
  createdAt?: any;
}

export interface QuotedMessage {
  id: string;
  user: string;
  text: string;
  type?: 'text' | 'voice' | 'formula' | 'document' | 'image';
}

export interface GroupMessageItem {
  id: string;
  groupId: string;
  userId: string;
  user: string;
  userRole?: GroupRole;
  initial?: string;
  avatarColor?: string;
  text: string;
  type: 'text' | 'voice' | 'formula' | 'document' | 'image';
  audioData?: string;
  audioDuration?: number;
  attachmentUrl?: string;
  fileName?: string;
  fileSize?: string;
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: any;
  replyTo?: QuotedMessage;
  threadRepliesCount?: number;
  reactions?: Record<string, string[]>; // e.g. { '👍': ['uid1'], '💡': ['uid2'] }
  mentions?: string[];
  createdAt?: any;
  timeText?: string;
}

export interface GroupAnnouncement {
  id: string;
  groupId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  isPinned?: boolean;
  attachmentUrl?: string;
  fileName?: string;
  createdAt?: any;
  timeText?: string;
}

export interface DiscussionResponse {
  id: string;
  discussionId: string;
  userId: string;
  userName: string;
  userRole?: GroupRole;
  initial?: string;
  text: string;
  likes?: number;
  likedBy?: string[];
  isTeacherEndorsed?: boolean;
  createdAt?: any;
  timeText?: string;
}

export interface GroupDiscussion {
  id: string;
  groupId: string;
  title: string;
  description: string;
  subject?: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  isClosed?: boolean;
  isPinned?: boolean;
  responsesCount?: number;
  createdAt?: any;
  timeText?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  groupId: string;
  studentId: string;
  studentName: string;
  content: string;
  attachmentUrl?: string;
  fileName?: string;
  status: 'submitted' | 'marked' | 'late' | 'returned';
  score?: number;
  feedback?: string;
  submittedAt?: any;
  markedAt?: any;
}

export interface GroupAssignment {
  id: string;
  groupId: string;
  title: string;
  instructions: string;
  subject: string;
  points: number;
  dueDate: string;
  dueTime?: string;
  teacherId: string;
  teacherName: string;
  isClosed?: boolean;
  attachmentUrl?: string;
  fileName?: string;
  createdAt?: any;
  timeText?: string;
  submissionsCount?: number;
}

export interface GroupEvent {
  id: string;
  groupId: string;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  meetingLink?: string;
  location?: string;
  creatorId: string;
  creatorName: string;
  rsvps?: {
    going?: string[];
    maybe?: string[];
    cantAttend?: string[];
  };
  createdAt?: any;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  voterIds: string[];
}

export interface GroupPoll {
  id: string;
  groupId: string;
  question: string;
  options: PollOption[];
  creatorId: string;
  creatorName: string;
  isClosed?: boolean;
  expiresAt?: string;
  totalVotes: number;
  createdAt?: any;
}

export type ResourceCategory = 'pdf' | 'past_paper' | 'notes' | 'doc' | 'image' | 'link';

export interface GroupResource {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  type: ResourceCategory;
  url: string;
  fileSize?: string;
  subject?: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole?: string;
  downloads?: number;
  createdAt?: any;
  timeText?: string;
}
