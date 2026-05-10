import './App.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { App } from './App.lll'

@Spec('Exercises the IvaOS shell through visible UI interactions only.')
export class AppTest {
	testType = 'behavioral'

	@Scenario('shows the desktop shell with top bar, dock, and seeded file manager window')
	static async rendersShellChrome(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ topBar: boolean, dockButtons: number, seededWindow: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		const topBar = app.shadowRoot?.querySelector<HTMLElement>('[data-testid="top-bar"]')
		const dock = app.shadowRoot?.querySelector<HTMLElement>('[data-testid="dock"]')
		const seededWindow = app.shadowRoot?.querySelector<HTMLElement>('[data-testid="window-file-manager"]')
		const dockButtons = app.shadowRoot?.querySelectorAll('[data-testid^="dock-app-"]').length ?? 0
		assert(topBar !== null && topBar !== undefined, 'Expected the top bar to render')
		assert(dock !== null && dock !== undefined, 'Expected the dock to render')
		assert(seededWindow !== null && seededWindow !== undefined, 'Expected the seeded file manager window to render')
		assert(dockButtons >= 3, 'Expected pinned dock apps to be visible')
		return { topBar: true, dockButtons, seededWindow: true }
	}

	@Scenario('opens a second app from the launcher and manages its window state')
	static async opensAndManagesMultipleWindows(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ openWindowsBeforeMinimize: number, restoredVisible: boolean, maximized: boolean, closed: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		this.click(app, '[data-testid="launcher-toggle"]')
		await waitFor(() => this.find(app, '[data-testid="launcher-panel"]') !== null, 'Expected launcher panel to open')
		this.click(app, '[data-testid="launcher-app-text-editor"]')
		await waitFor(() => this.find(app, '[data-testid="window-text-editor"]') !== null, 'Expected text editor window to open')

		const openWindowsBeforeMinimize = this.findAll(app, '.window-shell').length
		assert(openWindowsBeforeMinimize >= 2, 'Expected at least two windows to be visible at once')

		const fileManagerWindowBeforeFocus = this.find(app, '[data-testid="window-file-manager"]')
		const textEditorWindowBeforeFocus = this.find(app, '[data-testid="window-text-editor"]')
		assert(fileManagerWindowBeforeFocus?.getAttribute('data-focused') === 'false', 'Expected file manager to lose focus after opening text editor')
		assert(textEditorWindowBeforeFocus?.getAttribute('data-focused') === 'true', 'Expected text editor to receive focus after opening')

		this.click(app, '[data-testid="minimize-text-editor"]')
		await app.updateComplete
		assert(this.find(app, '[data-testid="window-text-editor"]') === null, 'Expected text editor window to disappear when minimized')

		this.click(app, '[data-testid="dock-app-text-editor"]')
		await waitFor(() => this.find(app, '[data-testid="window-text-editor"]') !== null, 'Expected dock click to restore the minimized window')
		const restoredVisible = this.find(app, '[data-testid="window-text-editor"]') !== null

		this.click(app, '[data-testid="maximize-text-editor"]')
		await app.updateComplete
		const maximizedWindow = this.find(app, '[data-testid="window-text-editor"]')
		const maximized = maximizedWindow?.getAttribute('data-maximized') === 'true'
		assert(maximized, 'Expected maximize control to mark the window as maximized')

		this.click(app, '[data-testid="close-text-editor"]')
		await app.updateComplete
		const closed = this.find(app, '[data-testid="window-text-editor"]') === null
		assert(closed, 'Expected close control to remove the text editor window')
		return { openWindowsBeforeMinimize, restoredVisible, maximized, closed }
	}

	@Scenario('drags a normal window by its title bar')
	static async dragsWindowFromHeader(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ movedLeft: number, movedTop: number }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		this.click(app, '[data-testid="launcher-toggle"]')
		await waitFor(() => this.find(app, '[data-testid="launcher-panel"]') !== null, 'Expected launcher panel to open before opening a draggable second window')
		this.click(app, '[data-testid="launcher-app-text-editor"]')
		await waitFor(() => this.find(app, '[data-testid="window-text-editor"]') !== null, 'Expected text editor window to open before dragging')

