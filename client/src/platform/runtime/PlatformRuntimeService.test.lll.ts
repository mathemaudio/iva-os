import './PlatformRuntimeService.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { PlatformRuntimeService } from './PlatformRuntimeService.lll'
import { VirtualFileSystemService } from '../../vfs/VirtualFileSystemService.lll'

@Spec('Covers runtime-monitor snapshots and event recording for the app-facing platform runtime service.')
export class PlatformRuntimeServiceTest {
	testType = 'behavioral'

	@Scenario('records runtime events and derives running-app plus storage stats from the current shell state')
	static async recordsEventsAndBuildsSnapshot(subjectFactory: SubjectFactory<PlatformRuntimeService>, scenario: ScenarioParameter): Promise<{ runningAppCount: number, eventCount: number, windowCount: number, hasVfsNodes: boolean }> {
		void subjectFactory
		const assert: AssertFn = scenario.assert
		const virtualFileSystemService = new VirtualFileSystemService(null)
		const vfsSnapshot = virtualFileSystemService.load()
		const runtimeService = new PlatformRuntimeService(() => ({
			runningApps: [
				{
					windowId: 1,
					appId: 'file-manager',
					appName: 'File Manager',
					title: 'Home — File Manager',
					icon: '🗂️',
					isFocused: true,
					isMinimized: false,
					startedAt: new Date(Date.now() - 4_000).toISOString(),
					runningForMs: 0
				}
			],
			vfsSnapshot
		}))
		let emittedEventCount = 0
		runtimeService.subscribe(snapshot => {
			emittedEventCount = snapshot.events.length
		})
		runtimeService.recordEvent('incoming', 'launcher', 'Opened app', 'Activity Monitor')
		const snapshot = runtimeService.getSnapshot()
		assert(snapshot.runningApps.length === 1, 'Expected one running app in the runtime snapshot')
		assert(snapshot.runningApps[0].runningForMs >= 4_000, 'Expected running duration to be derived from the app start time')
		assert(snapshot.events.length === 1, 'Expected one recorded runtime event in the snapshot')
		assert(emittedEventCount === 1, 'Expected subscribers to receive the updated runtime event stream')
		assert(snapshot.stats.windowCount === 1, 'Expected window count to match the running app list')
		assert(snapshot.stats.vfsNodeCount > 0, 'Expected the seeded virtual filesystem to contribute visible runtime stats')
		return {
			runningAppCount: snapshot.runningApps.length,
			eventCount: snapshot.events.length,
			windowCount: snapshot.stats.windowCount,
			hasVfsNodes: snapshot.stats.vfsNodeCount > 0
		}
	}
}
