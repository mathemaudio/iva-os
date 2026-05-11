import { LitElement, css, html, type PropertyValues, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import type { PlatformContract } from '../platform/PlatformContract.lll'
import { EmojiIconRenderer } from '../EmojiIconRenderer.lll'

@Spec('Renders the browser-hosted Activity Monitor with running apps, signal history, and runtime stats tabs.')
@customElement('iva-activity-monitor-view')
export class ActivityMonitorView extends LitElement {
	static styles = [
		EmojiIconRenderer.styles,
		css`
		:host {
			display: block;
			height: 100%;
			min-height: 0;
			color: inherit;
		}

		.activity-monitor {
			display: grid;
			grid-template-rows: auto auto auto 1fr;
			gap: calc(12px * var(--shell-density-scale, 1));
			height: 100%;
			min-height: 0;
			padding: calc(16px * var(--shell-density-scale, 1));
			background: linear-gradient(180deg, rgba(12, 17, 28, 0.92) 0%, rgba(9, 13, 21, 0.98) 100%);
		}

		:host-context(.shell[data-theme='light']) .activity-monitor {
			background: linear-gradient(180deg, rgba(249, 251, 255, 0.98) 0%, rgba(236, 241, 248, 0.98) 100%);
		}

		.hero,
		.summary-strip,
		.panel,
		.empty-state,
		.card,
		.event-row,
		.metric-card {
			border-radius: calc(12px * var(--shell-density-scale, 1));
			border: 1px solid rgba(255, 255, 255, 0.08);
			background: color-mix(in srgb, var(--shell-control, rgba(255, 255, 255, 0.08)) 88%, transparent);
		}

		.hero {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			gap: calc(14px * var(--shell-density-scale, 1));
			padding: calc(14px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1));
		}

		.hero-copy,
		.panel,
		.tab-strip,
		.card,
		.card-copy,
		.event-copy,
		.metric-card,
		.summary-stat {
			display: grid;
			gap: calc(6px * var(--shell-density-scale, 1));
		}

		.hero-title-row,
		.panel-title-row,
		.app-row,
		.event-header,
		.metric-value-row,
		.summary-strip {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: calc(12px * var(--shell-density-scale, 1));
		}

		.summary-strip {
			padding: calc(10px * var(--shell-density-scale, 1)) calc(14px * var(--shell-density-scale, 1));
			flex-wrap: wrap;
		}

		.summary-stat {
			min-width: calc(120px * var(--shell-density-scale, 1));
		}

		.summary-label,
		.hero-note,
		.event-detail,
		.metric-note,
		.app-meta,
		.panel-note {
			color: var(--shell-muted-text, rgba(226, 232, 240, 0.82));
		}

		.summary-value {
			font-size: calc(15px * var(--shell-density-scale, 1));
			font-weight: 700;
		}

		.tab-strip {
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
			padding: calc(4px * var(--shell-density-scale, 1));
			background: color-mix(in srgb, var(--shell-control, rgba(255, 255, 255, 0.08)) 72%, transparent);
			border-radius: calc(12px * var(--shell-density-scale, 1));
			border: 1px solid rgba(255, 255, 255, 0.08);
		}

		.tab-button {
			font: inherit;
			color: inherit;
			padding: calc(10px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			border-radius: calc(9px * var(--shell-density-scale, 1));
			border: 1px solid transparent;
			background: transparent;
			cursor: pointer;
		}

		.tab-button[data-active='true'] {
			background: linear-gradient(180deg, rgba(108, 149, 255, 0.26) 0%, rgba(76, 120, 224, 0.3) 100%);
			border-color: rgba(132, 169, 255, 0.34);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
		}

		.panel {
			padding: calc(14px * var(--shell-density-scale, 1));
			overflow: auto;
			min-height: 0;
		}

		.card-list,
		.event-list,
		.metric-grid {
			display: grid;
			gap: calc(10px * var(--shell-density-scale, 1));
		}

		.metric-grid {
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		}

		.card,
		.event-row,
		.metric-card,
		.empty-state {
			padding: calc(12px * var(--shell-density-scale, 1));
		}

		.app-title-row,
		.event-badges {
			display: flex;
			align-items: center;
			gap: calc(8px * var(--shell-density-scale, 1));
			flex-wrap: wrap;
		}

		.badge {
			display: inline-flex;
			align-items: center;
			gap: calc(6px * var(--shell-density-scale, 1));
			padding: calc(4px * var(--shell-density-scale, 1)) calc(8px * var(--shell-density-scale, 1));
			border-radius: 999px;
			font-size: 0.76rem;
			background: rgba(255, 255, 255, 0.08);
			border: 1px solid rgba(255, 255, 255, 0.12);
		}

		.badge[data-kind='focused'] {
			background: rgba(52, 187, 101, 0.18);
			border-color: rgba(88, 217, 133, 0.28);
		}

		.badge[data-kind='minimized'] {
			background: rgba(230, 176, 76, 0.18);
			border-color: rgba(248, 198, 97, 0.3);
		}

		.badge[data-kind='incoming'] {
			background: rgba(70, 137, 246, 0.18);
			border-color: rgba(102, 163, 255, 0.3);
		}

		.badge[data-kind='outgoing'] {
			background: rgba(165, 104, 244, 0.18);
			border-color: rgba(191, 138, 255, 0.28);
		}

		.badge[data-kind='internal'] {
			background: rgba(132, 145, 168, 0.18);
			border-color: rgba(181, 193, 216, 0.28);
		}

		.metric-value {
			font-size: 1.08rem;
			font-weight: 700;
		}

		.card-runtime {
			text-align: right;
		}

		strong,
		span,
		p,
		h2 {
			margin: 0;
		}
	`
	]

	@property({ attribute: false })
	platformContext: PlatformContract['ApplicationContext'] | null = null

	@state()
	private runtimeSnapshot: PlatformContract['RuntimeSnapshot'] | null = null

	@state()
	private selectedTab: 'running-apps' | 'signals-events' | 'runtime-stats' = 'running-apps'

	private unsubscribe: (() => void) | null = null
	private attachedRuntimeService: PlatformContract['RuntimeService'] | null = null
	private refreshTimerHandle: number | null = null

	@Spec('Attaches to the app-facing runtime service and starts lightweight refresh work when the monitor enters the DOM.')
	connectedCallback(): void {
		super.connectedCallback()
		this.attachToRuntimeService()
		this.startRefreshTimer()
	}

	@Spec('Releases runtime subscriptions and polling work when the monitor leaves the DOM.')
	disconnectedCallback(): void {
		if (this.unsubscribe !== null) {
			this.unsubscribe()
			this.unsubscribe = null
		}
		this.stopRefreshTimer()
		this.attachedRuntimeService = null
		super.disconnectedCallback()
	}

	@Spec('Reattaches to the current runtime service whenever the injected platform context changes.')
	updated(changedProperties: PropertyValues<this>): void {
		if (changedProperties.has('platformContext')) {
			this.attachToRuntimeService()
		}
	}

	@Spec('Renders the full activity monitor shell with tab navigation and the active monitor panel.')
	render(): TemplateResult {
		if (this.runtimeSnapshot === null) {
			return html`<div class="empty-state">Preparing activity snapshot…</div>`
		}
		const stats = this.runtimeSnapshot.stats
		return html`
			<div class="activity-monitor" data-testid="activity-monitor-view">
				<header class="hero">
					<div class="hero-copy">
						<div class="hero-title-row">
							<strong>Activity Monitor</strong>
							<span class="badge">Live</span>
						</div>
						<span class="hero-note">Review running apps, recent runtime events, and browser-visible memory usage in a desktop-style monitor.</span>
					</div>
					<div class="card-runtime">
						<strong>${String(this.runtimeSnapshot.runningApps.length)} apps</strong>
						<span class="app-meta">Running now</span>
					</div>
				</header>
				<div class="summary-strip">
					<div class="summary-stat">
						<span class="summary-label">Windows</span>
						<span class="summary-value">${String(stats.windowCount)}</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Visible</span>
						<span class="summary-value">${String(stats.visibleWindowCount)}</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Memory</span>
						<span class="summary-value">${this.formatBytes(stats.memoryUsedBytes)}</span>
					</div>
					<div class="summary-stat">
						<span class="summary-label">Session</span>
						<span class="summary-value">${this.formatDuration(stats.uptimeMs)}</span>
					</div>
				</div>
				<nav class="tab-strip" data-testid="activity-monitor-tabs">
					<button class="tab-button" data-testid="activity-monitor-tab-running-apps" data-active=${String(this.selectedTab === 'running-apps')} @click=${() => this.selectTab('running-apps')}>Processes</button>
					<button class="tab-button" data-testid="activity-monitor-tab-signals-events" data-active=${String(this.selectedTab === 'signals-events')} @click=${() => this.selectTab('signals-events')}>Signals & Events</button>
					<button class="tab-button" data-testid="activity-monitor-tab-runtime-stats" data-active=${String(this.selectedTab === 'runtime-stats')} @click=${() => this.selectTab('runtime-stats')}>Runtime Stats</button>
				</nav>
				${this.renderSelectedPanel()}
			</div>
		`
	}

	@Spec('Renders whichever monitor panel corresponds to the currently selected tab.')
	private renderSelectedPanel(): TemplateResult {
		if (this.selectedTab === 'running-apps') {
			return this.renderRunningAppsPanel()
		}
		if (this.selectedTab === 'signals-events') {
			return this.renderSignalsPanel()
		}
		return this.renderRuntimeStatsPanel()
	}

	@Spec('Renders the running-apps panel with one card per open app window and its current runtime duration.')
	private renderRunningAppsPanel(): TemplateResult {
		if (this.runtimeSnapshot === null) {
			return html``
		}
		return html`
			<section class="panel" data-testid="activity-monitor-running-apps-panel">
				<div class="panel-title-row">
					<strong>Running apps</strong>
					<span class="panel-note">Focused and minimized states update live.</span>
				</div>
				${this.runtimeSnapshot.runningApps.length === 0
					? html`<div class="empty-state" data-testid="activity-monitor-empty-running-apps">No app windows are running right now.</div>`
					: html`
						<div class="card-list">
							${this.runtimeSnapshot.runningApps.map(app => html`
								<article class="card" data-testid=${`activity-monitor-running-app-${String(app.windowId)}`}>
									<div class="app-row">
										<div class="card-copy">
											<div class="app-title-row">
												<strong>${EmojiIconRenderer.renderIcon(app.icon, `${app.appName} icon`)} ${app.appName}</strong>
												${app.isFocused ? html`<span class="badge" data-kind="focused">Focused</span>` : null}
												${app.isMinimized ? html`<span class="badge" data-kind="minimized">Minimized</span>` : null}
											</div>
											<span class="app-meta">${app.title}</span>
											<span class="app-meta">Started ${this.formatClock(app.startedAt)}</span>
										</div>
										<div class="card-copy card-runtime">
											<strong>${this.formatDuration(app.runningForMs)}</strong>
											<span class="app-meta">Runtime</span>
										</div>
									</div>
								</article>
							`)}
						</div>
					`}
			</section>
		`
	}

	@Spec('Renders the signals-and-events panel from the latest runtime event stream.')
	private renderSignalsPanel(): TemplateResult {
		if (this.runtimeSnapshot === null) {
			return html``
		}
		return html`
			<section class="panel" data-testid="activity-monitor-signals-events-panel">
				<div class="panel-title-row">
					<strong>Signals & events</strong>
					<span class="panel-note">Recent launcher, window, filesystem, and settings activity.</span>
				</div>
				${this.runtimeSnapshot.events.length === 0
					? html`<div class="empty-state" data-testid="activity-monitor-empty-events">No runtime signals have been recorded yet.</div>`
					: html`
						<div class="event-list">
							${this.runtimeSnapshot.events.map(event => html`
								<article class="event-row" data-testid=${`activity-monitor-event-${String(event.id)}`}>
									<div class="event-header">
										<div class="event-copy">
											<div class="event-badges">
												<span class="badge" data-kind=${event.direction}>${this.formatDirection(event.direction)}</span>
												<span class="badge">${event.category}</span>
											</div>
											<strong>${event.title}</strong>
											<span class="event-detail">${event.detail}</span>
										</div>
										<span class="app-meta">${this.formatClock(event.timestamp)}</span>
									</div>
								</article>
							`)}
						</div>
					`}
			</section>
		`
	}

	@Spec('Renders the runtime-stats panel without unsupported CPU or thread metrics.')
	private renderRuntimeStatsPanel(): TemplateResult {
		if (this.runtimeSnapshot === null) {
			return html``
		}
		const stats = this.runtimeSnapshot.stats
		return html`
			<section class="panel" data-testid="activity-monitor-runtime-stats-panel">
				<div class="panel-title-row">
					<strong>Runtime statistics</strong>
					<span class="panel-note">Browser-visible figures only.</span>
				</div>
				<div class="metric-grid">
					${this.renderMetricCard('activity-monitor-stat-session-uptime', 'Session uptime', this.formatDuration(stats.uptimeMs), 'How long this browser-hosted shell has been running.')}
					${this.renderMetricCard('activity-monitor-stat-memory', 'JS heap used', this.formatBytes(stats.memoryUsedBytes), 'Visible only when the browser exposes memory figures to JavaScript.')}
					${this.renderMetricCard('activity-monitor-stat-memory-limit', 'JS heap limit', this.formatBytes(stats.memoryLimitBytes), 'Helps estimate current memory headroom when supported by the browser.')}
					${this.renderMetricCard('activity-monitor-stat-window-count', 'Open windows', String(stats.windowCount), 'Counts all running app windows, including minimized ones.')}
					${this.renderMetricCard('activity-monitor-stat-visible-window-count', 'Visible windows', String(stats.visibleWindowCount), 'Shows how many app windows are currently not minimized.')}
					${this.renderMetricCard('activity-monitor-stat-minimized-window-count', 'Minimized windows', String(stats.minimizedWindowCount), 'Shows how many app windows are waiting in the dock.')}
					${this.renderMetricCard('activity-monitor-stat-vfs-nodes', 'VFS items', String(stats.vfsNodeCount), 'Counts folders and files in the shared virtual filesystem snapshot.')}
					${this.renderMetricCard('activity-monitor-stat-vfs-storage', 'VFS stored bytes', this.formatBytes(stats.vfsStoredBytes), 'Reflects the persisted payload size stored for virtual filesystem files.')}
					${this.renderMetricCard('activity-monitor-stat-local-storage', 'Local storage footprint', this.formatBytes(stats.localStorageBytes), 'Estimates the browser localStorage usage used by shell preferences and VFS state.')}
				</div>
			</section>
		`
	}

	@Spec('Renders one runtime metric card with its stable test identifier and explanatory note.')
	private renderMetricCard(testId: string, label: string, value: string, note: string): TemplateResult {
		return html`
			<article class="metric-card" data-testid=${testId}>
				<div class="metric-value-row">
					<strong>${label}</strong>
					<span class="metric-value">${value}</span>
				</div>
				<span class="metric-note">${note}</span>
			</article>
		`
	}

	@Spec('Attaches to the latest runtime service from the injected platform context and refreshes the visible monitor snapshot.')
	private attachToRuntimeService(): void {
		const runtimeService = this.platformContext?.runtime ?? null
		if (this.attachedRuntimeService === runtimeService) {
			this.refreshSnapshotFromRuntime()
			return
		}
		if (this.unsubscribe !== null) {
			this.unsubscribe()
			this.unsubscribe = null
		}
		this.attachedRuntimeService = runtimeService
		if (runtimeService === null) {
			this.runtimeSnapshot = null
			return
		}
		this.runtimeSnapshot = runtimeService.getSnapshot()
		this.unsubscribe = runtimeService.subscribe(snapshot => {
			this.runtimeSnapshot = snapshot
		})
	}

	@Spec('Refreshes the visible runtime snapshot from the attached runtime service for live memory and duration updates.')
	private refreshSnapshotFromRuntime(): void {
		if (this.attachedRuntimeService === null) {
			return
		}
		this.runtimeSnapshot = this.attachedRuntimeService.getSnapshot()
	}

	@Spec('Starts a lightweight one-second refresh timer so durations and memory values keep moving while the monitor stays open.')
	private startRefreshTimer(): void {
		if (this.refreshTimerHandle !== null) {
			return
		}
		this.refreshTimerHandle = window.setInterval(() => {
			this.refreshSnapshotFromRuntime()
		}, 1_000)
	}

	@Spec('Stops the lightweight runtime refresh timer when the monitor no longer needs live updates.')
	private stopRefreshTimer(): void {
		if (this.refreshTimerHandle === null) {
			return
		}
		window.clearInterval(this.refreshTimerHandle)
		this.refreshTimerHandle = null
	}

	@Spec('Selects one visible monitor tab.')
	private selectTab(tabId: 'running-apps' | 'signals-events' | 'runtime-stats'): void {
		this.selectedTab = tabId
	}

	@Spec('Formats one runtime duration into a compact hours-minutes-seconds label for monitor rows and stat cards.')
	private formatDuration(durationMs: number): string {
		const totalSeconds = Math.max(Math.floor(durationMs / 1_000), 0)
		const hours = Math.floor(totalSeconds / 3_600)
		const minutes = Math.floor((totalSeconds % 3_600) / 60)
		const seconds = totalSeconds % 60
		if (hours > 0) {
			return `${String(hours)}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
		}
		if (minutes > 0) {
			return `${String(minutes)}m ${String(seconds).padStart(2, '0')}s`
		}
		return `${String(seconds)}s`
	}

	@Spec('Formats one byte count into a compact browser-facing runtime label and falls back gracefully when that metric is unavailable.')
	private formatBytes(value: number | null): string {
		if (value === null) {
			return 'Unavailable'
		}
		if (value < 1_024) {
			return `${String(value)} B`
		}
		if (value < 1_048_576) {
			return `${(value / 1_024).toFixed(1)} KB`
		}
		return `${(value / 1_048_576).toFixed(1)} MB`
	}

	@Spec('Formats one ISO timestamp into a short clock label for the current locale.')
	private formatClock(isoTimestamp: string): string {
		return new Date(isoTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
	}

	@Spec('Formats one runtime event direction into a short visible badge label.')
	private formatDirection(direction: PlatformContract['RuntimeEvent']['direction']): string {
		if (direction === 'incoming') {
			return 'In'
		}
		if (direction === 'outgoing') {
			return 'Out'
		}
		return 'Internal'
	}
}
