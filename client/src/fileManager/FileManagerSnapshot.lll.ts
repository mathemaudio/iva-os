import { Spec } from '@shared/lll.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Provides snapshot traversal helpers for the File Manager UI.')
export class FileManagerSnapshot {
	@Spec('Returns the folder node to display, falling back to the root folder when needed.')
	static getCurrentFolder(snapshot: VirtualFileSystemContract['Snapshot'], currentFolderId: string): VirtualFileSystemContract['Node'] {
		const requestedFolderId = currentFolderId === '' ? snapshot.schema.rootId : currentFolderId
		const folderNode = snapshot.schema.nodesById[requestedFolderId]
		if (folderNode === undefined || folderNode.kind !== 'folder') {
			return snapshot.schema.nodesById[snapshot.schema.rootId]
		}
		return folderNode
	}

	@Spec('Returns the direct children of a folder in persisted order from one snapshot.')
	static getChildren(snapshot: VirtualFileSystemContract['Snapshot'], folderId: string): VirtualFileSystemContract['Node'][] {
		const childIds = snapshot.schema.childrenById[folderId] ?? []
		return childIds
			.map(childId => snapshot.schema.nodesById[childId])
			.filter((node): node is VirtualFileSystemContract['Node'] => node !== undefined)
	}

	@Spec('Resolves one absolute path directly from a snapshot tree without mutating shared state.')
	static resolvePath(snapshot: VirtualFileSystemContract['Snapshot'], path: string): VirtualFileSystemContract['Node'] | null {
		if (path === '/' || path.trim() === '') {
			return snapshot.schema.nodesById[snapshot.schema.rootId] ?? null
		}
		const segments = path.split('/').filter(segment => segment.trim() !== '')
		let currentFolderId = snapshot.schema.rootId
		for (const segment of segments) {
			const childId = (snapshot.schema.childrenById[currentFolderId] ?? []).find(candidateId => {
				return snapshot.schema.nodesById[candidateId]?.name === segment
			})
			if (childId === undefined) {
				return null
			}
			currentFolderId = childId
		}
		return snapshot.schema.nodesById[currentFolderId] ?? null
	}

	@Spec('Returns the requested sidebar shortcut locations from the seeded filesystem shape when present.')
	static getSidebarLocations(snapshot: VirtualFileSystemContract['Snapshot']): VirtualFileSystemContract['Node'][] {
		const locations: VirtualFileSystemContract['Node'][] = []
		for (const locationPath of ['/Desktop', '/Documents', '/Downloads', '/Pictures', '/Pictures/Wallpapers']) {
			const node = this.resolvePath(snapshot, locationPath)
			if (node !== null) {
				locations.push(node)
			}
		}
		return locations
	}

	@Spec('Builds the breadcrumb chain from one folder node back to the root.')
	static getBreadcrumbs(snapshot: VirtualFileSystemContract['Snapshot'], folderId: string): VirtualFileSystemContract['Node'][] {
		const breadcrumbs: VirtualFileSystemContract['Node'][] = []
		let currentNode: VirtualFileSystemContract['Node'] | null = this.getCurrentFolder(snapshot, folderId)
		while (currentNode !== null) {
			breadcrumbs.unshift(currentNode)
			currentNode = currentNode.parentId === null ? null : snapshot.schema.nodesById[currentNode.parentId] ?? null
		}
		return breadcrumbs
	}

