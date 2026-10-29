import { Project, ItemCategory, LaunchStatus, IconShape, IconSize, IconFit } from '../types';
import { PROJECT_TEMPLATES } from '../templates';
import { saveProject, deleteProject } from '../services/projectService';
import { renderMarkdown } from './markdownRenderer';
import { getStatusConfig, getCategoryConfig, renderLaunchIconMarkup, escapeHtml } from '../launchUtils';
import { DEFAULT_SHOWCASE_PROJECTS } from '../defaultProjects';

type ViewMode = 'list' | 'edit';
type EditorTab = 'split' | 'edit' | 'preview';
type ListFilter = 'all' | 'collaboration' | 'launch' | 'doc';

export class AdminModal {
  private backdrop: HTMLDivElement | null = null;
  private currentProjects: Project[] = [];
  private currentView: ViewMode = 'list';
  private listFilter: ListFilter = 'all';
  private editingProject: Partial<Project> | null = null;
  private adminEmail: string = '';
  private editorTab: EditorTab = 'split';
  private onProjectUpdated?: () => void;

  constructor(adminEmail: string, onProjectUpdated?: () => void) {
    this.adminEmail = adminEmail;
    this.onProjectUpdated = onProjectUpdated;
  }

  public open(projects: Project[], initialEditProject?: Project, initialCategory?: ItemCategory) {
    this.currentProjects = projects;
    this.currentView = initialEditProject ? 'edit' : (projects.length === 0 ? 'edit' : 'list');
    
    if (initialEditProject) {
      this.editingProject = {
        ...initialEditProject,
        category: initialEditProject.category || 'launch',
        icon: initialEditProject.icon ? { ...initialEditProject.icon } : undefined,
      };
    } else if (projects.length === 0) {
      this.editingProject = this.createBlankProject(initialCategory || 'launch');
    } else {
      this.editingProject = null;
    }

    this.render();
  }

  public close() {
    if (this.backdrop) {
      this.backdrop.classList.add('pd-closing');
      setTimeout(() => {
        this.backdrop?.remove();
        this.backdrop = null;
        document.body.style.overflow = '';
      }, 200);
    }
  }

  public updateProjects(projects: Project[]) {
    this.currentProjects = projects;
    if (this.currentView === 'list' && this.backdrop) {
      this.render();
    }
  }

  private createBlankProject(category: ItemCategory = 'launch'): Partial<Project> {
    const matchingCount = this.currentProjects.filter(p => (p.category || 'launch') === category).length + 1;
    const padded = matchingCount < 10 ? `0${matchingCount}` : `${matchingCount}`;

    let prefix = 'LNCH';
    if (category === 'collaboration') prefix = 'CLB';
    if (category === 'doc') prefix = 'DOC';

    // Pick a matching default template
    const template = PROJECT_TEMPLATES.find(t => t.category === category) || PROJECT_TEMPLATES[0];

    return {
      category,
      projectId: `${prefix}-${padded}`,
      title: template.defaultTitle,
      status: template.defaultStatus || 'In Dev',
      shortDesc: template.description,
      readme: template.content,
      clientName: template.defaultClientName || '',
      clientRole: template.defaultClientRole || '',
      clientPeriod: '',
      docType: template.defaultDocType || (category === 'doc' ? 'Research Paper' : ''),
      docReadingTime: template.defaultDocReadingTime || (category === 'doc' ? '8 min read' : ''),
      docDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      docContext: template.defaultDocContext || '',
      externalUrl: '',
      githubUrl: 'https://github.com/ponnusamy-dynamics/',
      liveUrl: '',
      tags: [...template.defaultTags],
      order: matchingCount,
      published: true,
      authorEmail: this.adminEmail,
      icon: undefined,
    };
  }