		const desktopSurface = this.find(app, '[data-testid="desktop-surface"]')
		const header = this.find(app, '[data-testid="window-header-text-editor"]')
		const windowElement = this.find(app, '[data-testid="window-text-editor"]')
		assert(desktopSurface !== null, 'Expected the desktop surface to exist for dragging')
		assert(header !== null, 'Expected the text editor header to exist for dragging')
		assert(windowElement !== null, 'Expected the text editor window to exist for dragging')

		const beforeLeft = this.readPixelOffset(windowElement, 'left')
		const beforeTop = this.readPixelOffset(windowElement, 'top')
		const headerBounds = header.getBoundingClientRect()
		const startClientX = headerBounds.left + headerBounds.width / 2
		const startClientY = headerBounds.top + headerBounds.height / 2
		const targetClientX = startClientX + 120
		const targetClientY = startClientY + 90
		header.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: startClientX, clientY: startClientY, buttons: 1 }))
		desktopSurface.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: targetClientX, clientY: targetClientY, buttons: 1 }))
		desktopSurface.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: targetClientX, clientY: targetClientY }))
		await app.updateComplete

		const movedWindow = this.find(app, '[data-testid="window-text-editor"]')
		assert(movedWindow !== null, 'Expected the text editor window to remain visible after dragging')
		const movedLeft = this.readPixelOffset(movedWindow, 'left')
		const movedTop = this.readPixelOffset(movedWindow, 'top')
		assert(movedLeft !== beforeLeft || movedTop !== beforeTop, `Expected the dragged window position to change from its starting point. beforeLeft=${beforeLeft}, movedLeft=${movedLeft}, beforeTop=${beforeTop}, movedTop=${movedTop}`)
		return { movedLeft, movedTop }
	}

	@Scenario('allows dragging a window flush to the desktop edge')
	static async allowsDraggingWindowToDesktopEdge(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ movedTop: number, expectedMaxTop: number }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		this.click(app, '[data-testid="launcher-toggle"]')
		await waitFor(() => this.find(app, '[data-testid="launcher-panel"]') !== null, 'Expected launcher panel to open before opening a second draggable window')
		this.click(app, '[data-testid="launcher-app-text-editor"]')
		await waitFor(() => this.find(app, '[data-testid="window-text-editor"]') !== null, 'Expected text editor window to open before lower-edge dragging')

		const desktopSurface = this.find(app, '[data-testid="desktop-surface"]')
		const windowsRegion = this.find(app, '.windows')
		const header = this.find(app, '[data-testid="window-header-text-editor"]')
		const windowElement = this.find(app, '[data-testid="window-text-editor"]')
		assert(desktopSurface !== null, 'Expected the desktop surface to exist for lower-edge dragging')
		assert(windowsRegion !== null, 'Expected the windows region to exist for lower-edge dragging')
		assert(header !== null, 'Expected the text editor header to exist for lower-edge dragging')
		assert(windowElement !== null, 'Expected the text editor window to exist for lower-edge dragging')

		windowsRegion.getBoundingClientRect = (): DOMRect => new DOMRect(0, 0, 900, 600)
		const windowHeight = this.readPixelSize(windowElement, 'height')
		const expectedMaxTop = 600 - windowHeight
		const headerBounds = header.getBoundingClientRect()
		const startClientX = headerBounds.left + headerBounds.width / 2
		const startClientY = headerBounds.top + headerBounds.height / 2
		header.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: startClientX, clientY: startClientY, buttons: 1 }))
		desktopSurface.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: startClientX, clientY: startClientY + 4000, buttons: 1 }))
		desktopSurface.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: startClientX, clientY: startClientY + 4000 }))
		await app.updateComplete

		const movedWindow = this.find(app, '[data-testid="window-text-editor"]')
		assert(movedWindow !== null, 'Expected the text editor window to remain visible after lower-edge dragging')
		const movedTop = this.readPixelOffset(movedWindow, 'top')
		assert(movedTop === expectedMaxTop, `Expected the dragged window to reach the measured desktop edge. movedTop=${movedTop}, expectedMaxTop=${expectedMaxTop}`)
		return { movedTop, expectedMaxTop }
	}

	@Scenario('resizes a normal window from its lower-right handle')
	static async resizesWindowFromHandle(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ resizedWidth: number, resizedHeight: number }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		this.click(app, '[data-testid="dock-app-settings"]')
		await waitFor(() => this.find(app, '[data-testid="window-settings"]') !== null, 'Expected settings window to open before resizing')
		const desktopSurface = this.find(app, '[data-testid="desktop-surface"]')
		const windowElement = this.find(app, '[data-testid="window-settings"]')
		const resizeHandle = this.find(app, '[data-testid="resize-settings"]')
		assert(desktopSurface !== null, 'Expected the desktop surface to exist for resize testing')
		assert(windowElement !== null, 'Expected the settings window to exist for resize testing')
		assert(resizeHandle !== null, 'Expected the settings resize handle to exist')

		const beforeWidth = this.readPixelSize(windowElement, 'width')
		const beforeHeight = this.readPixelSize(windowElement, 'height')
		const handleBounds = resizeHandle.getBoundingClientRect()
		const startClientX = handleBounds.left + handleBounds.width / 2
		const startClientY = handleBounds.top + handleBounds.height / 2
		const targetClientX = startClientX + 90
		const targetClientY = startClientY + 70
		resizeHandle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: startClientX, clientY: startClientY, buttons: 1 }))
		desktopSurface.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: targetClientX, clientY: targetClientY, buttons: 1 }))
		desktopSurface.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: targetClientX, clientY: targetClientY }))
		await app.updateComplete

		const resizedWindow = this.find(app, '[data-testid="window-settings"]')
		assert(resizedWindow !== null, 'Expected the settings window to remain visible after resizing')
		const resizedWidth = this.readPixelSize(resizedWindow, 'width')
		const resizedHeight = this.readPixelSize(resizedWindow, 'height')
		assert(resizedWidth > beforeWidth, `Expected resized width to increase. beforeWidth=${beforeWidth}, resizedWidth=${resizedWidth}`)
		assert(resizedHeight > beforeHeight, `Expected resized height to increase. beforeHeight=${beforeHeight}, resizedHeight=${resizedHeight}`)
		return { resizedWidth, resizedHeight }
	}

	@Scenario('changes theme and wallpaper in settings without coupling them and persists both values')
	static async persistsShellPreferences(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ storedTheme: string, storedWallpaper: string, renderedTheme: string, renderedWallpaper: string }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		this.click(app, '[data-testid="dock-app-settings"]')
		await waitFor(() => this.find(app, '[data-testid="window-settings"]') !== null, 'Expected settings window to open from the dock')

		const settingsWindow = this.find(app, 'iva-settings-view')
		const themeSelect = settingsWindow?.shadowRoot?.querySelector('[data-testid="theme-select"]') ?? null
		const wallpaperSelect = settingsWindow?.shadowRoot?.querySelector('[data-testid="wallpaper-select"]') ?? null
		assert(themeSelect instanceof HTMLSelectElement, 'Expected the theme select to render')
		assert(wallpaperSelect instanceof HTMLSelectElement, 'Expected the wallpaper select to render')

		wallpaperSelect.value = 'grid'
		wallpaperSelect.dispatchEvent(new Event('change', { bubbles: true }))
		themeSelect.value = 'light'
		themeSelect.dispatchEvent(new Event('change', { bubbles: true }))
		await app.updateComplete

		const shell = this.find(app, '.shell')
		const storedPreferences = JSON.parse(window.localStorage.getItem('lll.settings.v1') ?? '{}')
		const storedTheme = typeof storedPreferences.theme === 'string' ? storedPreferences.theme : ''
		const storedWallpaper = typeof storedPreferences.wallpaper === 'string' ? storedPreferences.wallpaper : ''
		const renderedTheme = shell?.getAttribute('data-theme') ?? ''
		const renderedWallpaper = shell?.getAttribute('data-wallpaper') ?? ''
		assert(storedTheme === 'light', 'Expected theme preference to persist as light')
		assert(storedWallpaper === 'grid', 'Expected wallpaper preference to persist as grid')
		assert(renderedTheme === 'light', 'Expected shell theme attribute to update')
		assert(renderedWallpaper === 'grid', 'Expected shell wallpaper attribute to remain independent')
		return { storedTheme, storedWallpaper, renderedTheme, renderedWallpaper }
	}

	@Scenario('opens the Text Editor from the launcher and marks it as running in the shell')
	static async opensTextEditorFromLauncher(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ hasWindow: boolean, title: string, dockRunning: string | null }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		this.click(app, '[data-testid="launcher-toggle"]')
		await waitFor(() => this.find(app, '[data-testid="launcher-panel"]') !== null, 'Expected launcher panel to open before opening Text Editor')
		this.click(app, '[data-testid="launcher-app-text-editor"]')
		await waitFor(() => this.find(app, '[data-testid="window-text-editor"]') !== null, 'Expected Text Editor window to open from the launcher')
		const hasWindow = this.find(app, '[data-testid="window-text-editor"]') !== null
		const title = this.readWindowTitle(app, 'text-editor')
		const dockRunning = this.find(app, '[data-testid="dock-app-text-editor"]')?.getAttribute('data-running')
		assert(hasWindow, 'Expected Text Editor window to be visible after launcher open')
		assert(title === 'Text Editor', 'Expected Text Editor to use its default shell title before a file is opened')
		assert(dockRunning === 'true', 'Expected the dock to mark Text Editor as running after launch')
		return { hasWindow, title, dockRunning }
	}

	@Scenario('opens Activity Monitor and shows running apps, event history, and runtime stats tabs')
	static async opensActivityMonitorAndShowsTabs(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ runningApps: number, eventCount: number, hasMemoryMetric: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		this.click(app, '[data-testid="dock-app-settings"]')
		await waitFor(() => this.find(app, '[data-testid="window-settings"]') !== null, 'Expected Settings to open before creating monitorable settings events')
		const settingsWindow = this.find(app, 'iva-settings-view')
		const themeSelect = settingsWindow?.shadowRoot?.querySelector('[data-testid="theme-select"]') ?? null
		assert(themeSelect instanceof HTMLSelectElement, 'Expected Settings theme select to exist before opening Activity Monitor')
		themeSelect.value = 'light'
		themeSelect.dispatchEvent(new Event('change', { bubbles: true }))
		await app.updateComplete

		this.click(app, '[data-testid="dock-app-activity-monitor"]')
		await waitFor(() => this.find(app, '[data-testid="window-activity-monitor"]') !== null, 'Expected Activity Monitor to open from the dock')
		await waitFor(() => this.find(app, 'iva-activity-monitor-view') !== null, 'Expected the Activity Monitor host element to render inside the shell')
		const runningApps = this.findAllInActivityMonitor(app, '[data-testid^="activity-monitor-running-app-"]').length
		assert(runningApps >= 2, 'Expected Activity Monitor to list File Manager and its own running window at minimum')
		this.clickInActivityMonitor(app, '[data-testid="activity-monitor-tab-signals-events"]')
		await app.updateComplete
		const eventCount = this.findAllInActivityMonitor(app, '[data-testid^="activity-monitor-event-"]').length
		assert(eventCount >= 1, 'Expected Activity Monitor to show recorded runtime events after shell interactions')
		this.clickInActivityMonitor(app, '[data-testid="activity-monitor-tab-runtime-stats"]')
		await app.updateComplete
		const hasMemoryMetric = this.findInActivityMonitor(app, '[data-testid="activity-monitor-stat-memory"]') !== null
		const runtimeStatsText = this.readTextInActivityMonitor(app, '[data-testid="activity-monitor-runtime-stats-panel"]').toLowerCase()
		assert(hasMemoryMetric, 'Expected Activity Monitor runtime stats to show the memory metric card')
		assert(runtimeStatsText.includes('cpu') === false, 'Expected Activity Monitor runtime stats to omit CPU load')
		assert(runtimeStatsText.includes('thread') === false, 'Expected Activity Monitor runtime stats to omit thread metrics')
		return { runningApps, eventCount, hasMemoryMetric }
	}

	@Scenario('keeps the selected Activity Monitor tab while other windows are focused')
	static async keepsActivityMonitorTabSelectionAcrossWindowFocusChanges(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ remainedOnSignalsTab: boolean, eventCount: number }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		this.click(app, '[data-testid="dock-app-activity-monitor"]')
		await waitFor(() => this.find(app, '[data-testid="window-activity-monitor"]') !== null, 'Expected Activity Monitor to open from the dock')
		await waitFor(() => this.findInActivityMonitor(app, '[data-testid="activity-monitor-tab-signals-events"]') !== null, 'Expected Activity Monitor tabs to render')
		this.clickInActivityMonitor(app, '[data-testid="activity-monitor-tab-signals-events"]')
		await app.updateComplete
		this.click(app, '[data-testid="window-file-manager"]')
		await app.updateComplete
		const remainedOnSignalsTab = this.findInActivityMonitor(app, '[data-testid="activity-monitor-signals-events-panel"]') !== null
		const eventCount = this.findAllInActivityMonitor(app, '[data-testid^="activity-monitor-event-"]').length
		assert(remainedOnSignalsTab, 'Expected Activity Monitor to stay on the Signals & Events tab after other windows receive focus')
		assert(eventCount >= 1, 'Expected the Signals & Events tab to remain visible with recorded events after focus changes')
		return { remainedOnSignalsTab, eventCount }
	}

	@Scenario('keeps file manager navigation stable while another app opens from the selected folder')
	static async preservesFileManagerNavigationAcrossOtherWindowUpdates(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ currentFolderBeforeOpen: string, currentFolderAfterOpen: string, documentsStillVisible: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)
		await this.waitForFileManager(app, waitFor)
		this.clickInFileManager(app, '[data-testid="file-manager-sidebar-Documents"]')
		await waitFor(() => this.readTextInFileManager(app, '[data-testid="file-manager-current-folder"]') === 'Documents', 'Expected Documents to become the current folder before opening a file')
		const currentFolderBeforeOpen = this.readTextInFileManager(app, '[data-testid="file-manager-current-folder"]')
		this.doubleClickByNodeName(app, 'README.txt')
		await waitFor(() => this.find(app, '[data-testid="window-text-editor"]') !== null, 'Expected Text Editor to open from the selected Documents file')
		await this.waitForFileManager(app, waitFor)
		const currentFolderAfterOpen = this.readTextInFileManager(app, '[data-testid="file-manager-current-folder"]')
		const documentsStillVisible = this.findNodeByName(app, 'README.txt') !== null
		assert(currentFolderBeforeOpen === 'Documents', 'Expected File Manager to navigate into Documents before opening the file')
		assert(currentFolderAfterOpen === 'Documents', 'Expected File Manager to stay in Documents after Text Editor opens')
		assert(documentsStillVisible, 'Expected File Manager to keep rendering the Documents folder contents after another window opens')
		return { currentFolderBeforeOpen, currentFolderAfterOpen, documentsStillVisible }
	}

	@Scenario('opens and closes the Image Viewer from the launcher without breaking the shell')
	static async opensAndClosesImageViewer(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ opened: boolean, closed: boolean, fileManagerStillVisible: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		this.click(app, '[data-testid="launcher-toggle"]')
		await waitFor(() => this.find(app, '[data-testid="launcher-panel"]') !== null, 'Expected launcher panel to open before opening Image Viewer')
		this.click(app, '[data-testid="launcher-app-image-viewer"]')
		await waitFor(() => this.find(app, '[data-testid="window-image-viewer"]') !== null, 'Expected Image Viewer window to open from the launcher')
		const opened = this.find(app, '[data-testid="window-image-viewer"]') !== null
		this.click(app, '[data-testid="close-image-viewer"]')
		await app.updateComplete
		const closed = this.find(app, '[data-testid="window-image-viewer"]') === null
		const fileManagerStillVisible = this.find(app, '[data-testid="window-file-manager"]') !== null
		assert(opened, 'Expected Image Viewer to open from the launcher')
		assert(closed, 'Expected Image Viewer to close cleanly from the shell control')
		assert(fileManagerStillVisible, 'Expected the seeded File Manager window to remain unaffected')
		return { opened, closed, fileManagerStillVisible }
	}

	@Spec('Waits until the paired App host has rendered its shadow UI.')
	private static async waitForApp(app: App, waitFor: WaitForFn): Promise<void> {
		await waitFor(() => app.shadowRoot !== null, 'Expected app-root shadow DOM to render')
		await app.updateComplete
	}

	@Spec('Waits until the nested File Manager view and its shadow DOM are available inside the App shell.')
	private static async waitForFileManager(app: App, waitFor: WaitForFn): Promise<void> {
		await waitFor(() => this.find(app, 'iva-file-manager-view') !== null, 'Expected the File Manager host element to render inside the shell')
		await waitFor(() => this.findInFileManager(app, '[data-testid="file-manager-view"]') !== null, 'Expected the File Manager shadow UI to render inside the shell')
	}

	@Spec('Finds one element in the paired App shadow root.')
	private static find(app: App, selector: string): HTMLElement | null {
		return app.shadowRoot?.querySelector<HTMLElement>(selector) ?? null
	}

	@Spec('Finds all matching elements in the paired App shadow root.')
	private static findAll(app: App, selector: string): HTMLElement[] {
		return Array.from(app.shadowRoot?.querySelectorAll<HTMLElement>(selector) ?? [])
	}

	@Spec('Clicks an element in the paired App shadow root by selector.')
	private static click(app: App, selector: string): void {
		const element = this.find(app, selector)
		if (element === null) {
			throw new Error(`Expected element to exist for selector: ${selector}`)
		}
		element.click()
	}

	@Spec('Finds the visible node element that matches one exact node name in the nested File Manager shadow root.')
	private static findNodeByName(app: App, nodeName: string): HTMLElement | null {
		return this.findAllInFileManager(app, '[data-testid^="file-manager-node-"]').find(node => node.getAttribute('data-node-name') === nodeName) ?? null
	}

	@Spec('Clicks the visible node entry that matches one exact node name.')
	private static clickByNodeName(app: App, nodeName: string): void {
		const node = this.findNodeByName(app, nodeName)
		if (node === null) {
			throw new Error(`Expected node to exist for name: ${nodeName}`)
		}
		node.click()
	}

	@Spec('Double-clicks the visible node entry that matches one exact node name.')
	private static doubleClickByNodeName(app: App, nodeName: string): void {
		const node = this.findNodeByName(app, nodeName)
		if (node === null) {
			throw new Error(`Expected node to exist for name: ${nodeName}`)
		}
		node.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
	}

	@Spec('Reads text content from one element in the paired App shadow root.')
	private static readText(app: App, selector: string): string {
		const element = this.find(app, selector)
		if (element === null) {
			throw new Error(`Expected text element to exist for selector: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Reads the visible outer shell window title for one app.')
	private static readWindowTitle(app: App, appId: string): string {
		return this.readText(app, `[data-testid="window-${appId}"] .window-title div div`)
	}

	@Spec('Reads the current Text Editor textarea value from the nested Text Editor shadow root.')
	private static readTextAreaValue(app: App): string {
		const textarea = this.findInTextEditor(app, '[data-testid="text-editor-textarea"]')
		if (!(textarea instanceof HTMLTextAreaElement)) {
			throw new Error('Expected text editor textarea to exist')
		}
		return textarea.value
	}

	@Spec('Closes and reopens the File Manager window to simulate a fresh relaunch against persisted shared VFS state.')
	private static async closeAndReopenFileManagerAtDocuments(app: App, waitFor: WaitForFn): Promise<void> {
		this.click(app, '[data-testid="close-file-manager"]')
		this.click(app, '[data-testid="dock-app-file-manager"]')
		await waitFor(() => this.find(app, '[data-testid="window-file-manager"]') !== null, 'Expected File Manager to reopen from the dock')
		await this.waitForFileManager(app, waitFor)
		this.clickInFileManager(app, '[data-testid="file-manager-sidebar-Documents"]')
		await waitFor(() => this.readTextInFileManager(app, '[data-testid="file-manager-current-folder"]') === 'Documents', 'Expected Documents to be restored before reopening the file')
	}

	@Spec('Finds one element inside the nested File Manager shadow root by selector.')
	private static findInFileManager(app: App, selector: string): HTMLElement | null {
		const fileManager = this.find(app, 'iva-file-manager-view')
		return fileManager?.shadowRoot?.querySelector<HTMLElement>(selector) ?? null
	}

	@Spec('Finds all matching elements inside the nested File Manager shadow root by selector.')
	private static findAllInFileManager(app: App, selector: string): HTMLElement[] {
		const fileManager = this.find(app, 'iva-file-manager-view')
		return Array.from(fileManager?.shadowRoot?.querySelectorAll<HTMLElement>(selector) ?? [])
	}

	@Spec('Clicks one element inside the nested File Manager shadow root by selector.')
	private static clickInFileManager(app: App, selector: string): void {
		const element = this.findInFileManager(app, selector)
		if (element === null) {
			throw new Error(`Expected File Manager element to exist for selector: ${selector}`)
		}
		element.click()
	}

	@Spec('Reads text content from one element inside the nested File Manager shadow root.')
	private static readTextInFileManager(app: App, selector: string): string {
		const element = this.findInFileManager(app, selector)
		if (element === null) {
			throw new Error(`Expected File Manager text element to exist for selector: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Finds one element inside the nested Text Editor shadow root by selector.')
	private static findInTextEditor(app: App, selector: string): HTMLElement | null {
		const textEditor = this.find(app, 'iva-text-editor-view')
		return textEditor?.shadowRoot?.querySelector<HTMLElement>(selector) ?? null
	}

	@Spec('Clicks one element inside the nested Text Editor shadow root by selector.')
	private static clickInTextEditor(app: App, selector: string): void {
		const element = this.findInTextEditor(app, selector)
		if (element === null) {
			throw new Error(`Expected Text Editor element to exist for selector: ${selector}`)
		}
		element.click()
	}

	@Spec('Reads text content from one element inside the nested Text Editor shadow root.')
	private static readTextInTextEditor(app: App, selector: string): string {
		const element = this.findInTextEditor(app, selector)
		if (element === null) {
			throw new Error(`Expected Text Editor text element to exist for selector: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Finds one element inside the nested Image Viewer shadow root by selector.')
	private static findInImageViewer(app: App, selector: string): HTMLElement | null {
		const imageViewer = this.find(app, 'iva-image-viewer-view')
		return imageViewer?.shadowRoot?.querySelector<HTMLElement>(selector) ?? null
	}

	@Spec('Finds one element inside the nested Activity Monitor shadow root by selector.')
	private static findInActivityMonitor(app: App, selector: string): HTMLElement | null {
		const activityMonitor = this.find(app, 'iva-activity-monitor-view')
		return activityMonitor?.shadowRoot?.querySelector<HTMLElement>(selector) ?? null
	}

	@Spec('Finds all matching elements inside the nested Activity Monitor shadow root by selector.')
	private static findAllInActivityMonitor(app: App, selector: string): HTMLElement[] {
		const activityMonitor = this.find(app, 'iva-activity-monitor-view')
		return Array.from(activityMonitor?.shadowRoot?.querySelectorAll<HTMLElement>(selector) ?? [])
	}

	@Spec('Clicks one element inside the nested Activity Monitor shadow root by selector.')
	private static clickInActivityMonitor(app: App, selector: string): void {
		const element = this.findInActivityMonitor(app, selector)
		if (element === null) {
			throw new Error(`Expected Activity Monitor element to exist for selector: ${selector}`)
		}
		element.click()
	}

	@Spec('Reads text content from one element inside the nested Activity Monitor shadow root.')
	private static readTextInActivityMonitor(app: App, selector: string): string {
		const element = this.findInActivityMonitor(app, selector)
		if (element === null) {
			throw new Error(`Expected Activity Monitor text element to exist for selector: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Reads text content from one element inside the nested Image Viewer shadow root.')
	private static readTextInImageViewer(app: App, selector: string): string {
		const element = this.findInImageViewer(app, selector)
		if (element === null) {
			throw new Error(`Expected Image Viewer text element to exist for selector: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Reads a numeric pixel offset from an inline style declaration.')
	private static readPixelOffset(element: HTMLElement, propertyName: 'left' | 'top'): number {
		const inlineValue = element.style.getPropertyValue(propertyName)
		return Number.parseFloat(inlineValue.replace('px', ''))
	}

	@Spec('Reads a numeric pixel width or height from an inline style declaration.')
	private static readPixelSize(element: HTMLElement, propertyName: 'width' | 'height'): number {
		const inlineValue = element.style.getPropertyValue(propertyName)
		return Number.parseFloat(inlineValue.replace('px', ''))
	}

	@Spec('Clears dedicated shell and VFS storage keys used by App behavioral tests.')
	private static resetShellStorage(): void {
		window.localStorage.removeItem('lll.settings.v1')
		window.localStorage.removeItem('ivaos-shell-preferences')
		window.localStorage.removeItem('iva.vfs.v1')
		window.localStorage.removeItem('iva.vfs.v2')
		const nodeKeysToRemove: string[] = []
		for (let index = 0; index < window.localStorage.length; index += 1) {
			const key = window.localStorage.key(index)
			if (typeof key === 'string' && key.startsWith('iva.node-')) {
				nodeKeysToRemove.push(key)
			}
		}
		for (const nodeKey of nodeKeysToRemove) {
			window.localStorage.removeItem(nodeKey)
		}
	}
}
