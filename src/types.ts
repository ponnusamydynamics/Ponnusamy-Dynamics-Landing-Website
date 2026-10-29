export type ItemCategory = 'collaboration' | 'launch' | 'doc';

export type LaunchStatus = 'Projected' | 'In Dev' | 'Beta' | 'Published';

export type IconShape = 'squircle' | 'circle' | 'square' | 'hexagon';
export type IconSize = 'sm' | 'md' | 'lg';
export type IconFit = 'cover' | 'contain';

export interface LaunchIcon {
  data: string; // Base64 Data URL or image link
  shape?: IconShape; // default: 'squircle'
  size?: IconSize; // default: 'md'
  fit?: IconFit; // default: 'cover'
}

export interface Launch {
  id?: string;
  category?: ItemCategory; // 'collaboration' | 'launch' | 'doc' (defaults to 'launch')
  projectId: string; // e.g. "CLB-01", "LNCH-01", or "DOC-01"
  title: string;
  status?: LaunchStatus | string; // 'Projected' | 'In Dev' | 'Beta' | 'Published'
  shortDesc: string;
  readme: string; // GitHub-style markdown or research document
  tags: string[];
  order: number;
  published: boolean;
  isRestricted?: boolean; // If true: card visible on public side, but details redacted to public (admin has full access)
  restricted?: boolean;   // Alias for isRestricted
  isClassified?: boolean; // If true: completely hidden from public (does not exist to public), only visible to admin
  classified?: boolean;   // Alias for isClassified
  authorEmail?: string;
  icon?: LaunchIcon;

  // Collaborations & Clients specific fields
  clientName?: string; // Company, Organization, or Club (e.g. "Hyperloop Team", "Acme Labs")
  clientRole?: string; // e.g. "Lead Systems Engineer", "Contract Full-Stack Developer"
  clientPeriod?: string; // e.g. "2024 - 2025" or "Summer 2024"

  // Research & Docs specific fields
  docType?: string; // e.g. "Research Paper", "Technical Spec", "Whitepaper", "RFC", "Field Notes"
  docReadingTime?: string; // e.g. "7 min read" or "14 pages"
  docDate?: string; // e.g. "September 2026"
  docContext?: string; // Context details / domain / methodology overview
  externalUrl?: string; // External publication URL, PDF, arXiv link

  // Links
  githubUrl?: string;
  liveUrl?: string;

  createdAt?: string;
  updatedAt?: string;
}

// Backwards compatibility alias
export type Project = Launch;

export interface ProjectTemplate {
  name: string;
  category: ItemCategory;
  description: string;
  defaultTitle: string;
  defaultStatus?: LaunchStatus;
  defaultTags: string[];
  defaultClientName?: string;
  defaultClientRole?: string;
  defaultDocType?: string;
  defaultDocReadingTime?: string;
  defaultDocContext?: string;
  content: string;
}
