import { Spec } from '@shared/lll.lll'
import type { App } from '../App.lll'
import { AppWindowPresentation } from './AppWindowPresentation.lll';

import { AppWindowStateStore } from './AppWindowStateStore.lll';


@Spec("Restores persisted shell window snapshots into live window entries against the current VFS and app catalog.")
export class AppWindowStateRestorer {
	public constructor(private readonly source: App) {
	}

	@Spec('Resolves one restored File Manager folder target and falls back to the VFS root when needed.')
	public resolveRestoredFileManagerNodeId(nodeId: string | null): string {
			const restoredNodeId = this.resolveRestoredNodeId(nodeId)
			const restoredNode = restoredNodeId === null ? null : this.source.vfsSnapshot.schema.nodesById[restoredNodeId] ?? null
			return restoredNode?.kind === 'folder' ? restoredNode.id : this.source.vfsSnapshot.schema.rootId
		}


	@Spec('Resolves one restored node identifier only when that VFS node still exists.')
	public resolveRestoredNodeId(nodeId: string | null): string | null {
			if (nodeId === null) {
				return null
			}
			return this.source.vfsSnapshot.schema.nodesById[nodeId] === undefined ? null : nodeId
		}


	@Spec('Restores persisted shell window state from local storage when the saved apps still exist in the catalog.')
	public restoreWindowState(): void {
			const storedWindowState = AppWindowStateStore.readWindowState()
			if (storedWindowState === null) {
				return
			}
			const restoredWindows = storedWindowState.windows.flatMap(windowEntry => {
				const appDefinition = this.source.appWindowCatalog.availableApps.find(candidate => candidate.id === windowEntry.appId)
				if (appDefinition === undefined) {
					return []
				}
				const restoredOpenedNodeId = windowEntry.appId === 'file-manager'
					? this.resolveRestoredFileManagerNodeId(windowEntry.openedNodeId)
					: this.resolveRestoredNodeId(windowEntry.openedNodeId)
				const restoredSourceFolderId = this.resolveRestoredNodeId(windowEntry.sourceFolderId)
				return [{
					id: windowEntry.id,
					appId: windowEntry.appId,
					title: AppWindowPresentation.buildWindowTitle(this.source.appWindowCatalog.availableApps, this.source.vfsSnapshot, windowEntry.appId, restoredOpenedNodeId),
					icon: appDefinition.icon,
					description: appDefinition.description,
					left: windowEntry.left,
					top: windowEntry.top,
					width: windowEntry.width,
					height: windowEntry.height,
					isMinimized: windowEntry.isMinimized,
					isMaximized: windowEntry.isMaximized,
					zIndex: windowEntry.zIndex,
					openedNodeId: restoredOpenedNodeId,
					sourceFolderId: restoredSourceFolderId,
					startedAt: windowEntry.startedAt
				}]
			})
			this.source.windows = restoredWindows
			this.source.isLauncherOpen = storedWindowState.isLauncherOpen
			this.source.nextWindowId = this.source.calculateNextWindowIdFromState(restoredWindows, storedWindowState.nextWindowId)
			this.source.persistWindowState()
		}

}
