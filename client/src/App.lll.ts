import { LitElement, css, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'

@Spec('Composes the browser-hosted operating shell with desktop, launcher, dock, windows, and persisted preferences.')
@customElement('app-root')
export class App extends LitElement {
	private static readonly preferencesStorageKey = 'web-os-shell-preferences'

	private readonly availableApps: Array<{
		id: string
		name: string
		icon: string
		description: string
		isPinnedToDock: boolean
	}> = [
		{ id: 'file-manager', name: 'File Manager', icon: '🗂️', description: 'Browse files soon.', isPinnedToDock: true },
		{ id: 'text-editor', name: 'Text Editor', icon: '📝', description: 'Edit text files soon.', isPinnedToDock: true },
		{ id: 'image-viewer', name: 'Image Viewer', icon: '🖼️', description: 'View images soon.', isPinnedToDock: false },
		{ id: 'settings', name: 'Settings', icon: '⚙️', description: 'Adjust shell preferences.', isPinnedToDock: true },
		{ id: 'app-studio', name: 'App Studio', icon: '🧪', description: 'Build apps soon.', isPinnedToDock: false }
	]

	static styles = css`
		:host {
			display: block;
			height: 100vh;
			margin: 0;
			color: rgb(241, 245, 249);
			font-family: 'Manrope', 'Segoe UI', system-ui, -apple-system, sans-serif;
		}

		* {
			box-sizing: border-box;
		}

		button,
		select {
			font: inherit;
		}

		.shell {
			height: 100%;
			display: grid;
			grid-template-rows: auto 1fr auto;
			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
		}

		.shell[data-theme='midnight'] {
			background-image:
				linear-gradient(180deg, rgba(8, 15, 33, 0.42), rgba(7, 10, 20, 0.72)),
				linear-gradient(135deg, rgb(32, 78, 151), rgb(15, 23, 42) 55%, rgb(56, 189, 248));
		}

		.shell[data-theme='sunset'] {
			background-image:
				linear-gradient(180deg, rgba(67, 20, 7, 0.2), rgba(33, 11, 28, 0.55)),
				linear-gradient(135deg, rgb(249, 115, 22), rgb(236, 72, 153) 52%, rgb(99, 102, 241));
		}

		.shell[data-wallpaper='aurora'] {
			background-blend-mode: overlay, normal;
		}

		.shell[data-wallpaper='dunes'] {
			background-image:
				linear-gradient(180deg, rgba(41, 24, 12, 0.2), rgba(19, 14, 26, 0.62)),
				linear-gradient(160deg, rgb(245, 158, 11), rgb(234, 88, 12) 48%, rgb(120, 53, 15));
		}

		.shell[data-wallpaper='grid'] {
			background-image:
				linear-gradient(180deg, rgba(4, 13, 24, 0.3), rgba(3, 7, 18, 0.74)),
				radial-gradient(circle at top left, rgba(34, 197, 94, 0.28), transparent 35%),
				linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
				linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
				linear-gradient(135deg, rgb(15, 23, 42), rgb(17, 94, 89));
			background-size: auto, auto, 32px 32px, 32px 32px, auto;
		}

		.top-bar {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 16px;
			padding: 12px 18px;
			background: rgba(15, 23, 42, 0.48);
			backdrop-filter: blur(18px);
			border-bottom: 1px solid rgba(255, 255, 255, 0.14);
		}

		.brand {
			display: grid;
			gap: 2px;
		}

		.brand strong {
			font-size: 0.95rem;
			letter-spacing: 0.02em;
		}

		.brand span,
		.top-bar-clock {
			font-size: 0.8rem;
			color: rgba(226, 232, 240, 0.82);
		}

		.desktop {
			position: relative;
			overflow: hidden;
			padding: 22px;
		}

		.desktop-empty-state {
			position: absolute;
			left: 24px;
			top: 24px;
			padding: 14px 16px;
			border-radius: 14px;
			background: rgba(15, 23, 42, 0.28);
			border: 1px solid rgba(255, 255, 255, 0.12);
			max-width: 320px;
		}

		.desktop-empty-state strong {
			display: block;
			margin-bottom: 6px;
		}

		.windows {
			position: absolute;
			inset: 22px 22px 22px 22px;
		}

		.window-shell {
			position: absolute;
			width: min(420px, calc(100vw - 88px));
			min-height: 220px;
			border-radius: 18px;
			overflow: hidden;
			border: 1px solid rgba(255, 255, 255, 0.14);
			background: rgba(15, 23, 42, 0.78);
			backdrop-filter: blur(18px);
			box-shadow: 0 22px 65px rgba(15, 23, 42, 0.42);
		}

		.window-shell[data-maximized='true'] {
			left: 0 !important;
			top: 0 !important;
			width: 100% !important;
			height: calc(100% - 10px) !important;
		}

		.window-shell[data-focused='false'] {
			opacity: 0.88;
		}

		.window-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 12px;
			padding: 14px 16px;
			background: rgba(15, 23, 42, 0.58);
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
			cursor: default;
		}

		.window-title {
			display: flex;
			align-items: center;
			gap: 10px;
			font-weight: 700;
		}

		.window-controls {
			display: flex;
			gap: 8px;
		}

		.window-controls button,
		.launcher-toggle,
		.launcher-card,
		.dock button,
		.settings-row select {
			border: 1px solid rgba(255, 255, 255, 0.12);
			background: rgba(255, 255, 255, 0.08);
			color: inherit;
		}

		.window-controls button,
		.launcher-toggle,
		.dock button {
			border-radius: 12px;
			padding: 8px 10px;
			cursor: pointer;
		}

		.window-body {
			padding: 18px;
			display: grid;
			gap: 14px;
		}

		.window-body h2,
		.window-body h3,
		.window-body p {
			margin: 0;
		}

		.placeholder-grid {
			display: grid;
			gap: 12px;
		}

		.placeholder-panel {
			padding: 14px;
			border-radius: 14px;
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.1);
		}

		.settings-row {
			display: grid;
			gap: 8px;
		}

		.settings-row select {
			padding: 10px 12px;
			border-radius: 12px;
		}

		.dock-region {
			display: flex;
			justify-content: center;
			padding: 0 0 18px;
		}

		.dock {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 12px;
			border-radius: 22px;
			background: rgba(15, 23, 42, 0.5);
			backdrop-filter: blur(18px);
			border: 1px solid rgba(255, 255, 255, 0.14);
			max-width: calc(100vw - 24px);
		}

		.dock button {
			min-width: 88px;
			display: grid;
			gap: 4px;
			justify-items: center;
		}

		.dock button[data-running='true'] {
			background: rgba(56, 189, 248, 0.22);
		}

		.launcher-panel {
			position: absolute;
			left: 22px;
			bottom: 100px;
			width: min(460px, calc(100vw - 44px));
			padding: 18px;
			border-radius: 20px;
			background: rgba(15, 23, 42, 0.72);
			border: 1px solid rgba(255, 255, 255, 0.14);
			backdrop-filter: blur(18px);
			box-shadow: 0 22px 65px rgba(15, 23, 42, 0.45);
		}

		.launcher-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
			gap: 12px;
			margin-top: 14px;
		}

		.launcher-card {
			display: grid;
			gap: 8px;
			padding: 14px;
			border-radius: 16px;
			cursor: pointer;
			text-align: left;
		}

		.launcher-card strong,
		.dock-label,
		.icon-tile {
			display: block;
		}

		.launcher-card small,
		.dock-label,
		.window-subtitle {
			color: rgba(226, 232, 240, 0.8);
		}

		.icon-tile {
			font-size: 1.6rem;
		}

		.status-pill {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 8px 12px;
			width: fit-content;
			border-radius: 999px;
			background: rgba(34, 197, 94, 0.14);
			border: 1px solid rgba(34, 197, 94, 0.24);
			color: rgb(220, 252, 231);
		}
	`

	@state()
	private activeTheme: string = 'midnight'

	@state()
	private activeWallpaper: string = 'aurora'

	@state()
	private isLauncherOpen: boolean = false

	@state()
	private nextWindowId: number = 1

	@state()
	private windows: Array<{
		id: number
		appId: string
		title: string
		icon: string
		description: string
		left: number
		top: number
		width: number
		height: number
		isMinimized: boolean
		isMaximized: boolean
		zIndex: number
	}> = []

	constructor() {
		Spec('Loads persisted shell preferences before the first render')
		super()
		const storedPreferences = this.readPreferences()
		this.activeTheme = storedPreferences.theme
		this.activeWallpaper = storedPreferences.wallpaper
	}

	connectedCallback(): void {
		super.connectedCallback()
		if (this.windows.length === 0) {
			this.openApp('file-manager')
		}
	}

	@Spec('Toggles the launcher panel visibility.')
	private toggleLauncher(): void {
		this.isLauncherOpen = !this.isLauncherOpen
	}

	@Spec('Returns the formatted shell clock label for the top bar.')
	private getClockLabel(): string {
		return new Date('2025-01-01T09:41:00').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	}

	@Spec('Opens an application window or restores an existing one into focus.')
	private openApp(appId: string): void {
		const appDefinition = this.availableApps.find(candidate => candidate.id === appId)
		if (appDefinition === undefined) {
			return
		}

		const existingWindow = this.windows.find(candidate => candidate.appId === appId)
		if (existingWindow !== undefined) {
			this.restoreAndFocusWindow(existingWindow.id)
			this.isLauncherOpen = false
			return
		}

		const zIndex = this.getNextZIndex()
		const newWindow = {
			id: this.nextWindowId,
			appId: appDefinition.id,
			title: appDefinition.name,
			icon: appDefinition.icon,
			description: appDefinition.description,
			left: 40 + (this.nextWindowId - 1) * 34,
			top: 42 + (this.nextWindowId - 1) * 28,
			width: appDefinition.id === 'settings' ? 460 : 400,
			height: appDefinition.id === 'settings' ? 360 : 320,
			isMinimized: false,
			isMaximized: false,
			zIndex
		}
		this.windows = [...this.windows, newWindow]
		this.nextWindowId += 1
		this.isLauncherOpen = false
	}

	@Spec('Focuses a window and brings it to the front of the z-order.')
	private focusWindow(windowId: number): void {
		const zIndex = this.getNextZIndex()
		this.windows = this.windows.map(windowEntry => {
			if (windowEntry.id !== windowId) {
				return windowEntry
			}
			return {
				...windowEntry,
				isMinimized: false,
				zIndex
			}
		})
	}

	@Spec('Minimizes a window while keeping it available in the dock.')
	private minimizeWindow(windowId: number): void {
		this.windows = this.windows.map(windowEntry => {
			if (windowEntry.id !== windowId) {
				return windowEntry
			}
			return {
				...windowEntry,
				isMinimized: true
			}
		})
	}

	@Spec('Toggles maximized state and keeps the chosen window focused.')
	private toggleMaximizeWindow(windowId: number): void {
		const zIndex = this.getNextZIndex()
		this.windows = this.windows.map(windowEntry => {
			if (windowEntry.id !== windowId) {
				return windowEntry
			}
			return {
				...windowEntry,
				isMinimized: false,
				isMaximized: !windowEntry.isMaximized,
				zIndex
			}
		})
	}

	@Spec('Closes a window and removes it from the shell state.')
	private closeWindow(windowId: number): void {
		this.windows = this.windows.filter(windowEntry => windowEntry.id !== windowId)
	}

	@Spec('Restores a minimized window and focuses it.')
	private restoreAndFocusWindow(windowId: number): void {
		const zIndex = this.getNextZIndex()
		this.windows = this.windows.map(windowEntry => {
			if (windowEntry.id !== windowId) {
				return windowEntry
			}
			return {
				...windowEntry,
				isMinimized: false,
				zIndex
			}
		})
	}

	@Spec('Updates the selected wallpaper preference and persists it locally.')
	private onWallpaperChange(event: Event): void {
		const select = event.target
		if (!(select instanceof HTMLSelectElement)) {
			return
		}
		this.activeWallpaper = select.value
		this.persistPreferences()
	}

	@Spec('Updates the selected theme preference and persists it locally.')
	private onThemeChange(event: Event): void {
		const select = event.target
		if (!(select instanceof HTMLSelectElement)) {
			return
		}
		this.activeTheme = select.value
		this.persistPreferences()
	}

	@Spec('Returns true when the given app currently has an open window.')
	private isAppRunning(appId: string): boolean {
		return this.windows.some(windowEntry => windowEntry.appId === appId)
	}

	@Spec('Returns the currently focused window identifier when one exists.')
	private getFocusedWindowId(): number | null {
		if (this.windows.length === 0) {
			return null
		}
		const visibleWindows = this.windows.filter(windowEntry => windowEntry.isMinimized === false)
		if (visibleWindows.length === 0) {
			return null
		}
		const focusedWindow = visibleWindows.reduce((currentHighest, candidate) => {
			if (candidate.zIndex > currentHighest.zIndex) {
				return candidate
			}
			return currentHighest
		})
		return focusedWindow.id
	}

	@Spec('Finds an open window for the given app identifier.')
	private findWindowByAppId(appId: string): {
		id: number
		appId: string
		title: string
		icon: string
		description: string
		left: number
		top: number
		width: number
		height: number
		isMinimized: boolean
		isMaximized: boolean
		zIndex: number
	} | undefined {
		return this.windows.find(windowEntry => windowEntry.appId === appId)
	}

	@Spec('Calculates the next z-index for a focused window.')
	private getNextZIndex(): number {
		if (this.windows.length === 0) {
			return 1
		}
		return Math.max(...this.windows.map(windowEntry => windowEntry.zIndex)) + 1
	}

	@Spec('Persists the current shell preferences to localStorage when available.')
	private persistPreferences(): void {
		try {
			window.localStorage.setItem(
				App.preferencesStorageKey,
				JSON.stringify({
					theme: this.activeTheme,
					wallpaper: this.activeWallpaper
				})
			)
		} catch {
			return
		}
	}

	@Spec('Reads persisted shell preferences from localStorage and falls back to defaults when absent or invalid.')
	private readPreferences(): { theme: string, wallpaper: string } {
		try {
			const rawPreferences = window.localStorage.getItem(App.preferencesStorageKey)
			if (rawPreferences === null) {
				return { theme: 'midnight', wallpaper: 'aurora' }
			}
			const parsedPreferences = JSON.parse(rawPreferences)
			const theme = parsedPreferences.theme
			const wallpaper = parsedPreferences.wallpaper
			if (typeof theme !== 'string' || typeof wallpaper !== 'string') {
				return { theme: 'midnight', wallpaper: 'aurora' }
			}
			return { theme, wallpaper }
		} catch {
			return { theme: 'midnight', wallpaper: 'aurora' }
		}
	}

	@Spec('Renders the inside of a single application window.')
	private renderWindowContent(appId: string): TemplateResult {
		if (appId === 'settings') {
			return html`
				<div class="placeholder-grid">
					<div class="status-pill">⚙️ Shell preferences are saved in this browser</div>
					<div class="settings-row">
						<label for="theme-select">Theme</label>
						<select id="theme-select" data-testid="theme-select" .value=${this.activeTheme} @change=${this.onThemeChange}>
							<option value="midnight">Midnight</option>
							<option value="sunset">Sunset</option>
						</select>
					</div>
					<div class="settings-row">
						<label for="wallpaper-select">Wallpaper</label>
						<select id="wallpaper-select" data-testid="wallpaper-select" .value=${this.activeWallpaper} @change=${this.onWallpaperChange}>
							<option value="aurora">Aurora</option>
							<option value="dunes">Dunes</option>
							<option value="grid">Grid</option>
						</select>
					</div>
				</div>
			`
		}

		if (appId === 'file-manager') {
			return html`
				<div class="placeholder-grid">
					<div class="placeholder-panel">
						<h3>Home</h3>
						<p>Virtual filesystem arrives in chunk 2. This placeholder reserves the browsing surface.</p>
					</div>
					<div class="placeholder-panel">
						<h3>Quick actions</h3>
						<p>Create, rename, move, and upload flows will connect here later.</p>
					</div>
				</div>
			`
		}

		if (appId === 'text-editor') {
			return html`
				<div class="placeholder-grid">
					<div class="placeholder-panel">
						<h3>Draft buffer</h3>
						<p>Text editing will connect to the virtual filesystem in chunk 2.</p>
					</div>
					<div class="placeholder-panel">
						<h3>Formatting</h3>
						<p>Keyboard and save flows will appear once files exist.</p>
					</div>
				</div>
			`
		}

		if (appId === 'image-viewer') {
			return html`
				<div class="placeholder-grid">
					<div class="placeholder-panel">
						<h3>Preview area</h3>
						<p>Image open and zoom behaviors will appear when file associations land.</p>
					</div>
				</div>
			`
		}

		return html`
			<div class="placeholder-grid">
				<div class="placeholder-panel">
					<h3>Build surface</h3>
					<p>App Studio will grow into platform tooling in chunk 3.</p>
				</div>
			</div>
		`
	}

	@Spec('Renders the full operating shell UI.')
	render(): TemplateResult {
		const focusedWindowId = this.getFocusedWindowId()
		return html`
			<div class="shell" data-theme=${this.activeTheme} data-wallpaper=${this.activeWallpaper}>
				<header class="top-bar" data-testid="top-bar">
					<div class="brand">
						<strong>Web OS</strong>
						<span>Chunk 1 shell foundation</span>
					</div>
					<div class="top-bar-clock">${this.getClockLabel()}</div>
				</header>
				<section class="desktop" data-testid="desktop-surface">
					${this.windows.filter(windowEntry => windowEntry.isMinimized === false).length === 0
						? html`
							<div class="desktop-empty-state">
								<strong>Desktop ready</strong>
								<span>Open apps from the launcher or dock.</span>
							</div>
						`
						: null}
					<div class="windows">
						${this.windows
							.filter(windowEntry => windowEntry.isMinimized === false)
							.sort((leftWindow, rightWindow) => leftWindow.zIndex - rightWindow.zIndex)
							.map(windowEntry => html`
								<section
									class="window-shell"
									data-testid="window-${windowEntry.appId}"
									data-app-id=${windowEntry.appId}
									data-window-id=${String(windowEntry.id)}
									data-maximized=${String(windowEntry.isMaximized)}
									data-focused=${String(windowEntry.id === focusedWindowId)}
									style=${`left:${windowEntry.left}px;top:${windowEntry.top}px;width:${windowEntry.width}px;height:${windowEntry.height}px;z-index:${windowEntry.zIndex};`}
									@click=${() => this.focusWindow(windowEntry.id)}
								>
									<div class="window-header">
										<div class="window-title">
											<span>${windowEntry.icon}</span>
											<div>
												<div>${windowEntry.title}</div>
												<div class="window-subtitle">${windowEntry.description}</div>
											</div>
										</div>
										<div class="window-controls">
											<button data-testid="minimize-${windowEntry.appId}" @click=${(event: Event) => { event.stopPropagation(); this.minimizeWindow(windowEntry.id) }}>—</button>
											<button data-testid="maximize-${windowEntry.appId}" @click=${(event: Event) => { event.stopPropagation(); this.toggleMaximizeWindow(windowEntry.id) }}>${windowEntry.isMaximized ? '🗗' : '🗖'}</button>
											<button data-testid="close-${windowEntry.appId}" @click=${(event: Event) => { event.stopPropagation(); this.closeWindow(windowEntry.id) }}>✕</button>
										</div>
									</div>
									<div class="window-body">
										${this.renderWindowContent(windowEntry.appId)}
									</div>
								</section>
							`)}
					</div>
					${this.isLauncherOpen
						? html`
							<section class="launcher-panel" data-testid="launcher-panel">
								<strong>App launcher</strong>
								<div class="launcher-grid">
									${this.availableApps.map(appEntry => html`
										<button class="launcher-card" data-testid="launcher-app-${appEntry.id}" @click=${() => this.openApp(appEntry.id)}>
											<span class="icon-tile">${appEntry.icon}</span>
											<strong>${appEntry.name}</strong>
											<small>${appEntry.description}</small>
										</button>
									`)}
								</div>
							</section>
						`
						: null}
				</section>
				<div class="dock-region">
					<footer class="dock" data-testid="dock">
						<button class="launcher-toggle" data-testid="launcher-toggle" @click=${this.toggleLauncher}>☰ Launcher</button>
						${this.availableApps.filter(appEntry => appEntry.isPinnedToDock).map(appEntry => {
							const openWindow = this.findWindowByAppId(appEntry.id)
							return html`
								<button
									data-testid="dock-app-${appEntry.id}"
									data-running=${String(this.isAppRunning(appEntry.id))}
									@click=${() => openWindow === undefined ? this.openApp(appEntry.id) : this.restoreAndFocusWindow(openWindow.id)}
								>
									<span>${appEntry.icon}</span>
									<span class="dock-label">${appEntry.name}</span>
								</button>
							`
						})}
					</footer>
				</div>
			</div>
		`
	}
}
