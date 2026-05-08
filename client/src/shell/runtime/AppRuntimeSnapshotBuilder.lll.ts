import { Spec } from '@shared/lll.lll'
import type { App } from '../../App.lll'
import type { PlatformContract } from '../../platform/PlatformContract.lll'
import type { VirtualFileSystemContract } from '../../vfs/VirtualFileSystemContract.lll'

@Spec('Provides runtime-snapshot helpers for the App shell so Activity Monitor data can stay cohesive without inflating the host class.')
export class AppRuntimeSnapshotBuilder {
	public constructor(private readonly source: App) {
	}

	@Spec('Returns the runtime-service source state derived from the current shell windows and shared VFS snapshot.')
	public buildRuntimeState(): { runningApps: PlatformContract['RuntimeRunningApp'][], vfsSnapshot: VirtualFileSystemContract['Snapshot'] } {
		const focusedWindowId = this.source.getFocusedWindowId()
		return {
			runningApps: this.source.windows.map(windowEntry => ({
				windowId: windowEntry.id,
				appId: windowEntry.appId,
				appName: this.readAppName(windowEntry.appId),
				title: windowEntry.title,
				icon: windowEntry.icon,
				isFocused: focusedWindowId === windowEntry.id,
				isMinimized: windowEntry.isMinimized,
				startedAt: windowEntry.startedAt,
				runningForMs: 0
			})),
			vfsSnapshot: this.source.vfsSnapshot
		}
	}

	@Spec('Returns the current user-facing app name for one app identifier from the shell catalog.')
	public readAppName(appId: string): string {
		const appDefinition = this.source.appWindowCatalog.availableApps.find(candidate => candidate.id === appId) ?? null
		return appDefinition?.name ?? appId
	}
}
