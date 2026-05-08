import './PlatformAppLauncherService.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { PlatformAppLauncherService } from './PlatformAppLauncherService.lll'

@Spec('Covers the platform app launcher service boundary used by apps to open files and apps.')
export class PlatformAppLauncherServiceTest {
	testType = 'behavioral'

	@Scenario('forwards open-node and open-app requests to the shell-owned launcher handlers')
	static async forwardsLaunchRequests(subjectFactory: SubjectFactory<PlatformAppLauncherService>, scenario: ScenarioParameter): Promise<{ openedNodeId: string | null, openedAppId: string | null, sourceFolderId: string | null }> {
		const assert: AssertFn = scenario.assert
		void subjectFactory
		let openedNodeId: string | null = null
		let openedAppId: string | null = null
		let sourceFolderId: string | null = null
		const launcherService = new PlatformAppLauncherService(
			(nodeId: string, currentFolderId: string | null) => {
				openedNodeId = `${nodeId}:${currentFolderId ?? 'null'}`
			},
			(appId: string, _openedNodeId: string | null, nextSourceFolderId: string | null) => {
				openedAppId = appId
				sourceFolderId = nextSourceFolderId
			}
		)
		launcherService.openNode('node-7', 'folder-3')
		launcherService.openApp('text-editor', 'node-7', 'folder-3')
		assert(openedNodeId === 'node-7:folder-3', 'Expected openNode to delegate through the platform launcher service')
		assert(openedAppId === 'text-editor', 'Expected openApp to delegate through the platform launcher service')
		assert(sourceFolderId === 'folder-3', 'Expected openApp to preserve the source folder id')
		return { openedNodeId, openedAppId, sourceFolderId }
	}
}