  private render() {
    if (this.backdrop) {
      this.backdrop.remove();
    }

    this.backdrop = document.createElement('div');
    this.backdrop.id = 'pd-admin-modal-backdrop';
    this.backdrop.className = 'pd-modal-backdrop';

    this.backdrop.innerHTML = `
      <div class="pd-modal-panel pd-admin-panel" role="dialog" aria-modal="true">
        <!-- Admin Console Header -->
        <div class="pd-modal-header">
          <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <div class="pd-admin-badge">
              <span class="status-indicator-dot" style="background: #10B981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);"></span>
              <span>ADMIN CONSOLE // CONTENT DIRECTIVE</span>
            </div>
            <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
              ${escapeHtml(this.adminEmail)}
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            ${this.currentView === 'edit' ? `
              <button class="pd-btn pd-btn-secondary pd-btn-sm" id="admin-nav-back-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                <span>ALL ITEMS</span>
              </button>
            ` : `
              <div class="pd-new-dropdown-wrapper">
                <button class="pd-btn pd-btn-primary pd-btn-sm" id="admin-create-new-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>+ NEW ENTRY</span>
                </button>
              </div>
            `}
            <button class="pd-close-btn" id="admin-close-btn" aria-label="Close Admin Console">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Body View -->
        <div class="pd-admin-content">
          ${this.currentView === 'list' ? this.renderListView() : this.renderEditView()}
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    document.body.style.overflow = 'hidden';

    this.bindEvents();
  }

  private renderListView(): string {
    const totalCount = this.currentProjects.length;
    const collabs = this.currentProjects.filter(p => (p.category || 'launch') === 'collaboration');
    const launches = this.currentProjects.filter(p => (p.category || 'launch') === 'launch');
    const docs = this.currentProjects.filter(p => (p.category || 'launch') === 'doc');

    let filteredProjects = this.currentProjects;
    if (this.listFilter === 'collaboration') filteredProjects = collabs;
    if (this.listFilter === 'launch') filteredProjects = launches;
    if (this.listFilter === 'doc') filteredProjects = docs;

    return `
      <div class="pd-list-container">
        <!-- Filter Tabs & Quick Action Bar -->
        <div class="pd-admin-tabs-bar">
          <div class="pd-admin-tabs-group">
            <button class="pd-tab-btn ${this.listFilter === 'all' ? 'active' : ''}" data-filter="all">
              <span>ALL DIRECTIVES (${totalCount})</span>
            </button>
            <button class="pd-tab-btn ${this.listFilter === 'collaboration' ? 'active' : ''}" data-filter="collaboration">
              <span class="pd-tab-dot" style="background:#06B6D4;"></span>
              <span>COLLABORATIONS / CLIENTS (${collabs.length})</span>
            </button>
            <button class="pd-tab-btn ${this.listFilter === 'launch' ? 'active' : ''}" data-filter="launch">
              <span class="pd-tab-dot" style="background:#10B981;"></span>
              <span>DEPLOYED LAUNCHES (${launches.length})</span>
            </button>
            <button class="pd-tab-btn ${this.listFilter === 'doc' ? 'active' : ''}" data-filter="doc">
              <span class="pd-tab-dot" style="background:#FB7185;"></span>
              <span>DOCS &amp; RESEARCH (${docs.length})</span>
            </button>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="pd-btn pd-btn-secondary pd-btn-sm" id="btn-quick-create-collab">+ COLLAB</button>
            <button class="pd-btn pd-btn-secondary pd-btn-sm" id="btn-quick-create-launch">+ LAUNCH</button>
            <button class="pd-btn pd-btn-secondary pd-btn-sm" id="btn-quick-create-doc">+ DOC</button>
            <button class="pd-btn pd-btn-ghost pd-btn-sm" id="btn-seed-showcase" title="Write/sync all 8 curated showcase projects across Collaborations, Launches, and Docs to Firestore">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>SYNC SHOWCASE</span>
            </button>
          </div>
        </div>

        ${filteredProjects.length === 0 ? `
          <div class="pd-empty-state">
            <div style="font-family: var(--font-mono); font-size: 20px; color: var(--accent-status); margin-bottom: 12px;">// NO ENTRIES IN THIS CATEGORY</div>
            <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto 24px;">
              No records found for the selected category. You can initialize a new collaboration, launch, or technical document, or synchronize the full curated showcase to Firestore.
            </p>
            <div style="display: flex; justify-content: center; gap: 12px;">
              <button class="pd-btn pd-btn-primary" id="admin-empty-create-btn">
                <span>CREATE FIRST ENTRY</span>
              </button>
              <button class="pd-btn pd-btn-secondary" id="admin-empty-seed-btn">
                <span>SEED SHOWCASE DIRECTIVES</span>
              </button>
            </div>
          </div>
        ` : `
          <div class="pd-list-header-row">
            <span>CATEGORY &amp; TITLE</span>
            <span>CONTEXT / CLIENT / STAGE</span>
            <span>VISIBILITY</span>
            <span style="text-align: right;">OPERATIONS</span>
          </div>

          <div class="pd-list-items">
            ${filteredProjects.map((p) => {
              const cat = p.category || 'launch';
              const catCfg = getCategoryConfig(cat);
              const st = getStatusConfig(p.status);

              let contextDetailHtml = '';
              if (cat === 'collaboration') {
                contextDetailHtml = `
                  <span class="pd-collab-tag">
                    <strong>${escapeHtml(p.clientName || 'Partner/Club')}</strong>
                    ${p.clientRole ? ` · <span style="opacity:0.8;">${escapeHtml(p.clientRole)}</span>` : ''}
                  </span>
                `;
              } else if (cat === 'doc') {
                contextDetailHtml = `
                  <span class="pd-doc-tag">
                    <span>${escapeHtml(p.docType || 'Doc')}</span>
                    ${p.docReadingTime ? ` · ${escapeHtml(p.docReadingTime)}` : ''}
                  </span>
                `;
              } else {
                contextDetailHtml = `
                  <span class="pd-status-pill" style="background:${st.bg}; color:${st.text}; border-color:${st.border};">
                    <span class="status-indicator-dot" style="width:5px; height:5px; background:${st.badgeDot}; display:inline-block; vertical-align:middle; margin-right:4px;"></span>
                    ${escapeHtml(st.label)}
                  </span>
                `;
              }

              return `
                <div class="pd-list-item" data-id="${escapeHtml(p.id || '')}">
                  <div class="pd-list-title-col">
                    ${renderLaunchIconMarkup(p.icon, p.title, p.projectId, 'pd-list-thumb', 'sm')}
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span class="pd-category-pill" style="background:${catCfg.bg}; color:${catCfg.color}; border-color:${catCfg.border};">
                          ${catCfg.iconSvg}
                          <span>${escapeHtml(catCfg.shortLabel)}</span>
                        </span>
                        <span class="pd-id-badge">${escapeHtml(p.projectId)}</span>
                        <span class="pd-list-title">${escapeHtml(p.title)}</span>
                      </div>
                      <div class="pd-list-subtitle">${escapeHtml(p.shortDesc || 'No summary provided.')}</div>
                    </div>
                  </div>

                  <div>
                    ${contextDetailHtml}
                  </div>

                  <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                    ${p.published
                      ? '<span class="pd-vis-badge pd-vis-live"><span class="dot-green"></span> PUBLIC</span>'
                      : '<span class="pd-vis-badge pd-vis-draft">DRAFT ONLY</span>'
                    }
                    ${(p.isRestricted || p.restricted)
                      ? '<span class="pd-vis-badge pd-vis-restricted" title="Card shown to public, but details are redacted"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> RESTRICTED</span>'
                      : ''
                    }
                    ${(p.isClassified || p.classified)
                      ? '<span class="pd-vis-badge pd-vis-classified" title="Hidden completely from public; only visible to admin"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> CLASSIFIED</span>'
                      : ''
                    }
                  </div>

                  <div class="pd-list-actions-col">
                    <button class="pd-btn pd-btn-secondary pd-btn-sm edit-proj-btn" data-id="${escapeHtml(p.id || '')}">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      <span>EDIT</span>
                    </button>
                    <button class="pd-btn pd-btn-danger pd-btn-sm delete-proj-btn" data-id="${escapeHtml(p.id || '')}" data-title="${escapeHtml(p.title)}">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  private renderEditView(): string {
    const p = this.editingProject || this.createBlankProject('launch');
    const isNew = !p.id;
    const category = (p.category || 'launch') as ItemCategory;
    const tags = p.tags || [];

    const currentStatus = (p.status as LaunchStatus) || 'In Dev';
    const statusCfg = getStatusConfig(currentStatus);

    const iconShape = p.icon?.shape || 'squircle';
    const iconSize = p.icon?.size || 'md';
    const iconFit = p.icon?.fit || 'cover';
    const iconData = p.icon?.data || '';

    const isRestricted = Boolean(p.isRestricted ?? p.restricted ?? false);
    const isClassified = Boolean(p.isClassified ?? p.classified ?? false);

    const suggestedTags = ['RUST', 'TYPESCRIPT', 'C++', 'GO', 'SYSTEMS', 'CLI', 'LINUX', 'WASM', 'KERNEL', 'TELEMETRY', 'NETWORK', 'CLIENT', 'RESEARCH'];

    return `
      <div class="pd-editor-container">
        
        <!-- SECTION 0: PRIMARY CATEGORY SELECTOR -->
        <div class="pd-editor-section-card pd-category-choice-card">
          <div class="pd-section-card-header">
            <span class="pd-section-num">// 00</span>
            <span class="pd-section-title">SECTION DIRECTIVE &amp; CATEGORY</span>
            <span class="pd-section-sub">// SELECT WHERE THIS ITEM BELONGS ON THE WEBSITE</span>
          </div>

          <div class="pd-category-cards-grid" id="category-radio-group">
            <!-- Option 1: Collaboration / Client -->
            <label class="pd-category-select-card ${category === 'collaboration' ? 'selected' : ''}" data-cat="collaboration">
              <input type="radio" name="project-category" value="collaboration" ${category === 'collaboration' ? 'checked' : ''}>
              <div class="pd-cat-icon" style="color: #06B6D4;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <div class="pd-cat-info">
                <span class="pd-cat-title">COLLABORATIONS / CLIENTS</span>
                <span class="pd-cat-desc">Projects made for other companies, industry clients, or collegiate clubs with reference to said organization.</span>
              </div>
            </label>

            <!-- Option 2: Own Deployed Launch -->
            <label class="pd-category-select-card ${category === 'launch' ? 'selected' : ''}" data-cat="launch">
              <input type="radio" name="project-category" value="launch" ${category === 'launch' ? 'checked' : ''}>
              <div class="pd-cat-icon" style="color: #10B981;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              </div>
              <div class="pd-cat-info">
                <span class="pd-cat-title">DEPLOYED LAUNCHES</span>
                <span class="pd-cat-desc">My own repos, systems tooling, and independent software releases with version stages.</span>
              </div>
            </label>

            <!-- Option 3: Docs & Research -->
            <label class="pd-category-select-card ${category === 'doc' ? 'selected' : ''}" data-cat="doc">
              <input type="radio" name="project-category" value="doc" ${category === 'doc' ? 'checked' : ''}>
              <div class="pd-cat-icon" style="color: #FB7185;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <div class="pd-cat-info">
                <span class="pd-cat-title">DOCS &amp; RESEARCH</span>
                <span class="pd-cat-desc">Technical research papers, architecture specifications, RFCs, and field documentation.</span>
              </div>
            </label>
          </div>
        </div>

        <!-- SECTION 1: IDENTITY & CONTEXT -->
        <div class="pd-editor-section-card" style="margin-top: 18px;">
          <div class="pd-section-card-header">
            <span class="pd-section-num">// 01</span>
            <span class="pd-section-title" id="section-01-heading">
              ${category === 'collaboration' ? 'CLIENT / COLLABORATION IDENTITY' : (category === 'doc' ? 'DOCUMENT IDENTIFIER & CLASSIFICATION' : 'LAUNCH IDENTITY & STAGE')}
            </span>
          </div>

          <div class="pd-editor-meta-grid">
            <div class="pd-form-group">
              <label class="pd-label" for="edit-project-id">IDENTIFIER</label>
              <input type="text" id="edit-project-id" class="pd-input pd-input-prominent" value="${escapeHtml(p.projectId || '')}" placeholder="CLB-01, LNCH-01 or DOC-01" required>
              <span class="pd-input-hint">Unique alphanumeric ID</span>
            </div>

            <div class="pd-form-group" style="grid-column: span 2;">
              <label class="pd-label" for="edit-title">TITLE</label>
              <input type="text" id="edit-title" class="pd-input pd-input-prominent" value="${escapeHtml(p.title || '')}" placeholder="E.g. AVIONICS GROUND CONSOLE" required>
              <span class="pd-input-hint">Prominently displayed header</span>
            </div>

            <!-- Stage selector (Active for Launches) -->
            <div class="pd-form-group" id="field-group-status" style="${category === 'launch' ? '' : 'display:none;'}">
              <label class="pd-label" for="edit-status">DEVELOPMENT STAGE</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <select id="edit-status" class="pd-select pd-select-prominent">
                  <option value="Projected" ${currentStatus === 'Projected' ? 'selected' : ''}>Projected (Sky Blue)</option>
                  <option value="In Dev" ${currentStatus === 'In Dev' ? 'selected' : ''}>In Dev (Amber)</option>
                  <option value="Beta" ${currentStatus === 'Beta' ? 'selected' : ''}>Beta (Violet)</option>
                  <option value="Published" ${currentStatus === 'Published' ? 'selected' : ''}>Published (Emerald)</option>
                </select>
                <div id="status-preview-pill" class="pd-status-pill" style="background:${statusCfg.bg}; color:${statusCfg.text}; border-color:${statusCfg.border};">
                  ${statusCfg.label}
                </div>
              </div>
              <span class="pd-input-hint">Coordinates status badge &amp; accent color</span>
            </div>

            <!-- Document Classification (Active for Docs) -->
            <div class="pd-form-group" id="field-group-doctype" style="${category === 'doc' ? '' : 'display:none;'}">
              <label class="pd-label" for="edit-doctype">DOCUMENT TYPE</label>
              <input type="text" id="edit-doctype" class="pd-input pd-input-prominent" value="${escapeHtml(p.docType || 'Research Paper')}" placeholder="Research Paper, RFC, Whitepaper">
              <span class="pd-input-hint">Paper or document classification</span>
            </div>
          </div>

          <!-- COLLABORATION CONTEXT FIELDS (Company, Role, Period) -->
          <div id="collab-specific-fields" style="${category === 'collaboration' ? 'display: grid;' : 'display: none;'}" class="pd-context-fields-grid">
            <div class="pd-form-group">
              <label class="pd-label" for="edit-client-name">COMPANY / CLUB / ORG NAME</label>
              <input type="text" id="edit-client-name" class="pd-input pd-input-prominent" value="${escapeHtml(p.clientName || '')}" placeholder="E.g. Hyperloop Engineering Club, Apex Corp">
              <span class="pd-input-hint">The client company or club this was built for</span>
            </div>

            <div class="pd-form-group">
              <label class="pd-label" for="edit-client-role">YOUR ROLE / ENGAGEMENT</label>
              <input type="text" id="edit-client-role" class="pd-input" value="${escapeHtml(p.clientRole || '')}" placeholder="E.g. Lead Embedded Systems Engineer, Contractor">
              <span class="pd-input-hint">Your contribution role or engagement scope</span>
            </div>

            <div class="pd-form-group">
              <label class="pd-label" for="edit-client-period">TIMELINE / PERIOD</label>
              <input type="text" id="edit-client-period" class="pd-input" value="${escapeHtml(p.clientPeriod || '')}" placeholder="E.g. 2024 - 2025 or Summer 2024">
              <span class="pd-input-hint">Duration of the initiative</span>
            </div>
          </div>

          <!-- DOCS CONTEXT FIELDS (Reading Time, Date, Context details, External URL) -->
          <div id="doc-specific-fields" style="${category === 'doc' ? 'display: grid;' : 'display: none;'}" class="pd-context-fields-grid">
            <div class="pd-form-group">
              <label class="pd-label" for="edit-doc-reading-time">ESTIMATED READING TIME / PAGES</label>
              <input type="text" id="edit-doc-reading-time" class="pd-input" value="${escapeHtml(p.docReadingTime || '8 min read')}" placeholder="E.g. 8 min read or 14 pages">
            </div>

            <div class="pd-form-group">
              <label class="pd-label" for="edit-doc-date">PUBLICATION / REVISION DATE</label>
              <input type="text" id="edit-doc-date" class="pd-input" value="${escapeHtml(p.docDate || '')}" placeholder="E.g. September 2026">
            </div>

            <div class="pd-form-group">
              <label class="pd-label" for="edit-external-url">EXTERNAL PAPER / PDF / ARXIV LINK</label>
              <input type="url" id="edit-external-url" class="pd-input" value="${escapeHtml(p.externalUrl || '')}" placeholder="https://arxiv.org/abs/...">
              <span class="pd-input-hint">Optional direct link to publication or preprint</span>
            </div>

            <div class="pd-form-group" style="grid-column: span 3;">
              <label class="pd-label" for="edit-doc-context">RESEARCH CONTEXT &amp; METHODOLOGY OVERVIEW</label>
              <input type="text" id="edit-doc-context" class="pd-input" value="${escapeHtml(p.docContext || '')}" placeholder="E.g. Experimental evaluation of lockless ring buffers across dual-socket AMD EPYC NUMA nodes under 100M-event workloads.">
              <span class="pd-input-hint">Context details displayed in the document highlight bar</span>
            </div>
          </div>
        </div>

        <!-- SECTION 2: EMBLEM / ICON (FILE UPLOAD + SHAPE + SIZE) -->
        <div class="pd-editor-section-card" style="margin-top: 18px;">
          <div class="pd-section-card-header">
            <span class="pd-section-num">// 02</span>
            <span class="pd-section-title">VISUAL EMBLEM / ICON</span>
            <span class="pd-section-sub">// UPLOAD COMPANY LOGO, PROJECT ICON, OR MONOGRAM</span>
          </div>

          <div class="pd-icon-editor-grid">
            <!-- Left: Upload & Controls -->
            <div class="pd-icon-controls-col">
              <div class="pd-form-group">
                <label class="pd-label">IMAGE / FILE ASSET</label>
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                  <label class="pd-btn pd-btn-secondary" style="cursor: pointer;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>UPLOAD IMAGE FILE</span>
                    <input type="file" id="icon-file-input" accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif" style="display: none;">
                  </label>
                  
                  ${iconData ? `
                    <button type="button" class="pd-btn pd-btn-danger pd-btn-sm" id="btn-remove-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      <span>REMOVE ICON</span>
                    </button>
                  ` : ''}

                  <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);" id="icon-filename-label">
                    ${iconData ? '✓ Custom icon attached' : 'PNG, JPG, WebP, SVG (Auto-compressed)'}
                  </span>
                </div>
              </div>

              <!-- Shape Selector -->
              <div class="pd-form-group" style="margin-top: 12px;">
                <label class="pd-label">ICON SHAPE</label>
                <div class="pd-segmented-group" id="icon-shape-selector">
                  <button type="button" class="pd-seg-btn ${iconShape === 'squircle' ? 'active' : ''}" data-shape="squircle">
                    <span class="pd-mini-shape squircle"></span>
                    <span>SQUIRCLE</span>
                  </button>
                  <button type="button" class="pd-seg-btn ${iconShape === 'circle' ? 'active' : ''}" data-shape="circle">
                    <span class="pd-mini-shape circle"></span>
                    <span>CIRCLE</span>
                  </button>
                  <button type="button" class="pd-seg-btn ${iconShape === 'square' ? 'active' : ''}" data-shape="square">
                    <span class="pd-mini-shape square"></span>
                    <span>SQUARE</span>
                  </button>
                  <button type="button" class="pd-seg-btn ${iconShape === 'hexagon' ? 'active' : ''}" data-shape="hexagon">
                    <span class="pd-mini-shape hexagon"></span>
                    <span>HEXAGON</span>
                  </button>
                </div>
              </div>

              <!-- Size & Fit Selector -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px;">
                <div class="pd-form-group">
                  <label class="pd-label">ICON SIZE</label>
                  <div class="pd-segmented-group" id="icon-size-selector">
                    <button type="button" class="pd-seg-btn ${iconSize === 'sm' ? 'active' : ''}" data-size="sm">
                      <span>36px</span>
                    </button>
                    <button type="button" class="pd-seg-btn ${iconSize === 'md' ? 'active' : ''}" data-size="md">
                      <span>46px</span>
                    </button>
                    <button type="button" class="pd-seg-btn ${iconSize === 'lg' ? 'active' : ''}" data-size="lg">
                      <span>58px</span>
                    </button>
                  </div>
                </div>

                <div class="pd-form-group">
                  <label class="pd-label">IMAGE FIT</label>
                  <div class="pd-segmented-group" id="icon-fit-selector">
                    <button type="button" class="pd-seg-btn ${iconFit === 'cover' ? 'active' : ''}" data-fit="cover">
                      <span>COVER</span>
                    </button>
                    <button type="button" class="pd-seg-btn ${iconFit === 'contain' ? 'active' : ''}" data-fit="contain">
                      <span>CONTAIN</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Live Interactive Emblem Preview Card -->
            <div class="pd-icon-preview-col">
              <span class="pd-label" style="display: block; margin-bottom: 8px;">LIVE PREVIEW IN CARD CONTEXT</span>
              <div class="pd-icon-preview-display-card">
                <div id="live-icon-render-target">
                  ${renderLaunchIconMarkup(
                    this.editingProject?.icon,
                    p.title || 'Entry',
                    p.projectId || 'ITEM-01',
                    'pd-preview-glow'
                  )}
                </div>
                <div class="pd-preview-meta">
                  <div class="pd-preview-title" id="preview-title-reflect">${escapeHtml(p.title || 'UNTITLED ENTRY')}</div>
                  <div class="pd-preview-sub" id="preview-id-reflect">
                    ${escapeHtml(p.projectId || 'ITEM-01')} // <span id="preview-cat-label">${escapeHtml(getCategoryConfig(category).label)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 3: REPOSITORIES, LINKS & VISIBILITY -->
        <div class="pd-editor-section-card" style="margin-top: 18px;">
          <div class="pd-section-card-header">
            <span class="pd-section-num">// 03</span>
            <span class="pd-section-title">DEPLOYMENT LINKS &amp; VISIBILITY</span>
          </div>

          <div class="pd-editor-meta-grid">
            <div class="pd-form-group">
              <label class="pd-label" for="edit-github-url">GITHUB / SOURCE REPO URL</label>
              <input type="url" id="edit-github-url" class="pd-input" value="${escapeHtml(p.githubUrl || '')}" placeholder="https://github.com/ponnusamy-dynamics/...">
              <span class="pd-input-hint">Adds GitHub link and Clone button</span>
            </div>

            <div class="pd-form-group">
              <label class="pd-label" for="edit-live-url">LIVE SYSTEM / DEMO / DOCS URL</label>
              <input type="url" id="edit-live-url" class="pd-input" value="${escapeHtml(p.liveUrl || '')}" placeholder="https://sys.ponnusamy.dyn">
              <span class="pd-input-hint">Adds Live Link button</span>
            </div>

            <div class="pd-form-group">
              <label class="pd-label" for="edit-order">DISPLAY SEQUENCE</label>
              <input type="number" id="edit-order" class="pd-input" value="${p.order ?? 1}" min="1" step="1">
              <span class="pd-input-hint">Numerical sort priority within its section</span>
            </div>

            <div class="pd-form-group" style="display: flex; flex-direction: column; justify-content: flex-start;">
              <label class="pd-label">PUBLIC VISIBILITY</label>
              <label class="pd-toggle-card">
                <input type="checkbox" id="edit-published" ${p.published !== false ? 'checked' : ''}>
                <div class="pd-toggle-track">
                  <div class="pd-toggle-thumb"></div>
                </div>
                <div class="pd-toggle-info">
                  <span class="pd-toggle-label" id="visibility-label">${p.published !== false ? 'PUBLIC LIVE' : 'DRAFT ONLY'}</span>
                  <span class="pd-toggle-desc">Publish status in registry</span>
                </div>
              </label>
            </div>
          </div>

          <!-- ACCESS CONTROL & SECURITY CLEARANCE GOVERNANCE -->
          <div style="margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.07);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em; color: var(--text-muted);">
                // SECURITY CLEARANCE &amp; VISIBILITY DIRECTIVES
              </span>
              <span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);">
                ROLE-BASED REDACTION CONTROLS
              </span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
              
              <!-- TOGGLE 1: RESTRICTED ACCESS -->
              <div class="pd-form-group" style="margin: 0;">
                <label class="pd-label" style="display: flex; align-items: center; gap: 6px; color: #F59E0B;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span>RESTRICTED ACCESS</span>
                </label>
                <label class="pd-toggle-card ${isRestricted ? 'pd-card-restricted' : ''}">
                  <input type="checkbox" id="edit-restricted" ${isRestricted ? 'checked' : ''}>
                  <div class="pd-toggle-track">
                    <div class="pd-toggle-thumb"></div>
                  </div>
                  <div class="pd-toggle-info">
                    <span class="pd-toggle-label" id="restricted-toggle-label" style="color: ${isRestricted ? '#F59E0B' : 'inherit'};">
                      ${isRestricted ? 'RESTRICTED (CLEARANCE REQ)' : 'UNRESTRICTED (PUBLIC SPEC)'}
                    </span>
                    <span class="pd-toggle-desc">
                      Shows card to public, but hides specs/details. Public sees restricted info notice; full details visible only to admin.
                    </span>
                  </div>
                </label>
              </div>

              <!-- TOGGLE 2: CLASSIFIED DIRECTIVE -->
              <div class="pd-form-group" style="margin: 0;">
                <label class="pd-label" style="display: flex; align-items: center; gap: 6px; color: #EF4444;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  <span>CLASSIFIED DIRECTIVE</span>
                </label>
                <label class="pd-toggle-card ${isClassified ? 'pd-card-classified' : ''}">
                  <input type="checkbox" id="edit-classified" ${isClassified ? 'checked' : ''}>
                  <div class="pd-toggle-track">
                    <div class="pd-toggle-thumb"></div>
                  </div>
                  <div class="pd-toggle-info">
                    <span class="pd-toggle-label" id="classified-toggle-label" style="color: ${isClassified ? '#EF4444' : 'inherit'};">
                      ${isClassified ? 'CLASSIFIED (TOP SECRET)' : 'PUBLIC REGISTRY'}
                    </span>
                    <span class="pd-toggle-desc">
                      Completely hidden from public. Public will NOT see that this project even exists. Visible only to admin.
                    </span>
                  </div>
                </label>
              </div>

            </div>
          </div>
        </div>

        <!-- SECTION 4: SUMMARY & TECH TAGS -->
        <div class="pd-editor-section-card" style="margin-top: 18px;">
          <div class="pd-section-card-header">
            <span class="pd-section-num">// 04</span>
            <span class="pd-section-title">BRIEF SUMMARY &amp; TECH TAGS</span>
          </div>

          <div class="pd-form-group">
            <label class="pd-label" for="edit-short-desc">SUMMARY (1-2 SENTENCES FOR GRID PREVIEW)</label>
            <input type="text" id="edit-short-desc" class="pd-input" value="${escapeHtml(p.shortDesc || '')}" placeholder="High-throughput systems coordination runtime for zero-allocation stream pipelines.">
          </div>

          <div class="pd-form-group" style="margin-top: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="pd-label">TECH STACK / DOMAIN TAGS</label>
              <span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);">CLICK CHIP TO REMOVE OR SELECT SUGGESTIONS</span>
            </div>

            <div class="pd-tags-editor-box">
              <div class="pd-active-tags-list" id="active-tags-container">
                ${tags.map((t) => `
                  <span class="pd-chip-removable" data-tag="${escapeHtml(t)}">
                    <span>${escapeHtml(t)}</span>
                    <button type="button" class="remove-tag-btn" data-tag="${escapeHtml(t)}" aria-label="Remove tag">&times;</button>
                  </span>
                `).join('')}
              </div>

              <div style="display: flex; gap: 8px; margin-top: 10px;">
                <input type="text" id="new-tag-input" class="pd-input pd-input-sm" placeholder="Add custom tag (e.g. eBPF) &amp; Press Enter" style="max-width: 320px;">
                <button type="button" class="pd-btn pd-btn-secondary pd-btn-sm" id="add-tag-btn">+ ADD TAG</button>
              </div>

              <div class="pd-suggested-tags-row">
                <span style="font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); margin-right: 4px;">SUGGESTED:</span>
                ${suggestedTags.map(st => `
                  <button type="button" class="pd-tag-suggest-btn" data-tag="${st}">+ ${st}</button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 5: FULL DOCUMENTATION (MARKDOWN) -->
        <div class="pd-editor-section-card" style="margin-top: 18px;">
          <div class="pd-section-card-header">
            <span class="pd-section-num">// 05</span>
            <span class="pd-section-title" id="section-05-heading">
              ${category === 'doc' ? 'DOCUMENT WRITEUP & RESEARCH CONTENT (MARKDOWN)' : 'TECHNICAL SPECIFICATION (README.md)'}
            </span>
          </div>

          <div class="pd-readme-editor-section">
            <div class="pd-readme-editor-topbar">
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <span class="pd-label" style="margin: 0;">SPECIFICATION WORKSPACE</span>

                <!-- Template selector -->
                <div class="pd-template-dropdown-wrapper">
                  <select id="template-select" class="pd-select pd-select-sm">
                    <option value="">-- Apply Architecture Template --</option>
                    ${PROJECT_TEMPLATES.map((tpl, idx) => `
                      <option value="${idx}">[${tpl.category.toUpperCase()}] ${escapeHtml(tpl.name)}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 6px;">
                <button type="button" class="pd-mode-btn ${this.editorTab === 'split' ? 'active' : ''}" data-tab="split" title="Split View">
                  <span>SPLIT</span>
                </button>
                <button type="button" class="pd-mode-btn ${this.editorTab === 'edit' ? 'active' : ''}" data-tab="edit" title="Editor Only">
                  <span>EDIT</span>
                </button>
                <button type="button" class="pd-mode-btn ${this.editorTab === 'preview' ? 'active' : ''}" data-tab="preview" title="Preview Only">
                  <span>PREVIEW</span>
                </button>
              </div>
            </div>

            <!-- Markdown Toolbar -->
            <div class="pd-md-toolbar">
              <button type="button" class="pd-tool-btn" data-insert="# " title="Heading 1">H1</button>
              <button type="button" class="pd-tool-btn" data-insert="## " title="Heading 2">H2</button>
              <button type="button" class="pd-tool-btn" data-insert="### " title="Heading 3">H3</button>
              <span class="pd-tool-divider"></span>
              <button type="button" class="pd-tool-btn" data-wrap="**" title="Bold"><strong>B</strong></button>
              <button type="button" class="pd-tool-btn" data-wrap="*" title="Italic"><em>I</em></button>
              <button type="button" class="pd-tool-btn" data-wrap="\`" title="Inline Code"><code>code</code></button>
              <span class="pd-tool-divider"></span>
              <button type="button" class="pd-tool-btn" data-snippet="codeblock" title="Code Block">\`\`\`block\`\`\`</button>
              <button type="button" class="pd-tool-btn" data-snippet="table" title="Table">Table</button>
              <button type="button" class="pd-tool-btn" data-snippet="task" title="Task List">[ ] Task</button>
              <button type="button" class="pd-tool-btn" data-snippet="quote" title="Callout Quote">&gt; Quote</button>
              <button type="button" class="pd-tool-btn" data-snippet="link" title="Hyperlink">[Link]</button>

              <div style="margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);" id="word-count-display">
                0 words
              </div>
            </div>

            <!-- Split Workspace -->
            <div class="pd-editor-workspace tab-${this.editorTab}">
              <div class="pd-editor-pane" id="editor-textarea-pane">
                <textarea id="edit-readme-textarea" class="pd-readme-textarea" placeholder="# Write GitHub-style Markdown here...&#10;&#10;Supports headers, tables, code blocks, ASCII diagrams, checklists, and research notes." spellcheck="false">${escapeHtml(p.readme || '')}</textarea>
              </div>

              <div class="pd-preview-pane" id="editor-preview-pane">
                <div class="pd-markdown-body" id="live-markdown-preview">
                  ${renderMarkdown(p.readme || '')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Footer Action Bar -->
        <div class="pd-editor-footer">
          <div>
            ${!isNew ? `
              <button type="button" class="pd-btn pd-btn-danger pd-btn-sm" id="btn-delete-current" data-id="${escapeHtml(p.id || '')}" data-title="${escapeHtml(p.title || '')}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>DELETE ENTRY</span>
              </button>
            ` : ''}
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <button type="button" class="pd-btn pd-btn-ghost" id="btn-cancel-edit">CANCEL</button>
            <button type="button" class="pd-btn pd-btn-secondary" id="btn-save-draft">SAVE DRAFT</button>
            <button type="button" class="pd-btn pd-btn-primary" id="btn-save-publish">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              <span>SAVE &amp; PUBLISH LIVE</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents() {
    if (!this.backdrop) return;

    // Backdrop click
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    // Close button
    const closeBtn = this.backdrop.querySelector('#admin-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    // Navigation back button
    const backBtn = this.backdrop.querySelector('#admin-nav-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.currentView = 'list';
        this.render();
      });
    }

    // Create New Button
    const createNewBtn = this.backdrop.querySelector('#admin-create-new-btn');
    if (createNewBtn) {
      createNewBtn.addEventListener('click', () => {
        const cat = this.listFilter === 'all' ? 'launch' : this.listFilter;
        this.editingProject = this.createBlankProject(cat as ItemCategory);
        this.currentView = 'edit';
        this.render();
      });
    }

    const emptyCreateBtn = this.backdrop.querySelector('#admin-empty-create-btn');
    if (emptyCreateBtn) {
      emptyCreateBtn.addEventListener('click', () => {
        const cat = this.listFilter === 'all' ? 'launch' : this.listFilter;
        this.editingProject = this.createBlankProject(cat as ItemCategory);
        this.currentView = 'edit';
        this.render();
      });
    }

    // Quick create category buttons in list view
    this.backdrop.querySelector('#btn-quick-create-collab')?.addEventListener('click', () => {
      this.editingProject = this.createBlankProject('collaboration');
      this.currentView = 'edit';
      this.render();
    });
    this.backdrop.querySelector('#btn-quick-create-launch')?.addEventListener('click', () => {
      this.editingProject = this.createBlankProject('launch');
      this.currentView = 'edit';
      this.render();
    });
    this.backdrop.querySelector('#btn-quick-create-doc')?.addEventListener('click', () => {
      this.editingProject = this.createBlankProject('doc');
      this.currentView = 'edit';
      this.render();
    });

    // Seed showcase button handler
    const handleSeedShowcase = async () => {
      if (confirm('Write/sync all 8 curated showcase projects across Collaborations, Launches, and Docs to Firestore?')) {
        try {
          this.showToast('SYNCING SHOWCASE TO FIRESTORE...');
          for (const p of DEFAULT_SHOWCASE_PROJECTS) {
            await saveProject(p, this.adminEmail);
          }
          this.showToast('SHOWCASE SYNCHRONIZED SUCCESSFULLY');
          if (this.onProjectUpdated) this.onProjectUpdated();
        } catch (err) {
          console.error('Seed error:', err);
          this.showToast('SYNC FAILED // CHECK CONSOLE', true);
        }
      }
    };

    this.backdrop.querySelector('#btn-seed-showcase')?.addEventListener('click', handleSeedShowcase);
    this.backdrop.querySelector('#admin-empty-seed-btn')?.addEventListener('click', handleSeedShowcase);

    // List view filter tabs
    this.backdrop.querySelectorAll('.pd-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const filter = (btn as HTMLElement).dataset.filter as ListFilter;
        if (filter) {
          this.listFilter = filter;
          this.render();
        }
      });
    });

    // List view actions: Edit & Delete
    this.backdrop.querySelectorAll('.edit-proj-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        const project = this.currentProjects.find(p => p.id === id);
        if (project) {
          this.editingProject = {
            ...project,
            category: project.category || 'launch',
            icon: project.icon ? { ...project.icon } : undefined,
          };
          this.currentView = 'edit';
          this.render();
        }
      });
    });

    this.backdrop.querySelectorAll('.delete-proj-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const id = target.dataset.id;
        const project = this.currentProjects.find(p => p.id === id);
        if (project) {
          this.showGitHubStyleDeleteModal(project);
        } else if (id) {
          const title = target.dataset.title || 'this item';
          this.showGitHubStyleDeleteModal({ id, title, projectId: id });
        }
      });
    });

    // If we're in edit view, bind editor events
    if (this.currentView === 'edit') {
      this.bindEditorEvents();
    }
  }

  private bindEditorEvents() {
    if (!this.backdrop) return;

    // CATEGORY SWITCHER (Section 0)
    const categoryCards = this.backdrop.querySelectorAll('.pd-category-select-card');
    categoryCards.forEach((card) => {
      card.addEventListener('click', () => {
        const selectedCat = (card as HTMLElement).dataset.cat as ItemCategory;
        if (!selectedCat) return;

        categoryCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const radio = card.querySelector('input[type="radio"]') as HTMLInputElement;
        if (radio) radio.checked = true;

        if (!this.editingProject) this.editingProject = {};
        this.editingProject.category = selectedCat;

        // Auto-update prefix if still blank or default
        const idInput = this.backdrop?.querySelector('#edit-project-id') as HTMLInputElement;
        if (idInput && (!idInput.value || idInput.value.match(/^(LNCH|CLB|DOC)-\d+$/))) {
          const matchingCount = this.currentProjects.filter(p => (p.category || 'launch') === selectedCat).length + 1;
          const padded = matchingCount < 10 ? `0${matchingCount}` : `${matchingCount}`;
          const prefix = selectedCat === 'collaboration' ? 'CLB' : (selectedCat === 'doc' ? 'DOC' : 'LNCH');
          idInput.value = `${prefix}-${padded}`;
        }

        // Toggle contextual field sections
        const collabFields = this.backdrop?.querySelector('#collab-specific-fields') as HTMLElement;
        const docFields = this.backdrop?.querySelector('#doc-specific-fields') as HTMLElement;
        const statusField = this.backdrop?.querySelector('#field-group-status') as HTMLElement;
        const docTypeField = this.backdrop?.querySelector('#field-group-doctype') as HTMLElement;
        const section01Heading = this.backdrop?.querySelector('#section-01-heading');
        const section05Heading = this.backdrop?.querySelector('#section-05-heading');

        if (collabFields) collabFields.style.display = selectedCat === 'collaboration' ? 'grid' : 'none';
        if (docFields) docFields.style.display = selectedCat === 'doc' ? 'grid' : 'none';
        if (statusField) statusField.style.display = selectedCat === 'launch' ? '' : 'none';
        if (docTypeField) docTypeField.style.display = selectedCat === 'doc' ? '' : 'none';

        if (section01Heading) {
          section01Heading.textContent = selectedCat === 'collaboration'
            ? 'CLIENT / COLLABORATION IDENTITY'
            : (selectedCat === 'doc' ? 'DOCUMENT IDENTIFIER & CLASSIFICATION' : 'LAUNCH IDENTITY & STAGE');
        }
        if (section05Heading) {
          section05Heading.textContent = selectedCat === 'doc'
            ? 'DOCUMENT WRITEUP & RESEARCH CONTENT (MARKDOWN)'
            : 'TECHNICAL SPECIFICATION (README.md)';
        }

        const catCfg = getCategoryConfig(selectedCat);
        const previewCat = this.backdrop?.querySelector('#preview-cat-label');
        if (previewCat) previewCat.textContent = catCfg.label;

        this.updateLiveIconPreview();
      });
    });

    const textarea = this.backdrop.querySelector('#edit-readme-textarea') as HTMLTextAreaElement;
    const preview = this.backdrop.querySelector('#live-markdown-preview') as HTMLDivElement;
    const wordCount = this.backdrop.querySelector('#word-count-display');

    const updatePreview = () => {
      if (!textarea || !preview) return;
      const text = textarea.value;
      preview.innerHTML = renderMarkdown(text);
      if (wordCount) {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        wordCount.textContent = `${words} words // ${chars} chars`;
      }
    };

    if (textarea) {
      textarea.addEventListener('input', updatePreview);
      updatePreview();
    }

    // Stage dropdown & real-time badge color update
    const statusSelect = this.backdrop.querySelector('#edit-status') as HTMLSelectElement;
    const statusBadge = this.backdrop.querySelector('#status-preview-pill') as HTMLElement;
    const previewSub = this.backdrop.querySelector('#preview-id-reflect') as HTMLElement;

    if (statusSelect) {
      statusSelect.addEventListener('change', () => {
        const selected = statusSelect.value as LaunchStatus;
        if (this.editingProject) {
          this.editingProject.status = selected;
        }
        const cfg = getStatusConfig(selected);
        if (statusBadge) {
          statusBadge.style.background = cfg.bg;
          statusBadge.style.color = cfg.text;
          statusBadge.style.borderColor = cfg.border;
          statusBadge.textContent = cfg.label;
        }
      });
    }

    // Title and ID reflection in preview card
    const titleInput = this.backdrop.querySelector('#edit-title') as HTMLInputElement;
    const previewTitle = this.backdrop.querySelector('#preview-title-reflect');
    if (titleInput && previewTitle) {
      titleInput.addEventListener('input', () => {
        previewTitle.textContent = titleInput.value.trim() || 'UNTITLED ENTRY';
        this.updateLiveIconPreview();
      });
    }

    const projIdInput = this.backdrop.querySelector('#edit-project-id') as HTMLInputElement;
    if (projIdInput && previewSub) {
      projIdInput.addEventListener('input', () => {
        this.updateLiveIconPreview();
      });
    }

    // Visibility toggle switch label
    const pubCheckbox = this.backdrop.querySelector('#edit-published') as HTMLInputElement;
    const visLabel = this.backdrop.querySelector('#visibility-label');
    if (pubCheckbox && visLabel) {
      pubCheckbox.addEventListener('change', () => {
        visLabel.textContent = pubCheckbox.checked ? 'PUBLIC LIVE' : 'DRAFT ONLY';
      });
    }

    // ICON FILE UPLOADER
    const fileInput = this.backdrop.querySelector('#icon-file-input') as HTMLInputElement;
    const filenameLabel = this.backdrop?.querySelector('#icon-filename-label') as HTMLElement | null;
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          const rawDataUrl = e.target?.result as string;

          if (file.type.includes('svg')) {
            this.setIconData(rawDataUrl, file.name);
            return;
          }

          const img = new Image();
          img.onload = () => {
            const maxDim = 256;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              const compressedData = canvas.toDataURL('image/webp', 0.88);
              this.setIconData(compressedData, file.name);
            } else {
              this.setIconData(rawDataUrl, file.name);
            }
          };
          img.onerror = () => {
            this.setIconData(rawDataUrl, file.name);
          };
          img.src = rawDataUrl;
        };
        reader.readAsDataURL(file);
      });
    }

    // Remove Icon Button
    const removeIconBtn = this.backdrop.querySelector('#btn-remove-icon');
    if (removeIconBtn) {
      removeIconBtn.addEventListener('click', () => {
        if (!this.editingProject) this.editingProject = {};
        this.editingProject.icon = undefined;
        if (filenameLabel) filenameLabel.textContent = 'Icon cleared. Monogram will be used.';
        this.updateLiveIconPreview();
        this.render();
      });
    }

    // Shape Selector
    this.backdrop.querySelectorAll('#icon-shape-selector .pd-seg-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const shape = (btn as HTMLElement).dataset.shape as IconShape;
        if (shape) {
          if (!this.editingProject) this.editingProject = {};
          if (!this.editingProject.icon) this.editingProject.icon = { data: '' };
          this.editingProject.icon.shape = shape;

          this.backdrop?.querySelectorAll('#icon-shape-selector .pd-seg-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.updateLiveIconPreview();
        }
      });
    });

    // Size Selector
    this.backdrop.querySelectorAll('#icon-size-selector .pd-seg-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const size = (btn as HTMLElement).dataset.size as IconSize;
        if (size) {
          if (!this.editingProject) this.editingProject = {};
          if (!this.editingProject.icon) this.editingProject.icon = { data: '' };
          this.editingProject.icon.size = size;

          this.backdrop?.querySelectorAll('#icon-size-selector .pd-seg-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.updateLiveIconPreview();
        }
      });
    });

    // Fit Selector
    this.backdrop.querySelectorAll('#icon-fit-selector .pd-seg-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const fit = (btn as HTMLElement).dataset.fit as IconFit;
        if (fit) {
          if (!this.editingProject) this.editingProject = {};
          if (!this.editingProject.icon) this.editingProject.icon = { data: '' };
          this.editingProject.icon.fit = fit;

          this.backdrop?.querySelectorAll('#icon-fit-selector .pd-seg-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.updateLiveIconPreview();
        }
      });
    });

    // Tab mode buttons
    this.backdrop.querySelectorAll('.pd-mode-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).dataset.tab as EditorTab;
        if (tab) {
          this.editorTab = tab;
          const workspace = this.backdrop?.querySelector('.pd-editor-workspace');
          if (workspace) {
            workspace.className = `pd-editor-workspace tab-${tab}`;
          }
          this.backdrop?.querySelectorAll('.pd-mode-btn').forEach(b => b.classList.remove('active'));
          (e.currentTarget as HTMLElement).classList.add('active');
        }
      });
    });

    // Template selector
    const tplSelect = this.backdrop.querySelector('#template-select') as HTMLSelectElement;
    if (tplSelect && textarea) {
      tplSelect.addEventListener('change', () => {
        const val = tplSelect.value;
        if (val !== '') {
          const tpl = PROJECT_TEMPLATES[parseInt(val, 10)];
          if (tpl) {
            if (!textarea.value.trim() || confirm(`Apply template "${tpl.name}"? This will replace your current specification content.`)) {
              textarea.value = tpl.content;
              const titleIn = this.backdrop?.querySelector('#edit-title') as HTMLInputElement;
              if (titleIn && (!titleIn.value || titleIn.value.includes('UNTITLED') || titleIn.value.startsWith('LNCH-') || titleIn.value.startsWith('CLB-') || titleIn.value.startsWith('DOC-'))) {
                titleIn.value = tpl.defaultTitle;
                if (previewTitle) previewTitle.textContent = tpl.defaultTitle;
              }
              const shortDescInput = this.backdrop?.querySelector('#edit-short-desc') as HTMLInputElement;
              if (shortDescInput && !shortDescInput.value) {
                shortDescInput.value = tpl.description;
              }

              // Apply category from template
              if (tpl.category) {
                const targetCard = this.backdrop?.querySelector(`.pd-category-select-card[data-cat="${tpl.category}"]`) as HTMLElement;
                if (targetCard) targetCard.click();
              }

              if (tpl.defaultClientName) {
                const clientIn = this.backdrop?.querySelector('#edit-client-name') as HTMLInputElement;
                if (clientIn) clientIn.value = tpl.defaultClientName;
              }
              if (tpl.defaultClientRole) {
                const roleIn = this.backdrop?.querySelector('#edit-client-role') as HTMLInputElement;
                if (roleIn) roleIn.value = tpl.defaultClientRole;
              }
              if (tpl.defaultDocType) {
                const docTypeIn = this.backdrop?.querySelector('#edit-doctype') as HTMLInputElement;
                if (docTypeIn) docTypeIn.value = tpl.defaultDocType;
              }
              if (tpl.defaultDocReadingTime) {
                const readIn = this.backdrop?.querySelector('#edit-doc-reading-time') as HTMLInputElement;
                if (readIn) readIn.value = tpl.defaultDocReadingTime;
              }
              if (tpl.defaultDocContext) {
                const ctxIn = this.backdrop?.querySelector('#edit-doc-context') as HTMLInputElement;
                if (ctxIn) ctxIn.value = tpl.defaultDocContext;
              }

              if (this.editingProject) {
                this.editingProject.tags = Array.from(new Set([...(this.editingProject.tags || []), ...tpl.defaultTags]));
                this.refreshTagsUI();
              }
              updatePreview();
              this.updateLiveIconPreview();
            }
          }
          tplSelect.value = '';
        }
      });
    }

    // Markdown Toolbar insert/wrap
    this.backdrop.querySelectorAll('.pd-tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!textarea) return;
        const insert = (btn as HTMLElement).dataset.insert;
        const wrap = (btn as HTMLElement).dataset.wrap;
        const snippet = (btn as HTMLElement).dataset.snippet;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end);

        let newText = '';

        if (insert) {
          newText = insert + selected;
        } else if (wrap) {
          newText = `${wrap}${selected || 'text'}${wrap}`;
        } else if (snippet) {
          switch (snippet) {
            case 'codeblock':
              newText = `\`\`\`rust\n${selected || '// Systems implementation'}\n\`\`\`\n`;
              break;
            case 'table':
              newText = `\n| Metric / Component | Value | Stage |\n| :--- | :--- | :--- |\n| Core Throughput | 340k ops/sec | Published |\n| P99 Latency | 8.2 µs | In Dev |\n\n`;
              break;
            case 'task':
              newText = `\n- [x] Phase 1: Prototype & empirical benchmarks\n- [ ] Phase 2: Staging rollout\n- [ ] Phase 3: Production launch\n`;
              break;
            case 'quote':
              newText = `\n> **Key Directive**: Zero-copy packet arenas remain pinned in hardware memory nodes.\n\n`;
              break;
            case 'link':
              newText = `[${selected || 'Resource Link'}](https://github.com/ponnusamy-dynamics/)`;
              break;
          }
        }

        if (newText) {
          textarea.setRangeText(newText, start, end, 'end');
          textarea.focus();
          updatePreview();
        }
      });
    });

    // Tag management
    const tagInput = this.backdrop.querySelector('#new-tag-input') as HTMLInputElement;
    const addTagBtn = this.backdrop.querySelector('#add-tag-btn');

    const addTag = (tag: string) => {
      const clean = tag.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (!clean) return;
      if (!this.editingProject) this.editingProject = {};
      const currentTags = this.editingProject.tags || [];
      if (!currentTags.includes(clean)) {
        this.editingProject.tags = [...currentTags, clean];
        this.refreshTagsUI();
      }
      if (tagInput) tagInput.value = '';
    };

    if (tagInput) {
      tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTag(tagInput.value);
        }
      });
    }

    if (addTagBtn) {
      addTagBtn.addEventListener('click', () => {
        if (tagInput) addTag(tagInput.value);
      });
    }

    this.backdrop.querySelectorAll('.pd-tag-suggest-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const tag = (b as HTMLElement).dataset.tag;
        if (tag) addTag(tag);
      });
    });

    // Cancel Button
    const cancelBtn = this.backdrop.querySelector('#btn-cancel-edit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.currentView = 'list';
        this.render();
      });
    }

    // Toggle change events for clearance labels
    const restrictedInput = this.backdrop.querySelector('#edit-restricted') as HTMLInputElement;
    const restrictedLabel = this.backdrop.querySelector('#restricted-toggle-label');
    restrictedInput?.addEventListener('change', () => {
      if (restrictedLabel) {
        restrictedLabel.textContent = restrictedInput.checked ? 'RESTRICTED (CLEARANCE REQ)' : 'UNRESTRICTED (PUBLIC SPEC)';
        (restrictedLabel as HTMLElement).style.color = restrictedInput.checked ? '#F59E0B' : 'inherit';
      }
    });

    const classifiedInput = this.backdrop.querySelector('#edit-classified') as HTMLInputElement;
    const classifiedLabel = this.backdrop.querySelector('#classified-toggle-label');
    classifiedInput?.addEventListener('change', () => {
      if (classifiedLabel) {
        classifiedLabel.textContent = classifiedInput.checked ? 'CLASSIFIED (TOP SECRET)' : 'PUBLIC REGISTRY';
        (classifiedLabel as HTMLElement).style.color = classifiedInput.checked ? '#EF4444' : 'inherit';
      }
    });

    // Delete Current Button
    const deleteCurrBtn = this.backdrop.querySelector('#btn-delete-current');
    if (deleteCurrBtn) {
      deleteCurrBtn.addEventListener('click', () => {
        if (this.editingProject && this.editingProject.id) {
          this.showGitHubStyleDeleteModal(this.editingProject);
        } else {
          const id = (deleteCurrBtn as HTMLElement).dataset.id;
          const title = (deleteCurrBtn as HTMLElement).dataset.title || 'this item';
          if (id) {
            this.showGitHubStyleDeleteModal({ id, title, projectId: id });
          }
        }
      });
    }

    // Save Handlers
    const handleSave = async (published: boolean) => {
      const selectedCategoryRadio = this.backdrop?.querySelector('input[name="project-category"]:checked') as HTMLInputElement;
      const category: ItemCategory = (selectedCategoryRadio?.value as ItemCategory) || (this.editingProject?.category as ItemCategory) || 'launch';

      const idIn = this.backdrop?.querySelector('#edit-project-id') as HTMLInputElement;
      const titleIn = this.backdrop?.querySelector('#edit-title') as HTMLInputElement;
      const statusSel = this.backdrop?.querySelector('#edit-status') as HTMLSelectElement;
      const shortDescIn = this.backdrop?.querySelector('#edit-short-desc') as HTMLInputElement;
      const githubIn = this.backdrop?.querySelector('#edit-github-url') as HTMLInputElement;
      const liveIn = this.backdrop?.querySelector('#edit-live-url') as HTMLInputElement;
      const orderIn = this.backdrop?.querySelector('#edit-order') as HTMLInputElement;
      const readmeIn = this.backdrop?.querySelector('#edit-readme-textarea') as HTMLTextAreaElement;

      // Access control toggles
      const restrictedIn = this.backdrop?.querySelector('#edit-restricted') as HTMLInputElement;
      const classifiedIn = this.backdrop?.querySelector('#edit-classified') as HTMLInputElement;
      const isRestricted = restrictedIn ? restrictedIn.checked : false;
      const isClassified = classifiedIn ? classifiedIn.checked : false;

      // Category-specific fields
      const clientNameIn = this.backdrop?.querySelector('#edit-client-name') as HTMLInputElement;
      const clientRoleIn = this.backdrop?.querySelector('#edit-client-role') as HTMLInputElement;
      const clientPeriodIn = this.backdrop?.querySelector('#edit-client-period') as HTMLInputElement;
      const docTypeIn = this.backdrop?.querySelector('#edit-doctype') as HTMLInputElement;
      const docReadingTimeIn = this.backdrop?.querySelector('#edit-doc-reading-time') as HTMLInputElement;
      const docDateIn = this.backdrop?.querySelector('#edit-doc-date') as HTMLInputElement;
      const docContextIn = this.backdrop?.querySelector('#edit-doc-context') as HTMLInputElement;
      const externalUrlIn = this.backdrop?.querySelector('#edit-external-url') as HTMLInputElement;

      if (!idIn || !idIn.value.trim()) {
        this.showToast('Please specify an Identifier (e.g. CLB-01, LNCH-01, or DOC-01)', true);
        idIn?.focus();
        return;
      }

      if (!titleIn || !titleIn.value.trim()) {
        this.showToast('Please specify a Title', true);
        titleIn?.focus();
        return;
      }

      const savePayload: Partial<Project> = {
        id: this.editingProject?.id,
        category,
        projectId: idIn.value.trim().toUpperCase(),
        title: titleIn.value.trim(),
        status: (statusSel?.value as LaunchStatus) || 'In Dev',
        shortDesc: shortDescIn?.value.trim() || '',
        readme: readmeIn?.value || '',
        clientName: clientNameIn?.value.trim() || '',
        clientRole: clientRoleIn?.value.trim() || '',
        clientPeriod: clientPeriodIn?.value.trim() || '',
        docType: docTypeIn?.value.trim() || (category === 'doc' ? 'Research Paper' : ''),
        docReadingTime: docReadingTimeIn?.value.trim() || '',
        docDate: docDateIn?.value.trim() || '',
        docContext: docContextIn?.value.trim() || '',
        externalUrl: externalUrlIn?.value.trim() || '',
        githubUrl: githubIn?.value.trim() || '',
        liveUrl: liveIn?.value.trim() || '',
        order: parseInt(orderIn?.value || '1', 10) || 1,
        tags: this.editingProject?.tags || ['SYSTEMS'],
        published: published,
        isRestricted: isRestricted,
        isClassified: isClassified,
        authorEmail: this.adminEmail,
        icon: this.editingProject?.icon?.data ? { ...this.editingProject.icon } : undefined,
      };

      try {
        const btnSave = this.backdrop?.querySelector('#btn-save-publish') as HTMLButtonElement;
        const btnDraft = this.backdrop?.querySelector('#btn-save-draft') as HTMLButtonElement;
        if (btnSave) btnSave.disabled = true;
        if (btnDraft) btnDraft.disabled = true;

        await saveProject(savePayload, this.adminEmail);
        let toastMsg = published ? 'ENTRY PUBLISHED LIVE // FIRESTORE SYNCED' : 'DRAFT SAVED // PRIVATE';
        if (isClassified) {
          toastMsg = 'CLASSIFIED DIRECTIVE SAVED // ADMIN ONLY';
        } else if (isRestricted) {
          toastMsg = 'RESTRICTED DIRECTIVE SAVED // PUBLIC DETAILS REDACTED';
        }
        this.showToast(toastMsg);

        if (this.onProjectUpdated) this.onProjectUpdated();

        // Switch to list view
        setTimeout(() => {
          this.currentView = 'list';
          this.render();
        }, 500);
      } catch (err: any) {
        console.error('Save error:', err);
        this.showToast(`Failed to save to Firestore: ${err?.message || 'Permission denied'}`, true);
      }
    };

    const savePublishBtn = this.backdrop.querySelector('#btn-save-publish');
    if (savePublishBtn) {
      savePublishBtn.addEventListener('click', () => handleSave(true));
    }

    const saveDraftBtn = this.backdrop.querySelector('#btn-save-draft');
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', () => handleSave(false));
    }
  }

  private setIconData(dataUrl: string, filename?: string) {
    if (!this.editingProject) this.editingProject = {};
    if (!this.editingProject.icon) {
      this.editingProject.icon = {
        data: dataUrl,
        shape: 'squircle',
        size: 'md',
        fit: 'cover',
      };
    } else {
      this.editingProject.icon.data = dataUrl;
    }

    const filenameLabel = this.backdrop?.querySelector('#icon-filename-label') as HTMLElement | null;
    if (filenameLabel) {
      filenameLabel.textContent = filename ? `✓ ${filename} (Ready)` : '✓ Custom icon attached';
      filenameLabel.style.color = '#10B981';
    }

    this.updateLiveIconPreview();

    const removeBtn = this.backdrop?.querySelector('#btn-remove-icon');
    if (!removeBtn) {
      this.render();
    }
  }

  private updateLiveIconPreview() {
    const target = this.backdrop?.querySelector('#live-icon-render-target');
    if (!target) return;

    const titleInput = this.backdrop?.querySelector('#edit-title') as HTMLInputElement;
    const projIdInput = this.backdrop?.querySelector('#edit-project-id') as HTMLInputElement;

    const title = titleInput?.value || this.editingProject?.title || 'Entry';
    const id = projIdInput?.value || this.editingProject?.projectId || 'ITEM-01';

    target.innerHTML = renderLaunchIconMarkup(
      this.editingProject?.icon,
      title,
      id,
      'pd-preview-glow'
    );
  }

  private refreshTagsUI() {
    const container = this.backdrop?.querySelector('#active-tags-container');
    if (!container) return;
    const tags = this.editingProject?.tags || [];
    container.innerHTML = tags.map((t) => `
      <span class="pd-chip-removable" data-tag="${escapeHtml(t)}">
        <span>${escapeHtml(t)}</span>
        <button type="button" class="remove-tag-btn" data-tag="${escapeHtml(t)}" aria-label="Remove tag">&times;</button>
      </span>
    `).join('');

    container.querySelectorAll('.remove-tag-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tag = (e.currentTarget as HTMLElement).dataset.tag;
        if (tag && this.editingProject) {
          this.editingProject.tags = (this.editingProject.tags || []).filter(t => t !== tag);
          this.refreshTagsUI();
        }
      });
    });
  }

  private showGitHubStyleDeleteModal(project: { id?: string; title?: string; projectId?: string }) {
    if (!project.id) return;
    const titleToMatch = (project.title || '').trim();

    // Remove existing if any
    const existing = document.getElementById('pd-delete-confirm-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'pd-delete-confirm-overlay';
    overlay.className = 'pd-delete-modal-backdrop';
    overlay.innerHTML = `
      <div class="pd-delete-modal-panel" role="dialog" aria-modal="true">
        <div class="pd-delete-modal-header">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="pd-delete-warning-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3 class="pd-delete-modal-title">DELETE DIRECTIVE // PERMANENT ACTION</h3>
              <p class="pd-delete-modal-subtitle">GitHub-style verification required</p>
            </div>
          </div>
          <button class="pd-close-btn" id="pd-close-delete-dialog-btn" type="button" aria-label="Cancel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="pd-delete-modal-body">
          <div class="pd-delete-warning-callout">
            <span class="pd-delete-warning-badge">UNRECOVERABLE DIRECTIVE DELETION</span>
            <p style="margin: 6px 0 0; font-size: 13px; line-height: 1.5; color: #FCA5A5;">
              This will permanently delete <strong style="color: #FFF; font-family: var(--font-mono);">${escapeHtml(project.title || 'Untitled')}</strong> (${escapeHtml(project.projectId || '')}) and remove all architecture specifications, tags, emblems, and database entries.
            </p>
          </div>

          <p style="font-size: 13px; color: var(--text-secondary); margin: 16px 0 8px;">
            To confirm deletion, please type <strong class="pd-delete-match-code">${escapeHtml(titleToMatch)}</strong> in the box below:
          </p>

          <input
            type="text"
            id="pd-delete-match-input"
            class="pd-input pd-delete-input"
            placeholder="Type ${escapeHtml(titleToMatch)} here..."
            autocomplete="off"
            spellcheck="false"
          />
        </div>

        <div class="pd-delete-modal-footer">
          <button type="button" class="pd-btn pd-btn-ghost" id="pd-abort-delete-btn">CANCEL</button>
          <button
            type="button"
            class="pd-btn pd-btn-danger pd-btn-delete-confirm"
            id="pd-execute-delete-btn"
            disabled
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>I UNDERSTAND, PERMANENTLY DELETE</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#pd-delete-match-input') as HTMLInputElement;
    const confirmBtn = overlay.querySelector('#pd-execute-delete-btn') as HTMLButtonElement;
    const cancelBtn = overlay.querySelector('#pd-abort-delete-btn') as HTMLButtonElement;
    const closeBtn = overlay.querySelector('#pd-close-delete-dialog-btn') as HTMLButtonElement;

    const closeOverlay = () => {
      overlay.remove();
    };

    closeBtn?.addEventListener('click', closeOverlay);
    cancelBtn?.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });

    const checkMatch = () => {
      const typed = (input.value || '').trim();
      const matches = typed.toLowerCase() === titleToMatch.toLowerCase();
      confirmBtn.disabled = !matches;
      if (matches) {
        confirmBtn.classList.add('pd-btn-delete-unlocked');
      } else {
        confirmBtn.classList.remove('pd-btn-delete-unlocked');
      }
      return matches;
    };

    input?.addEventListener('input', checkMatch);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && checkMatch()) {
        e.preventDefault();
        runDelete();
      } else if (e.key === 'Escape') {
        closeOverlay();
      }
    });

    const runDelete = async () => {
      if (!checkMatch()) return;
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<span>DELETING FROM FIRESTORE...</span>`;
      try {
        await deleteProject(project.id!);
        closeOverlay();
        this.showToast(`DIRECTIVE "${project.title}" PERMANENTLY DELETED`);
        if (this.currentView === 'edit') {
          this.currentView = 'list';
          this.editingProject = null;
        }
        if (this.onProjectUpdated) {
          this.onProjectUpdated();
        } else {
          this.render();
        }
      } catch (err: any) {
        console.error('Delete failed:', err);
        this.showToast(`DELETE FAILED: ${err?.message || 'Permission denied'}`, true);
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<span>RETRY DELETION</span>`;
      }
    };

    confirmBtn?.addEventListener('click', runDelete);

    setTimeout(() => input?.focus(), 60);
  }

  private showToast(message: string, isError: boolean = false) {
    const toast = document.createElement('div');
    toast.className = 'pd-admin-floating-toast';
    toast.textContent = message;
    if (isError) toast.style.color = '#EF4444';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}
