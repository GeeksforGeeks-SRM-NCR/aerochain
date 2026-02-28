export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface BentoItem {
  id: string;
  title: string;
  value: string;
  description: string;
  colSpan: number;
  rowSpan: number;
}

export interface TimelineEvent {
  time: string;
  title: string;
  description: string;
}

export interface TeamMember {
  name: string;
  role: string;
  email: string;
  semester: string;
  regNo: string;
  phone: string;
  section: string;
  department: string;
  altEmail: string;
}

export interface TeamRegistration {
  id: string;
  teamName: string;
  leadName: string;
  leadEmail: string;
  leadSemester: string;
  leadRegNo: string;
  leadPhone: string;
  leadSection: string;
  leadDepartment: string;
  leadAltEmail: string;
  members: TeamMember[];
  submittedAt: string;
}