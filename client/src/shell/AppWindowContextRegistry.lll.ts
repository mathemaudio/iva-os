import { Spec } from '@shared/lll.lll'
import type { App } from '../App.lll'
import { PlatformContextFactory } from '../platform/PlatformContextFactory.lll';

import type { PlatformContract } from '../platform/PlatformContract.lll';


@Spec("Provides stable platform application contexts for shell windows so app views are not reset on every shell render.")
export class AppWindowContextRegistry {
	public constructor(private readonly source: App) {
	}

	@Spec('Returns one stable platform application context for the given shell window entry and refreshes its visible session fields.')
	public getWindowPlatformContext(windowEntry: {
		id: number
		appId: string
		openedNodeId: string | null
		sourceFolderId: string | null
	}): PlatformContract['ApplicationContext'] {
			const existingContext = this.source.windowContextsByWindowId.get(windowEntry.id) ?? null
			if (existingContext !== null) {
				existingContext.window.openedNodeId = windowEntry.openedNodeId
				existingContext.window.sourceFolderId = windowEntry.sourceFolderId
				return existingContext
			}
			const nextContext = PlatformContextFactory.createApplicationContext(
				windowEntry.appId,
				windowEntry.openedNodeId,
				windowEntry.sourceFolderId,
				this.source.platformFileSystemService.toContract(),
				this.source.platformSettingsService.toContract(),
				this.source.platformLauncherService.toContract(),
				(title: string) => this.source.onChildWindowTitleChange(windowEntry.id, title),
				(nodeId: string | null) => this.source.onChildWindowNodeChange(windowEntry.id, nodeId)
			)
			this.source.windowContextsByWindowId.set(windowEntry.id, nextContext)
			return nextContext
		}

}
