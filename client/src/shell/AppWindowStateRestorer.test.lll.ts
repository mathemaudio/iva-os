import './AppWindowStateRestorer.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { App } from '../App.lll'
import { AppWindowStateStore } from './AppWindowStateStore.lll'
import { AppWindowStateRestorer } from './AppWindowStateRestorer.lll'

@Spec('Covers restoring persisted shell windows into the live App host state.')
export class AppWindowStateRestorerTest {
	testType = 'unit'

	@Scenario('restores persisted windows and normalizes missing file-manager folders back to the VFS root')
	static async restoresPersistedWindowsIntoAppState(subjectFactory: SubjectFactory<AppWindowStateRestorer>, scenario: ScenarioParameter): Promise<{ restoredWindowCount: number, restoredNextWindowId: number, launcherOpen: boolean }> {
		const resolvedScenario = scenario ?? subjectFactory as unknown as ScenarioParameter
		const assert: AssertFn = resolvedScenario.assert
		window.localStorage.removeItem('iva.window-state.v1')
		const app = new App()
		const rootId = app.vfsSnapshot.schema.rootId
		AppWindowStateStore.persistWindowState({
			isLauncherOpen: true,
			nextWindowId: 8,
			windows: [{
				id: 3,
				appId: 'file-manager',
				title: 'Old title',
				icon: '📁',
				description: 'Browse files',
				left: 70,
				top: 55,
				width: 700,
				height: 520,
				isMinimized: false,
				isMaximized: false,
				zIndex: 4,
				openedNodeId: 'missing-folder-id',
				sourceFolderId: null,
				startedAt: '2025-01-01T00:00:00.000Z'
			}]
		})
		const restorer = new AppWindowStateRestorer(app)
		restorer.restoreWindowState()
		assert(app.windows.length === 1, 'Expected one persisted window to be restored into App state')
		assert(app.windows[0]?.openedNodeId === rootId, 'Expected missing file-manager folders to normalize back to the VFS root')
		assert(app.nextWindowId === 8, 'Expected restored next window id to preserve the larger persisted identifier')
		assert(app.isLauncherOpen === true, 'Expected launcher openness to restore into App state')
		return { restoredWindowCount: app.windows.length, restoredNextWindowId: app.nextWindowId, launcherOpen: app.isLauncherOpen }
	}
}
