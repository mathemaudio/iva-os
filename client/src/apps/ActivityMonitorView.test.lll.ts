import './ActivityMonitorView.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { ActivityMonitorView } from './ActivityMonitorView.lll'
import { PlatformAppLauncherService } from '../platform/PlatformAppLauncherService.lll'
import type { PlatformContract } from '../platform/PlatformContract.lll'
import { PlatformFileSystemService } from '../platform/PlatformFileSystemService.lll'
import { PlatformRuntimeService } from '../platform/runtime/PlatformRuntimeService.lll'
import { PlatformSettingsService } from '../platform/PlatformSettingsService.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

@Spec('Exercises the Activity Monitor tabs through observable runtime-monitor content.')
export class ActivityMonitorViewTest {
	testType = 'behavioral'

	@Scenario('renders running apps, switches to signals and runtime stats, and omits CPU or thread metrics')
	static async rendersTabsAndRuntimeData(subjectFactory: SubjectFactory<ActivityMonitorView>, scenario: ScenarioParameter): Promise<{ runningApps: number, eventCount: number, hasRuntimeStats: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const view = await subjectFactory()
		view.platformContext = this.createPlatformContext()
		await waitFor(() => view.shadowRoot !== null, 'Expected Activity Monitor shadow DOM to render')
		await view.updateComplete
		const runningAppsPanel = this.find(view, '[data-testid="activity-monitor-running-apps-panel"]')
		const runningApps = view.shadowRoot?.querySelectorAll('[data-testid^="activity-monitor-running-app-"]').length ?? 0
		assert(runningAppsPanel !== null, 'Expected the running apps tab to render first')
		assert(runningApps >= 2, 'Expected the running apps tab to list the supplied runtime windows')
		this.click(view, '[data-testid="activity-monitor-tab-signals-events"]')
		await view.updateComplete
		const eventCount = view.shadowRoot?.querySelectorAll('[data-testid^="activity-monitor-event-"]').length ?? 0
		assert(eventCount >= 1, 'Expected the signals and events tab to render recorded runtime events')
		this.click(view, '[data-testid="activity-monitor-tab-runtime-stats"]')
		await view.updateComplete
		const runtimeStatsPanel = this.find(view, '[data-testid="activity-monitor-runtime-stats-panel"]')
		const panelText = runtimeStatsPanel?.textContent?.toLowerCase() ?? ''
		const hasRuntimeStats = this.find(view, '[data-testid="activity-monitor-stat-memory"]') !== null
		assert(runtimeStatsPanel !== null, 'Expected the runtime stats tab to render a metrics panel')
		assert(hasRuntimeStats, 'Expected the runtime stats tab to render the memory metric card')
		assert(panelText.includes('cpu') === false, 'Expected runtime stats to omit CPU load in the browser-hosted monitor')
		assert(panelText.includes('thread') === false, 'Expected runtime stats to omit thread counts in the browser-hosted monitor')
		return { runningApps, eventCount, hasRuntimeStats }
	}

	@Spec('Builds one representative platform context with runtime data for Activity Monitor behavior tests.')
	private static createPlatformContext(): PlatformContract['ApplicationContext'] {
		const virtualFileSystemService = new VirtualFileSystemService(null)
		virtualFileSystemService.load()
		const filesystemService = new PlatformFileSystemService(virtualFileSystemService)
		const settingsService = new PlatformSettingsService(
			() => ({ theme: 'dark', wallpaper: 'aurora', wallpaperChoices: [{ id: 'aurora', label: 'Aurora' }] }),
			() => undefined,
			() => undefined
		)
		const runtimeService = new PlatformRuntimeService(() => ({
			runningApps: [
				{
					windowId: 1,
					appId: 'file-manager',
					appName: 'File Manager',
					title: 'Home — File Manager',
					icon: '🗂️',
					isFocused: false,
					isMinimized: false,
					startedAt: new Date(Date.now() - 30_000).toISOString(),
					runningForMs: 0
				},
				{
					windowId: 2,
					appId: 'activity-monitor',
					appName: 'Activity Monitor',
					title: 'Activity Monitor',
					icon: '📈',
					isFocused: true,
					isMinimized: false,
					startedAt: new Date(Date.now() - 5_000).toISOString(),
					runningForMs: 0
				}
			],
			vfsSnapshot: virtualFileSystemService.getSnapshot()
		}))
		runtimeService.recordEvent('incoming', 'launcher', 'Opened app', 'Activity Monitor')
		const launcherService = new PlatformAppLauncherService(() => undefined, () => undefined)
		return {
			appId: 'activity-monitor',
			filesystem: filesystemService.toContract(),
			settings: settingsService.toContract(),
			launcher: launcherService.toContract(),
			runtime: runtimeService.toContract(),
			window: {
				openedNodeId: null,
				sourceFolderId: null,
				setTitle(): void {
					return
				},
				setOpenedNodeId(): void {
					return
				}
			}
		}
	}

	@Spec('Finds one element in the Activity Monitor shadow root by selector.')
	private static find(view: ActivityMonitorView, selector: string): HTMLElement | null {
		return view.shadowRoot?.querySelector<HTMLElement>(selector) ?? null
	}

	@Spec('Clicks one element in the Activity Monitor shadow root by selector.')
	private static click(view: ActivityMonitorView, selector: string): void {
		const element = this.find(view, selector)
		if (element === null) {
			throw new Error(`Expected Activity Monitor element to exist for selector: ${selector}`)
		}
		element.click()
	}
}
