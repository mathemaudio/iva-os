import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import { AppShellView } from './AppShellView.lll'

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

	static styles = AppShellView.styles

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

	private activeDragSession: {
		windowId: number
		startClientX: number
		startClientY: number
		startLeft: number
		startTop: number
	} | null = null

	constructor() {
		Spec('Loads persisted shell preferences before the first render')
		super()
		const storedPreferences = this.readPreferences()
		this.activeTheme = storedPreferences.theme
		this.activeWallpaper = storedPreferences.wallpaper
	}

	@Spec('Seeds the initial desktop window set after the shell connects to the page.')
	connectedCallback(): void {
		super.connectedCallback()
		window.addEventListener('mousemove', this.onWindowDrag.bind(this))
		window.addEventListener('mouseup', this.endWindowDrag.bind(this))
		if (this.windows.length === 0) {
			this.openApp('file-manager')
		}
	}

	@Spec('Releases global drag listeners when the shell disconnects from the page.')
	disconnectedCallback(): void {
		window.removeEventListener('mousemove', this.onWindowDrag.bind(this))
		window.removeEventListener('mouseup', this.endWindowDrag.bind(this))
		this.activeDragSession = null
		super.disconnectedCallback()
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

	@Spec('Begins dragging a normal window from its title bar and focuses it.')
	private beginWindowDrag(windowId: number, event: MouseEvent): void {
		const windowEntry = this.windows.find(candidate => candidate.id === windowId)
		if (windowEntry === undefined) {
			return
		}
		if (windowEntry.isMaximized === true) {
			return
		}
		this.focusWindow(windowId)
		this.activeDragSession = {
			windowId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startLeft: windowEntry.left,
			startTop: windowEntry.top
		}
		event.preventDefault()
	}

	@Spec('Moves the actively dragged window while keeping it inside the desktop bounds.')
	private onWindowDrag(event: MouseEvent): void {
		if (this.activeDragSession === null) {
			return
		}
		const desktopArea = this.renderRoot?.querySelector<HTMLElement>('.windows')
		const draggedWindow = this.windows.find(candidate => candidate.id === this.activeDragSession?.windowId)
		if (draggedWindow === undefined) {
			return
		}
		const desktopBounds = desktopArea?.getBoundingClientRect() ?? null
		const deltaX = event.clientX - this.activeDragSession.startClientX
		const deltaY = event.clientY - this.activeDragSession.startClientY
		const rawLeft = this.activeDragSession.startLeft + deltaX
		const rawTop = this.activeDragSession.startTop + deltaY
		const hasMeasuredBounds = desktopBounds !== null && desktopBounds.width > 0 && desktopBounds.height > 0
		const maxLeft = hasMeasuredBounds ? Math.max(desktopBounds.width - draggedWindow.width, 0) : Number.POSITIVE_INFINITY
		const maxTop = hasMeasuredBounds ? Math.max(desktopBounds.height - draggedWindow.height, 0) : Number.POSITIVE_INFINITY
		const nextLeft = Math.min(Math.max(rawLeft, 0), maxLeft)
		const nextTop = Math.min(Math.max(rawTop, 0), maxTop)
		this.windows = this.windows.map(windowEntry => {
			if (windowEntry.id !== this.activeDragSession?.windowId) {
				return windowEntry
			}
			return {
				...windowEntry,
				left: nextLeft,
				top: nextTop
			}
		})
	}

	@Spec('Ends the current window drag interaction when the pointer is released.')
	private endWindowDrag(): void {
		this.activeDragSession = null
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
				<section class="desktop" data-testid="desktop-surface" @mousemove=${(event: MouseEvent) => this.onWindowDrag(event)} @mouseup=${() => this.endWindowDrag()}>
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
									<div class="window-header" data-testid="window-header-${windowEntry.appId}" @mousedown=${(event: MouseEvent) => this.beginWindowDrag(windowEntry.id, event)}>
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
										${AppShellView.renderWindowContent(windowEntry.appId, this.activeTheme, this.activeWallpaper, this.onThemeChange.bind(this), this.onWallpaperChange.bind(this))}
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
