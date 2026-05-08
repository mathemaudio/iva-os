import { Spec } from '@shared/lll.lll'
import type { PlatformContract } from './PlatformContract.lll'

@Spec('Builds app-facing platform application contexts for shell window sessions.')
export class PlatformContextFactory {
	@Spec('Creates one application context that exposes stable platform services plus the current window session.')
	public static createApplicationContext(
		appId: string,
		openedNodeId: string | null,
		sourceFolderId: string | null,
		filesystem: PlatformContract['FileSystemService'],
		settings: PlatformContract['SettingsService'],
		launcher: PlatformContract['LauncherService'],
		runtime: PlatformContract['RuntimeService'],
		onTitleChange: (title: string) => void,
		onOpenedNodeIdChange: (nodeId: string | null) => void
	): PlatformContract['ApplicationContext'] {
		return {
			appId,
			filesystem,
			settings,
			launcher,
			runtime,
			window: {
				openedNodeId,
				sourceFolderId,
				setTitle(title: string): void {
					onTitleChange(title)
				},
				setOpenedNodeId(nodeId: string | null): void {
					onOpenedNodeIdChange(nodeId)
				}
			}
		}
	}
}
