import './SettingsView.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { SettingsView } from './SettingsView.lll'
import { PlatformTestContextFactory } from '../platform/PlatformTestContextFactory.lll'

@Spec('Exercises the platform-backed Settings app through observable theme and wallpaper controls.')
export class SettingsViewTest {
	testType = 'behavioral'

	@Scenario('renders settings from the platform context and updates theme and wallpaper through the settings service')
	static async rendersAndUpdatesSettings(subjectFactory: SubjectFactory<SettingsView>, scenario: ScenarioParameter): Promise<{ theme: string, wallpaper: string, hasThemeSelect: boolean, hasWallpaperSelect: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const settingsView = await subjectFactory()
		const context = PlatformTestContextFactory.createApplicationContext('settings', this.createMemoryStorage(), null, null)
		settingsView.platformContext = context.context
		await waitFor(() => settingsView.shadowRoot !== null, 'Expected SettingsView shadow DOM to render')
		await settingsView.updateComplete
		const themeSelect = this.find(settingsView, '[data-testid="theme-select"]')
		const wallpaperSelect = this.find(settingsView, '[data-testid="wallpaper-select"]')
		assert(themeSelect instanceof HTMLSelectElement, 'Expected the theme select to render from the platform context')
		assert(wallpaperSelect instanceof HTMLSelectElement, 'Expected the wallpaper select to render from the platform context')
		themeSelect.value = 'light'
		themeSelect.dispatchEvent(new Event('change', { bubbles: true }))
		wallpaperSelect.value = 'grid'
		wallpaperSelect.dispatchEvent(new Event('change', { bubbles: true }))
		await settingsView.updateComplete
		const snapshot = context.settingsService.getSnapshot()
		assert(snapshot.theme === 'light', 'Expected the settings service to receive the updated theme')
		assert(snapshot.wallpaper === 'grid', 'Expected the settings service to receive the updated wallpaper')
		return {
			theme: snapshot.theme,
			wallpaper: snapshot.wallpaper,
			hasThemeSelect: themeSelect instanceof HTMLSelectElement,
			hasWallpaperSelect: wallpaperSelect instanceof HTMLSelectElement
		}
	}

	@Spec('Finds one element in the SettingsView shadow root by selector.')
	private static find(settingsView: SettingsView, selector: string): HTMLElement | null {
		return settingsView.shadowRoot?.querySelector<HTMLElement>(selector) ?? null
	}

	@Spec('Builds an isolated in-memory storage adapter for SettingsView behavior tests.')
	private static createMemoryStorage(): { getItem: (key: string) => string | null, setItem: (key: string, value: string) => void, removeItem: (key: string) => void } {
		const valuesByKey: Record<string, string> = {}
		return {
			getItem(key: string): string | null {
				return key in valuesByKey ? valuesByKey[key] : null
			},
			setItem(key: string, value: string): void {
				valuesByKey[key] = value
			},
			removeItem(key: string): void {
				delete valuesByKey[key]
			}
		}
	}
}
