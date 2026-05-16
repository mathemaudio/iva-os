import './AppWindowFocusController.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { App } from '../../App.lll'
import { AppWindowFocusController } from './AppWindowFocusController.lll'

@Spec('Covers shell window focus and minimized-window restoration helpers.')
export class AppWindowFocusControllerTest {
	testType = 'unit'

	@Scenario('focuses and restores shell windows while updating z-order and minimized state')
	static async focusesAndRestoresWindows(subjectFactory: SubjectFactory<AppWindowFocusController>, scenario: ScenarioParameter): Promise<{ focusedZIndex: number, restoredMinimized: boolean }> {
		const resolvedScenario = scenario ?? subjectFactory as unknown as ScenarioParameter
		const assert: AssertFn = resolvedScenario.assert
		window.localStorage.removeItem('iva.window-state.v1')
		const app = new App()
		app.windows = [
			{
				id: 1,
				appId: 'file-manager',
				title: 'File Manager',
				icon: '📁',
				description: 'Browse files',
				left: 40,
				top: 42,
				width: 720,
				height: 520,
				isMinimized: false,
				isMaximized: false,
				zIndex: 1,
				openedNodeId: app.vfsSnapshot.schema.rootId,
				sourceFolderId: null,
				startedAt: '2025-01-01T00:00:00.000Z'
			},
			{
				id: 2,
				appId: 'settings',
				title: 'Settings',
				icon: '⚙️',
				description: 'Change preferences',
				left: 60,
				top: 60,
				width: 520,
				height: 420,
				isMinimized: false,
				isMaximized: false,
				zIndex: 2,
				openedNodeId: null,
				sourceFolderId: null,
				startedAt: '2025-01-01T00:00:30.000Z'
			},
			{
				id: 3,
				appId: 'text-editor',
				title: 'Text Editor',
				icon: '📝',
				description: 'Edit files',
				left: 80,
				top: 70,
				width: 640,
				height: 480,
				isMinimized: true,
				isMaximized: false,
				zIndex: 3,
				openedNodeId: null,
				sourceFolderId: null,
				startedAt: '2025-01-01T00:01:00.000Z'
			}
		]
		const controller = new AppWindowFocusController(app)
		controller.focusWindow(1)
		const focusedWindow = app.windows.find(windowEntry => windowEntry.id === 1) ?? null
		controller.restoreAndFocusWindow(3)
		const restoredWindow = app.windows.find(windowEntry => windowEntry.id === 3) ?? null
		assert(focusedWindow !== null && focusedWindow.zIndex > 3, 'Expected focusing to raise the target window above the current z-order')
		assert(restoredWindow !== null && restoredWindow.isMinimized === false, 'Expected restoring to unminimize the target window')
		assert(app.getFocusedWindowId() === 3, 'Expected the restored window to become focused after restore')
		return { focusedZIndex: focusedWindow?.zIndex ?? 0, restoredMinimized: restoredWindow?.isMinimized ?? true }
	}
}
