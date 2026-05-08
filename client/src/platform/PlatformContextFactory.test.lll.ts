import './PlatformContextFactory.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { PlatformContextFactory } from './PlatformContextFactory.lll'
import { PlatformAppLauncherService } from './PlatformAppLauncherService.lll'
import { PlatformFileSystemService } from './PlatformFileSystemService.lll'
import { PlatformSettingsService } from './PlatformSettingsService.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

@Spec('Covers application-context construction for platform-backed app windows.')
export class PlatformContextFactoryTest {
	testType = 'unit'

	@Scenario('builds an application context that exposes stable services and window-session callbacks')
	static async buildsApplicationContext(scenario: ScenarioParameter): Promise<{ appId: string, title: string, openedNodeId: string | null }> {
		const assert: AssertFn = scenario.assert
		const virtualFileSystemService = new VirtualFileSystemService(null)
		virtualFileSystemService.load()
		const filesystemService = new PlatformFileSystemService(virtualFileSystemService)
		const settingsService = new PlatformSettingsService(
			() => ({ theme: 'dark', wallpaper: 'aurora', wallpaperChoices: [{ id: 'aurora', label: 'Aurora' }] }),
			() => undefined,
			() => undefined
		)
		const launcherService = new PlatformAppLauncherService(() => undefined, () => undefined)
		let title = ''
		let openedNodeId: string | null = null
		const context = PlatformContextFactory.createApplicationContext(
			'text-editor',
			'node-1',
			'folder-2',
			filesystemService.toContract(),
			settingsService.toContract(),
			launcherService.toContract(),
			(nextTitle: string) => {
				title = nextTitle
			},
			(nodeId: string | null) => {
				openedNodeId = nodeId
			}
		)
		context.window.setTitle('README.txt')
		context.window.setOpenedNodeId('node-9')
		assert(context.appId === 'text-editor', 'Expected the created context to preserve the app id')
		assert(title === 'README.txt', 'Expected the window title callback to be wired into the context')
		assert(openedNodeId === 'node-9', 'Expected the opened-node callback to be wired into the context')
		return { appId: context.appId, title, openedNodeId }
	}
}
