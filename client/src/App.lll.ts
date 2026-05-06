import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import './fileManager/FileManagerView.lll'
import './apps/TextEditorView.lll'
import './apps/ImageViewerView.lll'
import { AppShellView } from './AppShellView.lll'
import { AppAssociationRegistry } from './shell/AppAssociationRegistry.lll'
import { ShellWallpaperCatalog } from './shell/ShellWallpaperCatalog.lll'
import { WallpaperSeeder } from './shell/WallpaperSeeder.lll'
import type { VirtualFileSystemContract } from './vfs/VirtualFileSystemContract.lll'
import { VirtualFileSystemService } from './vfs/VirtualFileSystemService.lll'
import { AppPreferenceStore } from './shell/AppPreferenceStore.lll'
import { AppWindowCatalog } from './shell/AppWindowCatalog.lll'
import { AppWindowPresentation } from './shell/AppWindowPresentation.lll'



@Spec('Composes the browser-hosted operating shell with shared VFS-backed apps, launcher routing, and persisted appearance settings.')
@customElement('app-root')
export class App extends LitElement {
	private readonly appWindowCatalog = new AppWindowCatalog()
	static styles = AppShellView.styles

	@state()
	private activeTheme: string = 'dark'

	@state()
	private activeWallpaper: string = 'aurora'

	@state()
	private isLauncherOpen: boolean = false