	@Spec('Normalizes current folder, selection, focus, and dialog ids after one snapshot change.')
	static synchronizeViewState(
		snapshot: VirtualFileSystemContract['Snapshot'],
		viewState: {
			currentFolderId: string
			selectedNodeId: string | null
			focusedNodeId: string | null
			renameNodeId: string | null
			moveNodeId: string | null
			deleteNodeId: string | null
		}
	): {
		currentFolderId: string
		selectedNodeId: string | null
		focusedNodeId: string | null
		renameNodeId: string | null
		moveNodeId: string | null
		deleteNodeId: string | null
	} {
		const currentFolder = this.getCurrentFolder(snapshot, viewState.currentFolderId)
		const childIds = snapshot.schema.childrenById[currentFolder.id] ?? []
		return {
			currentFolderId: currentFolder.id,
			selectedNodeId: viewState.selectedNodeId !== null && childIds.includes(viewState.selectedNodeId) ? viewState.selectedNodeId : null,
			focusedNodeId: viewState.focusedNodeId !== null && childIds.includes(viewState.focusedNodeId) ? viewState.focusedNodeId : null,
			renameNodeId: viewState.renameNodeId !== null && snapshot.schema.nodesById[viewState.renameNodeId] !== undefined ? viewState.renameNodeId : null,
			moveNodeId: viewState.moveNodeId !== null && snapshot.schema.nodesById[viewState.moveNodeId] !== undefined ? viewState.moveNodeId : null,
			deleteNodeId: viewState.deleteNodeId !== null && snapshot.schema.nodesById[viewState.deleteNodeId] !== undefined ? viewState.deleteNodeId : null
		}
	}

	@Spec('Builds the list of visible folder destinations for the move dialog while excluding the item subtree.')
	static getMoveDestinationFolders(
		snapshot: VirtualFileSystemContract['Snapshot'],
		nodeId: string
	): Array<{ id: string, path: string }> {
		const results: Array<{ id: string, path: string }> = []
		const candidateNode = snapshot.schema.nodesById[nodeId] ?? null
		this.collectMoveDestinationFolders(snapshot, snapshot.schema.rootId, candidateNode, results)
		return results
	}

	@Spec('Recursively walks folder nodes to collect visible move targets from one snapshot tree.')
	private static collectMoveDestinationFolders(
		snapshot: VirtualFileSystemContract['Snapshot'],
		folderId: string,
		candidateNode: VirtualFileSystemContract['Node'] | null,
		results: Array<{ id: string, path: string }>
	): void {
		const folderNode = snapshot.schema.nodesById[folderId]
		if (folderNode === undefined || folderNode.kind !== 'folder') {
			return
		}
		if (candidateNode === null || (folderNode.id !== candidateNode.id && this.isDescendantFolder(snapshot, candidateNode.id, folderNode.id) === false)) {
			results.push({ id: folderNode.id, path: this.describeNodePath(snapshot, folderNode.id) })
		}
		const childIds = snapshot.schema.childrenById[folderNode.id] ?? []
		for (const childId of childIds) {
			const childNode = snapshot.schema.nodesById[childId]
			if (childNode?.kind === 'folder') {
				this.collectMoveDestinationFolders(snapshot, childNode.id, candidateNode, results)
			}
		}
	}

	@Spec('Checks whether one folder lies inside another folder subtree in a snapshot tree.')
	static isDescendantFolder(snapshot: VirtualFileSystemContract['Snapshot'], ancestorFolderId: string, candidateFolderId: string): boolean {
		let currentNode = snapshot.schema.nodesById[candidateFolderId] ?? null
		while (currentNode !== null && currentNode.parentId !== null) {
			if (currentNode.parentId === ancestorFolderId) {
				return true
			}
			currentNode = snapshot.schema.nodesById[currentNode.parentId] ?? null
		}
		return false
	}

	@Spec('Builds a slash-delimited visible path for one node identifier from the snapshot tree.')
	static describeNodePath(snapshot: VirtualFileSystemContract['Snapshot'], nodeId: string): string {
		const segments: string[] = []
		let currentNode: VirtualFileSystemContract['Node'] | null = snapshot.schema.nodesById[nodeId] ?? null
		while (currentNode !== null) {
			if (currentNode.name !== '') {
				segments.unshift(currentNode.name)
			}
			currentNode = currentNode.parentId === null ? null : snapshot.schema.nodesById[currentNode.parentId] ?? null
		}
		return segments.length === 0 ? '/' : `/${segments.join('/')}`
	}
}
