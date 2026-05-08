import { Spec } from '@shared/lll.lll'
import type { PlatformContract } from './PlatformContract.lll'

@Spec('Provides the app-facing launching boundary for opening files and applications through the shell platform.')
export class PlatformAppLauncherService {
	constructor(
		private readonly onOpenNode: (nodeId: string, currentFolderId: string | null) => void,
		private readonly onOpenApp: (appId: string, openedNodeId: string | null, sourceFolderId: string | null) => void
	) {
		Spec('Wraps shell-managed launching behavior behind the stable platform launcher contract.')
	}

	@Spec('Opens one node through the shell-managed platform launcher flow.')
	public openNode(nodeId: string, currentFolderId: string | null): void {
		this.onOpenNode(nodeId, currentFolderId)
	}

	@Spec('Opens one application through the shell-managed platform launcher flow.')
	public openApp(appId: string, openedNodeId: string | null, sourceFolderId: string | null): void {
		this.onOpenApp(appId, openedNodeId, sourceFolderId)
	}

	@Spec('Returns this wrapper as the stable platform launcher contract shape for app consumption.')
	public toContract(): PlatformContract['LauncherService'] {
		return this
	}
}
