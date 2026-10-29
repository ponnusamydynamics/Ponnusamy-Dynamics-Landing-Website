import { LaunchStatus, LaunchIcon, ItemCategory } from './types';

export interface StatusColorConfig {
  bg: string;
  text: string;
  border: string;
  glow: string;
  label: string;
  badgeDot: string;
}

export interface CategoryColorConfig {
  key: ItemCategory;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  iconSvg: string;
}

export const STATUS_CONFIG: Record<LaunchStatus, StatusColorConfig> = {
  'Projected': {
    bg: 'rgba(56, 189, 248, 0.12)',
    text: '#38BDF8',
    border: 'rgba(56, 189, 248, 0.35)',
    glow: 'rgba(56, 189, 248, 0.5)',
    label: 'PROJECTED',
    badgeDot: '#38BDF8'
  },
  'In Dev': {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.35)',
    glow: 'rgba(245, 158, 11, 0.5)',
    label: 'IN DEV',
    badgeDot: '#F59E0B'
  },
  'Beta': {
    bg: 'rgba(168, 85, 247, 0.12)',
    text: '#C084FC',
    border: 'rgba(168, 85, 247, 0.35)',
    glow: 'rgba(168, 85, 247, 0.5)',
    label: 'BETA',
    badgeDot: '#A855F7'
  },
  'Published': {
    bg: 'rgba(16, 185, 129, 0.14)',
    text: '#10B981',
    border: 'rgba(16, 185, 129, 0.4)',
    glow: 'rgba(16, 185, 129, 0.5)',
    label: 'PUBLISHED',
    badgeDot: '#10B981'
  }
};

export const CATEGORY_CONFIG: Record<ItemCategory, CategoryColorConfig> = {
  'collaboration': {
    key: 'collaboration',
    label: 'COLLABORATIONS & CLIENTS',
    shortLabel: 'COLLAB / CLIENT',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.35)',
    iconSvg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'
  },
  'launch': {
    key: 'launch',
    label: 'DEPLOYED LAUNCHES',
    shortLabel: 'OWN LAUNCH',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    iconSvg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>'
  },
  'doc': {
    key: 'doc',
    label: 'DOCS & RESEARCH',
    shortLabel: 'DOC / RESEARCH',
    color: '#FB7185',
    bg: 'rgba(251, 113, 133, 0.12)',
    border: 'rgba(251, 113, 133, 0.35)',
    iconSvg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>'
  }
};

export function getCategoryConfig(category: string | undefined): CategoryColorConfig {
  if (!category) return CATEGORY_CONFIG['launch'];
  const cat = category.toLowerCase().trim();
  if (cat === 'collaboration' || cat === 'collaborations' || cat === 'client' || cat === 'clients') {
    return CATEGORY_CONFIG['collaboration'];
  }
  if (cat === 'doc' || cat === 'docs' || cat === 'research') {
    return CATEGORY_CONFIG['doc'];
  }
  return CATEGORY_CONFIG['launch'];
}

export function getStatusConfig(status: string | undefined): StatusColorConfig {
  if (!status) return STATUS_CONFIG['In Dev'];
  const s = status.trim();
  if (s in STATUS_CONFIG) {
    return STATUS_CONFIG[s as LaunchStatus];
  }
  const upper = s.toUpperCase();
  if (upper === 'ACTIVE') return STATUS_CONFIG['In Dev'];
  if (upper === 'BETA') return STATUS_CONFIG['Beta'];
  if (upper === 'STABLE' || upper === 'ARCHIVED') return STATUS_CONFIG['Published'];
  if (upper === 'EXPERIMENTAL') return STATUS_CONFIG['Projected'];
  return STATUS_CONFIG['In Dev'];
}

export function renderLaunchIconMarkup(
  icon: LaunchIcon | undefined,
  title: string,
  projectId: string,
  extraClasses: string = '',
  overrideSize?: 'sm' | 'md' | 'lg'
): string {
  const shape = icon?.shape || 'squircle';
  const size = overrideSize || icon?.size || 'md';
  const fit = icon?.fit || 'cover';

  const shapeClass = `pd-icon-shape-${shape}`;
  const sizeClass = `pd-icon-size-${size}`;
  const fitClass = `pd-icon-fit-${fit}`;

  if (icon?.data) {
    return `
      <div class="pd-launch-icon-box ${shapeClass} ${sizeClass} ${extraClasses}">
        <img src="${icon.data}" class="pd-launch-icon-img ${fitClass}" alt="${escapeHtml(title)} emblem" />
      </div>
    `;
  }

  // Monogram fallback
  const initial = (title || projectId || 'L').trim().substring(0, 2).toUpperCase();
  return `
    <div class="pd-launch-icon-box pd-launch-icon-monogram ${shapeClass} ${sizeClass} ${extraClasses}">
      <span>${escapeHtml(initial)}</span>
    </div>
  `;
}

export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
