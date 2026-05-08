import { Spec } from '@shared/lll.lll'
import type { PlatformContract } from './PlatformContract.lll'

@Spec('Provides the app-facing settings service boundary for shell appearance state and wallpaper choices.')
export class PlatformSettingsService {
	private readonly listeners = new Set<(snapshot: PlatformContract['SettingsSnapshot']) => void>()

	constructor(
		private readonly readSnapshot: () => PlatformContract['SettingsSnapshot'],
		private readonly onSetTheme: (theme: string) => void,
		private readonly onSetWallpaper: (wallpaperId: string) => void
	) {
		Spec('Wraps shell-managed appearance state behind a stable app-facing settings service contract.')
	}

	@Spec('Returns the latest app-visible appearance settings snapshot.')
	public getSnapshot(): PlatformContract['SettingsSnapshot'] {
		return this.readSnapshot()
	}

	@Spec('Subscribes one app listener to future settings snapshot changes.')
	public subscribe(listener: (snapshot: PlatformContract['SettingsSnapshot']) => void): () => void {
		this.listeners.add(listener)
		return () => {
			this.listeners.delete(listener)
		}
	}

	@Spec('Updates the current theme through the app-facing settings boundary and notifies subscribers.')
	public setTheme(theme: string): void {
		this.onSetTheme(theme)
		this.emitChange()
	}

	@Spec('Updates the current wallpaper through the app-facing settings boundary and notifies subscribers.')
	public setWallpaper(wallpaperId: string): void {
		this.onSetWallpaper(wallpaperId)
		this.emitChange()
	}

	@Spec('Notifies subscribed apps that the visible settings snapshot has changed.')
	public emitChange(): void {
		const snapshot = this.getSnapshot()
		for (const listener of this.listeners) {
			listener(snapshot)
		}
	}

	@Spec('Returns this wrapper as the stable platform settings contract shape for app consumption.')
	public toContract(): PlatformContract['SettingsService'] {
		return this
	}
}
