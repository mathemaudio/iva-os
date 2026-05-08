import { Spec } from '@shared/lll.lll'
import { PlatformAppLauncherService } from './PlatformAppLauncherService.lll'
import { PlatformContextFactory } from './PlatformContextFactory.lll'
import { PlatformFileSystemService } from './PlatformFileSystemService.lll'
import { PlatformSettingsService } from './PlatformSettingsService.lll'
import type { PlatformContract } from './PlatformContract.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

@Spec('Builds isolated platform application contexts for deterministic app view tests.')
export class PlatformTestContextFactory {
	@Spec('Creates one app-facing application context backed by isolated in-memory platform services for tests.')
	public static createApplicationContext(
		appId: string,
		storage: VirtualFileSystemContract['StorageLike'],
		openedNodeId: string | null,
		sourceFolderId: string | null,
		onSetTitle?: (title: string) => void,
		onSetOpenedNodeId?: (nodeId: string | null) => void
	): { context: PlatformContract['ApplicationContext'], virtualFileSystemService: VirtualFileSystemService, settingsService: PlatformSettingsService } {
		const virtualFileSystemService = new VirtualFileSystemService(storage)
		virtualFileSystemService.load()
		return this.createApplicationContextFromVirtualFileSystemService(
			appId,
			virtualFileSystemService,
			openedNodeId,
			sourceFolderId,
			onSetTitle,
			onSetOpenedNodeId
		)
	}

	@Spec('Creates one app-facing application context that reuses an existing virtual filesystem service instance for tests.')
	public static createApplicationContextFromVirtualFileSystemService(
		appId: string,
		virtualFileSystemService: VirtualFileSystemService,
		openedNodeId: string | null,
		sourceFolderId: string | null,
		onSetTitle?: (title: string) => void,
		onSetOpenedNodeId?: (nodeId: string | null) => void
	): { context: PlatformContract['ApplicationContext'], virtualFileSystemService: VirtualFileSystemService, settingsService: PlatformSettingsService } {
		const filesystemService = new PlatformFileSystemService(virtualFileSystemService)
		const settingsState = {
			theme: 'dark',
			wallpaper: 'aurora',
			wallpaperChoices: [
				{ id: 'aurora', label: 'Aurora' },
				{ id: 'grid', label: 'Grid' }
			]
		}
		const settingsService = new PlatformSettingsService(
			() => settingsState,
			(theme: string) => {
				settingsState.theme = theme === 'light' ? 'light' : 'dark'
			},
			(wallpaperId: string) => {
				settingsState.wallpaper = wallpaperId
			}
		)
		const launcherService = new PlatformAppLauncherService(
			() => undefined,
			() => undefined
		)
		const context = PlatformContextFactory.createApplicationContext(
			appId,
			openedNodeId,
			sourceFolderId,
			filesystemService.toContract(),
			settingsService.toContract(),
			launcherService.toContract(),
			(title: string) => {
				onSetTitle?.(title)
			},
			(nodeId: string | null) => {
				onSetOpenedNodeId?.(nodeId)
			}
		)
		return { context, virtualFileSystemService, settingsService }
	}
}
