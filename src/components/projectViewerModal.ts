import { Project } from '../types';
import { renderMarkdown } from './markdownRenderer';
import { getStatusConfig, getCategoryConfig, renderLaunchIconMarkup, escapeHtml } from '../launchUtils';
import { auth, googleProvider, isUserAdmin } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

export function openProjectModal(
  project: Project,
  isAdmin: boolean,
  onEditRequest?: (project: Project) => void
) {
  // Remove any existing viewer modal
  const existing = document.getElementById('project-viewer-modal-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'project-viewer-modal-backdrop';
  backdrop.className = 'pd-modal-backdrop';

  const category = project.category || 'launch';
  const catCfg = getCategoryConfig(category);
  const statusCfg = getStatusConfig(project.status);
  const isRestricted = Boolean(project.isRestricted ?? project.restricted ?? false);
  const isClassified = Boolean(project.isClassified ?? project.classified ?? false);

  // If RESTRICTED and viewer is NOT ADMIN: render restricted clearance view
  if (isRestricted && !isAdmin) {
    backdrop.innerHTML = `
      <div class="pd-modal-panel pd-viewer-panel pd-restricted-panel" role="dialog" aria-modal="true">
        <!-- Modal Header -->
        <div class="pd-modal-header" style="border-bottom-color: rgba(245, 158, 11, 0.3);">
          <div style="display: flex; align-items: center; gap: 14px;">
            ${renderLaunchIconMarkup(project.icon, project.title, project.projectId, 'pd-viewer-header-icon', 'md')}

            <div class="pd-modal-title-group">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="pd-id-badge">${escapeHtml(project.projectId)}</span>
                <span class="pd-category-pill" style="background:${catCfg.bg}; color:${catCfg.color}; border-color:${catCfg.border};">
                  ${catCfg.iconSvg}
                  <span>${escapeHtml(catCfg.shortLabel)}</span>
                </span>
                <span class="pd-restricted-badge">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span>RESTRICTED ACCESS</span>
                </span>
              </div>
              <h2 class="pd-viewer-title">${escapeHtml(project.title)}</h2>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="pd-close-btn" id="modal-close-btn" aria-label="Close modal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Restricted Clearance Warning Banner -->
        <div class="pd-restricted-banner">
          <div class="pd-restricted-lock-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: #F59E0B; letter-spacing: 0.08em;">
                // CLEARANCE STATUS: RESTRICTED ACCESS (LEVEL 4)
              </span>
            </div>
            <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
              This directive's architectural specifications, source code, and empirical documentation are restricted to authorized lab personnel. Public visitors can verify this project's record, but detailed specifications remain redacted.
            </p>
          </div>
        </div>

        <!-- High-level Public Meta (Safe Info) -->
        <div class="pd-viewer-toolbar" style="margin-top: 0;">
          <div class="pd-tags-row">
            ${project.tags.map(t => `<span class="pd-tech-chip">${escapeHtml(t)}</span>`).join('')}
          </div>
          ${project.clientName ? `
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
              ENTITY: <strong style="color: var(--text-primary);">${escapeHtml(project.clientName)}</strong>
              ${project.clientPeriod ? ` (${escapeHtml(project.clientPeriod)})` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Redacted Specification Readout -->
        <div class="pd-restricted-content-box">
          <div class="pd-redacted-stamp">RESTRICTED // REDACTED</div>
          
          <div style="margin-bottom: 16px;">
            <span style="font-family: var(--font-mono); font-size: 10px; color: #F59E0B; letter-spacing: 0.08em;">
              // PUBLIC DISCLOSURE SUMMARY:
            </span>
            <p style="font-size: 14px; color: var(--text-primary); margin: 6px 0 0; line-height: 1.6;">
              ${escapeHtml(project.shortDesc || 'Proprietary engineering specification registered in Ponnusamy Dynamics showcase.')}
            </p>
          </div>

          <!-- Blurred / Simulated Redacted Document Content -->
          <div class="pd-redacted-blur-block" aria-hidden="true">
            <h3 style="font-family: var(--font-mono); font-size: 16px; margin: 0 0 10px;">## SPECIFICATION BLUEPRINT &amp; SOURCE ARTIFACTS</h3>
            <p style="line-height: 1.7; font-family: var(--font-mono); font-size: 12px;">
              [REDACTED_MEMORY_MAP_0x7FFF8000] System initialization executes microkernel thread bindings with zero-copy DMA buffers.
              All network telemetry frames pass through hardware NIC offload engines before reaching user-space consensus handlers.
            </p>
            <div style="background: rgba(255,255,255,0.04); padding: 12px; border-radius: 4px; font-family: monospace; font-size: 11px; line-height: 1.5; margin: 12px 0;">
              $ git clone https://github.com/ponnusamy-dynamics/classified-kernel.git<br>
              $ cargo build --release --target=x86_64-unknown-none<br>
              [AUTH_TOKEN_REQUIRED: 0x9482EF01A8...]
            </div>
            <p style="line-height: 1.7; font-family: var(--font-mono); font-size: 12px;">
              Benchmark telemetry registers 1,200,000 requests/sec with p99 latency &lt; 0.42ms across clustered physical nodes.
            </p>
          </div>

          <!-- Bottom Clearance Login Prompt -->
          <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
              Are you an authorized administrator? Sign in with your registered Google account to unlock full specification clearance.
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="pd-btn pd-btn-ghost pd-btn-sm" id="restricted-dismiss-btn">DISMISS</button>
              <button class="pd-btn pd-btn-primary pd-btn-sm" id="restricted-admin-login-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                <span>ADMIN CLEARANCE LOGIN</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    const close = () => {
      window.removeEventListener('keydown', keyHandler);
      backdrop.classList.add('pd-closing');
      setTimeout(() => {
        backdrop.remove();
        document.body.style.overflow = '';
      }, 200);
    };

    window.addEventListener('keydown', keyHandler);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    backdrop.querySelector('#modal-close-btn')?.addEventListener('click', close);
    backdrop.querySelector('#restricted-dismiss-btn')?.addEventListener('click', close);

    backdrop.querySelector('#restricted-admin-login-btn')?.addEventListener('click', async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user && isUserAdmin(result.user.email)) {
          close();
          // Re-open with admin clearance granted
          openProjectModal(project, true, onEditRequest);
        } else {
          alert('Signed-in account is not authorized as Lab Administrator.');
        }
      } catch (err) {
        console.warn('Sign-in cancelled or failed:', err);
      }
    });

    return;
  }

  // STANDARD & ADMIN-UNLOCKED VIEW: Full documentation and specs
  const renderedHtml = renderMarkdown(project.readme || `# ${project.title}\n\n${project.shortDesc}`);

  // Category-specific header badges & info bars
  let headerBadgesHtml = '';
  let contextualSubbarHtml = '';

  if (category === 'collaboration') {
    headerBadgesHtml = `
      <span class="pd-id-badge">${escapeHtml(project.projectId)}</span>
      <span class="pd-category-pill" style="background:${catCfg.bg}; color:${catCfg.color}; border-color:${catCfg.border};">
        ${catCfg.iconSvg}
        <span>${escapeHtml(catCfg.shortLabel)}</span>
      </span>
      ${project.clientName ? `
        <span class="pd-client-ref-pill">
          <span style="opacity:0.6;">CLIENT / CLUB:</span>
          <strong>${escapeHtml(project.clientName)}</strong>
        </span>
      ` : ''}
      ${!project.published ? '<span class="pd-draft-badge">[DRAFT // HIDDEN FROM PUBLIC]</span>' : ''}
      ${isRestricted ? '<span class="pd-restricted-badge">RESTRICTED // UNLOCKED</span>' : ''}
      ${isClassified ? '<span class="pd-classified-badge">TOP SECRET // CLASSIFIED</span>' : ''}
    `;

    if (project.clientName || project.clientRole || project.clientPeriod) {
      contextualSubbarHtml = `
        <div class="pd-context-infobar">
          <div class="pd-context-infobar-grid">
            ${project.clientName ? `
              <div class="pd-context-cell">
                <span class="pd-context-label">// CLIENT / ORGANIZATION</span>
                <span class="pd-context-val">${escapeHtml(project.clientName)}</span>
              </div>
            ` : ''}
            ${project.clientRole ? `
              <div class="pd-context-cell">
                <span class="pd-context-label">// CONTRIBUTION / ROLE</span>
                <span class="pd-context-val">${escapeHtml(project.clientRole)}</span>
              </div>
            ` : ''}
            ${project.clientPeriod ? `
              <div class="pd-context-cell">
                <span class="pd-context-label">// ENGAGEMENT PERIOD</span>
                <span class="pd-context-val">${escapeHtml(project.clientPeriod)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }
  } else if (category === 'doc') {
    const docTypeLabel = project.docType || 'Technical Doc';
    headerBadgesHtml = `
      <span class="pd-id-badge">${escapeHtml(project.projectId)}</span>
      <span class="pd-category-pill" style="background:${catCfg.bg}; color:${catCfg.color}; border-color:${catCfg.border};">
        ${catCfg.iconSvg}
        <span>${escapeHtml(docTypeLabel.toUpperCase())}</span>
      </span>
      ${project.docReadingTime ? `
        <span class="pd-doc-meta-pill">
          ⏱ ${escapeHtml(project.docReadingTime)}
        </span>
      ` : ''}
      ${project.docDate ? `
        <span class="pd-doc-meta-pill">
          📅 ${escapeHtml(project.docDate)}
        </span>
      ` : ''}
      ${!project.published ? '<span class="pd-draft-badge">[DRAFT // HIDDEN FROM PUBLIC]</span>' : ''}
      ${isRestricted ? '<span class="pd-restricted-badge">RESTRICTED // UNLOCKED</span>' : ''}
      ${isClassified ? '<span class="pd-classified-badge">TOP SECRET // CLASSIFIED</span>' : ''}
    `;

    if (project.docContext) {
      contextualSubbarHtml = `
        <div class="pd-context-infobar pd-doc-context-bar">
          <div class="pd-doc-context-header">
            <span style="font-family: var(--font-mono); font-size: 10px; color: #FB7185; letter-spacing: 0.08em;">// RESEARCH DOMAIN &amp; CONTEXT DETAILS</span>
          </div>
          <p class="pd-doc-context-text">${escapeHtml(project.docContext)}</p>
        </div>
      `;
    }
  } else {
    // Default Launch
    headerBadgesHtml = `
      <span class="pd-id-badge">${escapeHtml(project.projectId)}</span>
      <span class="pd-status-pill" style="background:${statusCfg.bg}; color:${statusCfg.text}; border-color:${statusCfg.border};">
        <span class="status-indicator-dot" style="width:5px; height:5px; background:${statusCfg.badgeDot}; display:inline-block; vertical-align:middle; margin-right:4px;"></span>
        ${escapeHtml(statusCfg.label)}
      </span>
      ${!project.published ? '<span class="pd-draft-badge">[DRAFT // HIDDEN FROM PUBLIC]</span>' : ''}
      ${isRestricted ? '<span class="pd-restricted-badge">RESTRICTED // UNLOCKED</span>' : ''}
      ${isClassified ? '<span class="pd-classified-badge">TOP SECRET // CLASSIFIED</span>' : ''}
    `;
  }

  // Admin clearance banners if applicable
  let clearanceStatusBanner = '';
  if (isAdmin && isRestricted) {
    clearanceStatusBanner = `
      <div class="pd-clearance-granted-banner">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>RESTRICTED DIRECTIVE // LEVEL 4 CLEARANCE VERIFIED (ADMIN FULL SPECIFICATION UNLOCKED)</span>
      </div>
    `;
  } else if (isAdmin && isClassified) {
    clearanceStatusBanner = `
      <div class="pd-clearance-granted-banner" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.35); color: #EF4444;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        <span>CLASSIFIED DIRECTIVE // INVISIBLE TO PUBLIC WEBSITE (TOP SECRET ADMIN CLEARANCE)</span>
      </div>
    `;
  }

  backdrop.innerHTML = `
    <div class="pd-modal-panel pd-viewer-panel ${isRestricted ? 'pd-card-restricted' : ''} ${isClassified ? 'pd-card-classified' : ''}" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="pd-modal-header">
        <div style="display: flex; align-items: center; gap: 14px;">
          ${renderLaunchIconMarkup(project.icon, project.title, project.projectId, 'pd-viewer-header-icon', 'md')}

          <div class="pd-modal-title-group">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${headerBadgesHtml}
            </div>
            <h2 class="pd-viewer-title">${escapeHtml(project.title)}</h2>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          ${isAdmin ? `
            <button class="pd-btn pd-btn-secondary pd-btn-sm" id="modal-admin-edit-btn" title="Edit in Admin Console">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>EDIT</span>
            </button>
          ` : ''}
          <button class="pd-close-btn" id="modal-close-btn" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Admin Clearance Status Banner if restricted or classified -->
      ${clearanceStatusBanner}

      <!-- Optional Contextual Info Bar (Client / Research context) -->
      ${contextualSubbarHtml}

      <!-- Quick Action / Meta Toolbar -->
      <div class="pd-viewer-toolbar">
        <div class="pd-tags-row">
          ${project.tags.map(t => `<span class="pd-tech-chip">${escapeHtml(t)}</span>`).join('')}
        </div>

        <div class="pd-links-row">
          ${project.externalUrl ? `
            <a href="${escapeHtml(project.externalUrl)}" target="_blank" rel="noopener noreferrer" class="pd-btn pd-btn-primary pd-btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>READ PAPER / PUBLICATION</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          ` : ''}

          ${project.githubUrl ? `
            <a href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noopener noreferrer" class="pd-btn pd-btn-secondary pd-btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              <span>REPOSITORY</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          ` : ''}

          ${project.liveUrl ? `
            <a href="${escapeHtml(project.liveUrl)}" target="_blank" rel="noopener noreferrer" class="pd-btn pd-btn-primary pd-btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"/></svg>
              <span>${category === 'collaboration' ? 'CLIENT SYSTEM' : 'LIVE SYSTEM'}</span>
            </a>
          ` : ''}

          ${project.githubUrl ? `
            <button class="pd-btn pd-btn-ghost pd-btn-sm" id="modal-clone-btn" data-url="${escapeHtml(project.githubUrl)}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span id="clone-btn-text">COPY CLONE</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- GitHub README / Document Container -->
      <div class="pd-readme-wrapper">
        <div class="pd-readme-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span style="font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;">
              ${category === 'doc' ? 'DOCUMENT SPECIFICATION // READOUT' : (category === 'collaboration' ? 'COLLABORATION SPECIFICATION // README.md' : 'LAUNCH SPECIFICATION // README.md')}
            </span>
          </div>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);">RENDERED SPECIFICATION</span>
        </div>

        <div class="pd-markdown-body" id="pd-rendered-readme">
          ${renderedHtml}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';

  // Events
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
    }
  };

  const close = () => {
    window.removeEventListener('keydown', keyHandler);
    backdrop.classList.add('pd-closing');
    setTimeout(() => {
      backdrop.remove();
      document.body.style.overflow = '';
    }, 200);
  };

  window.addEventListener('keydown', keyHandler);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  const closeBtn = backdrop.querySelector('#modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', close);

  const editBtn = backdrop.querySelector('#modal-admin-edit-btn');
  if (editBtn && onEditRequest) {
    editBtn.addEventListener('click', () => {
      close();
      onEditRequest(project);
    });
  }

  const cloneBtn = backdrop.querySelector('#modal-clone-btn') as HTMLButtonElement;
  if (cloneBtn) {
    cloneBtn.addEventListener('click', () => {
      const url = cloneBtn.dataset.url || '';
      const cloneCmd = `git clone ${url}`;
      navigator.clipboard.writeText(cloneCmd).then(() => {
        const text = backdrop.querySelector('#clone-btn-text');
        if (text) text.textContent = 'COPIED!';
        setTimeout(() => {
          if (text) text.textContent = 'COPY CLONE';
        }, 2000);
      });
    });
  }
}
