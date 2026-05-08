import { Spec } from '@shared/lll.lll'
import type { App } from '../../App.lll'

@Spec('Applies child-window title and opened-node updates back into the App shell while keeping shell host responsibilities compact.')
export class AppChildWindowBridge {
	public constructor(private readonly source: App) {
	}

	@Spec('Accepts child-view active file changes so Save As targets become the new source of truth for that app window.')
	public handleNodeChange(windowId: number, nodeId: string | null): void {
		let changedWindowCount = 0
		const nextWindows = this.source.windows.map(windowEntry => {
			if (windowEntry.id !== windowId) {
				return windowEntry
			}
			const node = nodeId === null ? null : this.source.vfsSnapshot.schema.nodesById[nodeId] ?? null
			const nextSourceFolderId = node?.parentId ?? windowEntry.sourceFolderId
			const nextTitle = node?.kind === 'file' ? node.name : windowEntry.title
			if (
				windowEntry.openedNodeId === nodeId
				&& windowEntry.sourceFolderId === nextSourceFolderId
				&& windowEntry.title === nextTitle
			) {
				return windowEntry
			}
			changedWindowCount += 1
			return {
				...windowEntry,
				openedNodeId: nodeId,
				sourceFolderId: nextSourceFolderId,
				title: nextTitle
			}
		})
		if (changedWindowCount > 0) {
			this.source.windows = nextWindows
			this.source.platformRuntimeService.recordEvent('internal', 'filesystem', 'Window target changed', `Window ${String(windowId)} now points at ${nodeId ?? 'no file'}.`)
		}
	}

	@Spec('Accepts child-view title updates so file rename, delete, and dirty-state changes appear in the outer shell window header.')
	public handleTitleChange(windowId: number, title: string): void {
		let changedWindowCount = 0
		const nextWindows = this.source.windows.map(windowEntry => {
			if (windowEntry.id !== windowId || windowEntry.title === title) {
				return windowEntry
			}
			changedWindowCount += 1
			return {
				...windowEntry,
				title
			}
		})
		if (changedWindowCount > 0) {
			this.source.windows = nextWindows
		}
	}
}
