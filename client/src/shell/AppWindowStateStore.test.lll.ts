import './AppWindowStateStore.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { AppWindowStateStore } from './AppWindowStateStore.lll'

@Spec('Covers shell window-state storage reads and writes.')
export class AppWindowStateStoreTest {
	testType = 'unit'

	@Scenario('persists and restores one shell window-state snapshot through the dedicated storage key')
	static async persistsAndReadsWindowState(scenario: ScenarioParameter): Promise<{ windowCount: number, nextWindowId: number, isLauncherOpen: boolean }> {
		const assert: AssertFn = scenario.assert
		window.localStorage.removeItem('iva.window-state.v1')
		AppWindowStateStore.persistWindowState({
			isLauncherOpen: true,
			nextWindowId: 4,
			windows: [{
				id: 2,
				appId: 'text-editor',
				title: 'Text Editor',
				icon: '📝',
				description: 'Edit files',
				left: 120,
				top: 90,
				width: 640,
				height: 480,
				isMinimized: true,
				isMaximized: false,
				zIndex: 3,
				openedNodeId: 'node-1',
				sourceFolderId: 'folder-1',
				startedAt: '2025-01-01T00:00:00.000Z'
			}]
		})
		const restoredState = AppWindowStateStore.readWindowState()
		assert(restoredState !== null, 'Expected persisted window state to be readable')
		assert(restoredState?.isLauncherOpen === true, 'Expected launcher openness to persist')
		assert(restoredState?.nextWindowId === 4, 'Expected next window identifier to persist')
		assert(restoredState?.windows.length === 1, 'Expected one persisted window to be restored')
		assert(restoredState?.windows[0]?.width === 640, 'Expected window width to persist')
		return { windowCount: restoredState?.windows.length ?? 0, nextWindowId: restoredState?.nextWindowId ?? 0, isLauncherOpen: restoredState?.isLauncherOpen ?? false }
	}
}
