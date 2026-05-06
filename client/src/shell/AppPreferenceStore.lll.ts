import { Spec } from '@shared/lll.lll'

@Spec('Encapsulates shell preference storage keys plus persisted shell appearance reads and writes for the App host.')
export class AppPreferenceStore {
	public static readonly legacyPreferencesStorageKey = 'ivaos-shell-preferences'

	public static readonly preferencesStorageKey = 'lll.settings.v1'

	@Spec('Persists one shell theme and wallpaper preference record to localStorage when available.')
	static persistPreferences(activeTheme: string, activeWallpaper: string): void {
		try {
			window.localStorage.setItem(
				AppPreferenceStore.preferencesStorageKey,
				JSON.stringify({
					theme: activeTheme,
					wallpaper: activeWallpaper
				})
			)
		} catch {
			return
		}
	}

	@Spec('Reads persisted shell preferences from current or legacy storage keys and normalizes them into the dark-light model.')
	static readPreferences(): { theme: string, wallpaper: string | null } {
		const currentPreferences = this.readPreferencesFromKey(AppPreferenceStore.preferencesStorageKey)
		if (currentPreferences !== null) {
			return currentPreferences
		}
		const legacyPreferences = this.readPreferencesFromKey(AppPreferenceStore.legacyPreferencesStorageKey)
		if (legacyPreferences !== null) {
			return legacyPreferences
		}
		return { theme: 'dark', wallpaper: null }
	}

	@Spec('Reads and normalizes one shell preference record from a specific storage key when available.')
	private static readPreferencesFromKey(storageKey: string): { theme: string, wallpaper: string | null } | null {
		try {
			const rawPreferences = window.localStorage.getItem(storageKey)
			if (rawPreferences === null) {
				return null
			}
			const parsedPreferences = JSON.parse(rawPreferences)
			const rawTheme = parsedPreferences.theme
			const rawWallpaper = parsedPreferences.wallpaper
			const theme = rawTheme === 'light' || rawTheme === 'sunset'
				? 'light'
				: 'dark'
			const wallpaper = typeof rawWallpaper === 'string' && rawWallpaper.trim() !== '' ? rawWallpaper : null
			return { theme, wallpaper }
		} catch {
			return null
		}
	}
}
