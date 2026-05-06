import './AppPreferenceStore.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { AppPreferenceStore } from './AppPreferenceStore.lll'

@Spec('Covers shell preference persistence and normalization for the App host.')
export class AppPreferenceStoreTest {
	testType = 'unit'

	@Scenario('persists and reads current shell preferences from the primary storage key')
	static async persistsAndReadsCurrentPreferences(scenario: ScenarioParameter): Promise<{ storedTheme: string, storedWallpaper: string | null }> {
		const assert: AssertFn = scenario.assert
		window.localStorage.removeItem('lll.settings.v1')
		window.localStorage.removeItem('ivaos-shell-preferences')
		AppPreferenceStore.persistPreferences('light', 'grid')
		const preferences = AppPreferenceStore.readPreferences()
		assert(preferences.theme === 'light', 'Expected current preferences to read back the stored light theme')
		assert(preferences.wallpaper === 'grid', 'Expected current preferences to read back the stored wallpaper id')
		return { storedTheme: preferences.theme, storedWallpaper: preferences.wallpaper }
	}

	@Scenario('falls back from legacy theme values into the simplified dark-light model')
	static async normalizesLegacyPreferences(scenario: ScenarioParameter): Promise<{ normalizedTheme: string, normalizedWallpaper: string | null }> {
		const assert: AssertFn = scenario.assert
		window.localStorage.removeItem('lll.settings.v1')
		window.localStorage.setItem('ivaos-shell-preferences', JSON.stringify({ theme: 'sunset', wallpaper: 'aurora' }))
		const preferences = AppPreferenceStore.readPreferences()
		assert(preferences.theme === 'light', 'Expected legacy sunset theme to normalize into light mode')
		assert(preferences.wallpaper === 'aurora', 'Expected legacy wallpaper to remain readable during migration')
		return { normalizedTheme: preferences.theme, normalizedWallpaper: preferences.wallpaper }
	}
}
