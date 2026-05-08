import './PlatformSettingsService.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { PlatformSettingsService } from './PlatformSettingsService.lll'
import type { PlatformContract } from './PlatformContract.lll'

@Spec('Covers the platform settings service boundary for app-facing appearance state.')
export class PlatformSettingsServiceTest {
	testType = 'behavioral'

	@Scenario('updates theme and wallpaper while notifying subscribers with the latest settings snapshot')
	static async updatesAndEmitsSettingsSnapshots(subjectFactory: SubjectFactory<PlatformSettingsService>, scenario: ScenarioParameter): Promise<{ finalTheme: string, finalWallpaper: string, notificationCount: number }> {
		const assert: AssertFn = scenario.assert
		void subjectFactory
		const state: PlatformContract['SettingsSnapshot'] = {
			theme: 'dark',
			wallpaper: 'aurora',
			wallpaperChoices: [{ id: 'aurora', label: 'Aurora' }, { id: 'grid', label: 'Grid' }]
		}
		const snapshots: PlatformContract['SettingsSnapshot'][] = []
		const settingsService = new PlatformSettingsService(
			() => state,
			(theme: string) => {
				state.theme = theme === 'light' ? 'light' : 'dark'
			},
			(wallpaperId: string) => {
				state.wallpaper = wallpaperId
			}
		)
		settingsService.subscribe(snapshot => {
			snapshots.push({ ...snapshot, wallpaperChoices: [...snapshot.wallpaperChoices] })
		})
		settingsService.setTheme('light')
		settingsService.setWallpaper('grid')
		assert(state.theme === 'light', 'Expected setTheme to update the backing state through the platform settings service')
		assert(state.wallpaper === 'grid', 'Expected setWallpaper to update the backing state through the platform settings service')
		assert(snapshots.length === 2, 'Expected settings subscribers to receive one notification per change')
		return { finalTheme: state.theme, finalWallpaper: state.wallpaper, notificationCount: snapshots.length }
	}
}