	@state()
	private vfsSnapshot: VirtualFileSystemContract['Snapshot']

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
		openedNodeId: string | null
		sourceFolderId: string | null
	}> = []

	private activeDragSession: {
		windowId: number
		startClientX: number
		startClientY: number
		startLeft: number
		startTop: number
	} | null = null

	private activeResizeSession: {
		windowId: number
		startClientX: number
		startClientY: number
		startWidth: number
		startHeight: number
	} | null = null

	private readonly virtualFileSystemService = new VirtualFileSystemService()
	private readonly onWindowDragListener = (event: MouseEvent): void => this.onWindowDrag(event)
	private readonly onWindowResizeListener = (event: MouseEvent): void => this.onWindowResize(event)
	private readonly endWindowPointerSessionListener = (): void => this.endWindowPointerSession()
	private vfsUnsubscribe: (() => void) | null = null
	private hasStartedBackgroundInitialization: boolean = false

	constructor() {
		Spec('Loads persisted shell preferences and the initial virtual filesystem snapshot before the first render')
		super()
		const storedPreferences = AppPreferenceStore.readPreferences()
		this.activeTheme = storedPreferences.theme
		this.activeWallpaper = storedPreferences.wallpaper ?? 'aurora'
		this.vfsSnapshot = this.virtualFileSystemService.load()
		this.ensureWallpaperSelectionMatchesSnapshot(this.vfsSnapshot)
	}

	@Spec('Subscribes to the shared VFS, seeds the initial File Manager window, and starts wallpaper initialization work.')
	connectedCallback(): void {
		super.connectedCallback()
		window.addEventListener('mousemove', this.onWindowDragListener)
		window.addEventListener('mousemove', this.onWindowResizeListener)
		window.addEventListener('mouseup', this.endWindowPointerSessionListener)
		if (this.vfsUnsubscribe === null) {
			this.vfsUnsubscribe = this.virtualFileSystemService.subscribe(snapshot => {
				this.handleSnapshotChange(snapshot)
			})
		}
		if (this.windows.length === 0) {
			this.openApp('file-manager', this.vfsSnapshot.schema.rootId, null)
		}
		if (this.hasStartedBackgroundInitialization === false) {
			this.hasStartedBackgroundInitialization = true
			void this.initializeWallpapers()
		}
	}

	@Spec('Releases global drag listeners and the VFS subscription when the shell disconnects from the page.')
	disconnectedCallback(): void {
		window.removeEventListener('mousemove', this.onWindowDragListener)
		window.removeEventListener('mousemove', this.onWindowResizeListener)
		window.removeEventListener('mouseup', this.endWindowPointerSessionListener)
		if (this.vfsUnsubscribe !== null) {
			this.vfsUnsubscribe()
			this.vfsUnsubscribe = null
		}
		this.activeDragSession = null
		this.activeResizeSession = null
		super.disconnectedCallback()
	}

	@Spec('Starts first-run wallpaper seeding and applies the first imported wallpaper when no valid preference exists yet.')
	private async initializeWallpapers(): Promise<void> {
		const fetchLike = 'fetch' in globalThis ? globalThis.fetch.bind(globalThis) : undefined
		const createdWallpaperIds = await WallpaperSeeder.seedIfNeeded(this.virtualFileSystemService, fetchLike)
		if (createdWallpaperIds.length > 0 && this.isWallpaperSelectionValid(this.activeWallpaper, this.vfsSnapshot) === false) {
			this.activeWallpaper = createdWallpaperIds[0]
			AppPreferenceStore.persistPreferences(this.activeTheme, this.activeWallpaper)
		}
	}

	@Spec('Stores one fresh snapshot from the shared VFS and synchronizes dependent shell state such as wallpaper fallback and folder titles.')
	private handleSnapshotChange(snapshot: VirtualFileSystemContract['Snapshot']): void {
		this.vfsSnapshot = snapshot
		this.ensureWallpaperSelectionMatchesSnapshot(snapshot)
		this.synchronizeWindowStateWithSnapshot(snapshot)
	}

	@Spec('Keeps file-manager folder targets and wallpaper fallback valid when the underlying VFS changes beneath the shell.')
	private synchronizeWindowStateWithSnapshot(snapshot: VirtualFileSystemContract['Snapshot']): void {
		this.windows = this.windows.map(windowEntry => {
			if (windowEntry.appId !== 'file-manager') {
				return windowEntry
			}
			const requestedFolder = windowEntry.openedNodeId === null ? null : snapshot.schema.nodesById[windowEntry.openedNodeId] ?? null
			const folderId = requestedFolder?.kind === 'folder' ? requestedFolder.id : snapshot.schema.rootId
			return {
				...windowEntry,
				openedNodeId: folderId,
				title: AppWindowPresentation.buildWindowTitle(this.appWindowCatalog.availableApps, this.vfsSnapshot, 'file-manager', folderId)
			}
		})
	}

	@Spec('Ensures the active wallpaper selection always references either a built-in wallpaper or an existing VFS image file.')
	private ensureWallpaperSelectionMatchesSnapshot(snapshot: VirtualFileSystemContract['Snapshot']): void {
		if (this.isWallpaperSelectionValid(this.activeWallpaper, snapshot)) {
			return
		}
		const firstWallpaperChoice = ShellWallpaperCatalog.getChoices(snapshot).find(choice => choice.id !== 'aurora' && choice.id !== 'dunes' && choice.id !== 'grid')
		this.activeWallpaper = firstWallpaperChoice?.id ?? 'aurora'
		AppPreferenceStore.persistPreferences(this.activeTheme, this.activeWallpaper)
	}

	@Spec('Returns true when one wallpaper selection points at either a supported built-in wallpaper or an existing VFS image node.')
	private isWallpaperSelectionValid(wallpaperId: string, snapshot: VirtualFileSystemContract['Snapshot']): boolean {
		if (wallpaperId === 'aurora' || wallpaperId === 'dunes' || wallpaperId === 'grid') {
			return true
		}
		const fileNode = snapshot.schema.nodesById[wallpaperId] ?? null
		if (fileNode?.kind !== 'file') {
			return false
		}
		const fileContent = this.virtualFileSystemService.readBinaryFile(wallpaperId)
		return typeof fileContent === 'string'
	}

	@Spec('Toggles the launcher panel visibility.')
	private toggleLauncher(): void {
		this.isLauncherOpen = !this.isLauncherOpen
	}

	@Spec('Returns the formatted shell clock label for the top bar.')
	private getClockLabel(): string {
		return new Date('2025-01-01T09:41:00').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	}

	@Spec('Routes one VFS node through the shared app association registry and opens the corresponding shell window state.')
	private openNode(nodeId: string, currentFolderId: string | null = null): void {
		const node = this.vfsSnapshot.schema.nodesById[nodeId] ?? null
		if (node === null) {
			return
		}
		const appId = AppAssociationRegistry.resolveDefaultAppId(node)
		if (appId === null) {
			return
		}
		if (node.kind === 'folder') {
			this.openApp(appId, node.id, currentFolderId)
			return
		}
		this.openApp(appId, node.id, currentFolderId ?? node.parentId)
	}

	@Spec('Opens an application window or reuses an existing one while updating its shell-managed window state.')
	private openApp(appId: string, openedNodeId: string | null = null, sourceFolderId: string | null = null): void {
		const appDefinition = this.appWindowCatalog.availableApps.find(candidate => candidate.id === appId)
		if (appDefinition === undefined) {
			return
		}
		const existingWindow = this.windows.find(candidate => candidate.appId === appId)
		if (existingWindow !== undefined) {
			const zIndex = this.getNextZIndex()
			this.windows = this.windows.map(windowEntry => {
				if (windowEntry.id !== existingWindow.id) {
					return windowEntry
				}
				const nextOpenedNodeId = openedNodeId === null ? windowEntry.openedNodeId : openedNodeId
				const nextSourceFolderId = sourceFolderId === null ? windowEntry.sourceFolderId : sourceFolderId
				return {
					...windowEntry,
					openedNodeId: nextOpenedNodeId,
					sourceFolderId: nextSourceFolderId,
					title: AppWindowPresentation.buildWindowTitle(this.appWindowCatalog.availableApps, this.vfsSnapshot, windowEntry.appId, nextOpenedNodeId),
					isMinimized: false,
					zIndex
				}
			})
			this.isLauncherOpen = false
			return
		}
		const nextWindowId = this.nextWindowId
		const zIndex = this.getNextZIndex()
		const resolvedOpenedNodeId = appId === 'file-manager' ? openedNodeId ?? this.vfsSnapshot.schema.rootId : openedNodeId
		const newWindow = {
			id: nextWindowId,
			appId: appDefinition.id,
			title: AppWindowPresentation.buildWindowTitle(this.appWindowCatalog.availableApps, this.vfsSnapshot, appDefinition.id, resolvedOpenedNodeId),
			icon: appDefinition.icon,
			description: appDefinition.description,
			left: 40 + (nextWindowId - 1) * 34,
			top: 42 + (nextWindowId - 1) * 28,
			width: this.appWindowCatalog.getWindowWidth(appDefinition.id),
			height: this.appWindowCatalog.getWindowHeight(appDefinition.id),
			isMinimized: false,
			isMaximized: false,
			zIndex,
			openedNodeId: resolvedOpenedNodeId,
			sourceFolderId
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
		if (windowEntry === undefined || windowEntry.isMaximized === true) {
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

	@Spec('Begins resizing a normal window from its lower-right handle and keeps that window focused.')
	private beginWindowResize(windowId: number, event: MouseEvent): void {
		const windowEntry = this.windows.find(candidate => candidate.id === windowId)
		if (windowEntry === undefined || windowEntry.isMaximized === true) {
			return
		}
		this.focusWindow(windowId)
		this.activeResizeSession = {
			windowId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startWidth: windowEntry.width,
			startHeight: windowEntry.height
		}
		event.preventDefault()
		event.stopPropagation()
	}

	@Spec('Resizes the active window while enforcing minimum dimensions and desktop bounds.')
	private onWindowResize(event: MouseEvent): void {
		if (this.activeResizeSession === null) {
			return
		}
		const desktopArea = this.renderRoot?.querySelector<HTMLElement>('.windows')
		const resizedWindow = this.windows.find(candidate => candidate.id === this.activeResizeSession?.windowId)
		if (resizedWindow === undefined) {
			return
		}
		const desktopBounds = desktopArea?.getBoundingClientRect() ?? null
		const deltaX = event.clientX - this.activeResizeSession.startClientX
		const deltaY = event.clientY - this.activeResizeSession.startClientY
		const rawWidth = this.activeResizeSession.startWidth + deltaX
		const rawHeight = this.activeResizeSession.startHeight + deltaY
		const minWidth = 320
		const minHeight = 220
		const hasMeasuredBounds = desktopBounds !== null && desktopBounds.width > 0 && desktopBounds.height > 0
		const measuredMaxWidth = hasMeasuredBounds ? desktopBounds.width - resizedWindow.left : Number.POSITIVE_INFINITY
		const measuredMaxHeight = hasMeasuredBounds ? desktopBounds.height - resizedWindow.top : Number.POSITIVE_INFINITY
		const maxWidth = hasMeasuredBounds && measuredMaxWidth >= resizedWindow.width ? Math.max(measuredMaxWidth, minWidth) : Number.POSITIVE_INFINITY
		const maxHeight = hasMeasuredBounds && measuredMaxHeight >= resizedWindow.height ? Math.max(measuredMaxHeight, minHeight) : Number.POSITIVE_INFINITY
		const nextWidth = Math.min(Math.max(rawWidth, minWidth), maxWidth)
		const nextHeight = Math.min(Math.max(rawHeight, minHeight), maxHeight)
		this.windows = this.windows.map(windowEntry => {
			if (windowEntry.id !== this.activeResizeSession?.windowId) {
				return windowEntry
			}
			return {
				...windowEntry,
				width: nextWidth,
				height: nextHeight
			}
		})
	}

	@Spec('Ends the current drag or resize pointer session when the pointer is released.')
	private endWindowPointerSession(): void {
		this.activeDragSession = null
		this.activeResizeSession = null
	}

	@Spec('Updates the selected wallpaper preference and persists it locally.')
	private onWallpaperChange(event: Event): void {
		const select = event.target
		if (!(select instanceof HTMLSelectElement)) {
			return
		}
		this.activeWallpaper = select.value
		AppPreferenceStore.persistPreferences(this.activeTheme, this.activeWallpaper)
	}

	@Spec('Updates the selected theme preference and persists it locally without affecting the current wallpaper.')
	private onThemeChange(event: Event): void {
		const select = event.target
		if (!(select instanceof HTMLSelectElement)) {
			return
		}
		this.activeTheme = select.value === 'light' ? 'light' : 'dark'
		AppPreferenceStore.persistPreferences(this.activeTheme, this.activeWallpaper)
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
		openedNodeId: string | null
		sourceFolderId: string | null
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

	@Spec('Accepts child-view title updates so file rename, delete, and dirty-state changes appear in the outer shell window header.')
	private onChildWindowTitleChange(windowId: number, title: string): void {
		this.windows = this.windows.map(windowEntry => {
			if (windowEntry.id !== windowId) {
				return windowEntry
			}
			return {
				...windowEntry,
				title
			}
		})
	}

	@Spec('Accepts child-view active file changes so Save As targets become the new source of truth for that app window.')
	private onChildWindowNodeChange(windowId: number, nodeId: string | null): void {
		this.windows = this.windows.map(windowEntry => {
			if (windowEntry.id !== windowId) {
				return windowEntry
			}
			const node = nodeId === null ? null : this.vfsSnapshot.schema.nodesById[nodeId] ?? null
			return {
				...windowEntry,
				openedNodeId: nodeId,
				sourceFolderId: node?.parentId ?? windowEntry.sourceFolderId,
				title: node?.kind === 'file' ? node.name : windowEntry.title
			}
		})
	}



	@Spec('Renders the full operating shell UI.')
	render(): TemplateResult {
		const focusedWindowId = this.getFocusedWindowId()
		const wallpaperStyle = ShellWallpaperCatalog.getBackgroundStyle(this.activeWallpaper, this.vfsSnapshot, fileId => this.virtualFileSystemService.readBinaryFile(fileId))
		return html`
			<div class="shell" data-theme=${this.activeTheme} data-wallpaper=${this.activeWallpaper} style=${wallpaperStyle}>
				<header class="top-bar" data-testid="top-bar">
					<div class="brand">
						<strong>IvaOS</strong>
						<span>Shared virtual filesystem desktop</span>
					</div>
					<div class="top-bar-clock">${this.getClockLabel()}</div>
				</header>
				<section class="desktop" data-testid="desktop-surface" @mousemove=${(event: MouseEvent) => { this.onWindowDrag(event); this.onWindowResize(event) }} @mouseup=${() => this.endWindowPointerSession()}>
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
										${AppWindowPresentation.renderWindowContent(
											windowEntry,
											this.activeTheme,
											this.activeWallpaper,
											this.vfsSnapshot,
											this.virtualFileSystemService,
											this.onThemeChange.bind(this),
											this.onWallpaperChange.bind(this),
											(nodeId: string, currentFolderId: string) => this.openNode(nodeId, currentFolderId),
											(windowId: number, title: string) => this.onChildWindowTitleChange(windowId, title),
											(windowId: number, nodeId: string | null) => this.onChildWindowNodeChange(windowId, nodeId)
										)}
									</div>
									<button class="window-resize-handle" data-testid=${`resize-${windowEntry.appId}`} aria-label=${`Resize ${windowEntry.title}`} @mousedown=${(event: MouseEvent) => this.beginWindowResize(windowEntry.id, event)}></button>
								</section>
							`)}
					</div>
					${this.isLauncherOpen
						? html`
							<section class="launcher-panel" data-testid="launcher-panel">
								<strong>App launcher</strong>
								<div class="launcher-grid">
									${this.appWindowCatalog.availableApps.map(appEntry => html`
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
						${this.appWindowCatalog.availableApps.filter(appEntry => appEntry.isPinnedToDock).map(appEntry => {
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
