import './App.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { App } from './App.lll'

@Spec('Exercises the Web OS shell through visible UI interactions only.')
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

	@Scenario('changes theme and wallpaper in settings and persists them in local storage')
	static async persistsShellPreferences(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ storedTheme: string, storedWallpaper: string, renderedTheme: string, renderedWallpaper: string }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		this.resetShellStorage()
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		this.click(app, '[data-testid="dock-app-settings"]')
		await waitFor(() => this.find(app, '[data-testid="window-settings"]') !== null, 'Expected settings window to open from the dock')

		const themeSelect = this.find(app, '[data-testid="theme-select"]')
		const wallpaperSelect = this.find(app, '[data-testid="wallpaper-select"]')
		assert(themeSelect instanceof HTMLSelectElement, 'Expected the theme select to render')
		assert(wallpaperSelect instanceof HTMLSelectElement, 'Expected the wallpaper select to render')

		themeSelect.value = 'sunset'
		themeSelect.dispatchEvent(new Event('change', { bubbles: true }))
		wallpaperSelect.value = 'grid'
		wallpaperSelect.dispatchEvent(new Event('change', { bubbles: true }))
		await app.updateComplete

		const shell = this.find(app, '.shell')
		const storedPreferences = JSON.parse(window.localStorage.getItem('web-os-shell-preferences') ?? '{}')
		const storedTheme = typeof storedPreferences.theme === 'string' ? storedPreferences.theme : ''
		const storedWallpaper = typeof storedPreferences.wallpaper === 'string' ? storedPreferences.wallpaper : ''
		const renderedTheme = shell?.getAttribute('data-theme') ?? ''
		const renderedWallpaper = shell?.getAttribute('data-wallpaper') ?? ''
		assert(storedTheme === 'sunset', 'Expected theme preference to persist as sunset')
		assert(storedWallpaper === 'grid', 'Expected wallpaper preference to persist as grid')
		assert(renderedTheme === 'sunset', 'Expected shell theme attribute to update')
		assert(renderedWallpaper === 'grid', 'Expected shell wallpaper attribute to update')
		return { storedTheme, storedWallpaper, renderedTheme, renderedWallpaper }
	}

	@Spec('Waits until the paired App host has rendered its shadow UI.')
	private static async waitForApp(app: App, waitFor: WaitForFn): Promise<void> {
		await waitFor(() => app.shadowRoot !== null, 'Expected app-root shadow DOM to render')
		await app.updateComplete
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

	@Spec('Clears the dedicated shell preference storage key used by the paired App host.')
	private static resetShellStorage(): void {
		window.localStorage.removeItem('web-os-shell-preferences')
	}
}
