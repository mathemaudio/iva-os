import { Spec } from '@shared/lll.lll'
import type { VirtualFileSystemContract } from './VirtualFileSystemContract.lll'
import { VirtualFileSystemStorage } from './VirtualFileSystemStorage.lll'

@Spec('Provides a persistent virtual filesystem with normalized nodes, seeded content, and guarded CRUD operations.')
export class VirtualFileSystemService {
	private static readonly currentVersion = 2

	private readonly storage: VirtualFileSystemContract['StorageLike'] | null
	private readonly saveDebounceMs: number
	private readonly listeners = new Set<VirtualFileSystemContract['SubscriptionListener']>()

	private schema: VirtualFileSystemContract['Schema']
	private warning: string | null = null
	private nextIdCounter: number = 1
	private pendingSaveHandle: number | null = null

	constructor(storage?: VirtualFileSystemContract['StorageLike'] | null, saveDebounceMs: number = 40) {
		Spec('Initializes the service with injected storage or browser localStorage and seeds an in-memory filesystem state')
		this.storage = storage ?? this.resolveDefaultStorage()
		this.saveDebounceMs = saveDebounceMs
		this.schema = this.createSeedSchema()
		this.nextIdCounter = this.deriveNextIdCounter(this.schema)
	}

	@Spec('Loads the stored filesystem snapshot, migrates it when possible, and falls back to a clean seed when storage is missing or corrupt.')
	load(): VirtualFileSystemContract['Snapshot'] {
		this.warning = null
		if (this.storage === null) {
			this.schema = this.createSeedSchema()
			this.nextIdCounter = this.deriveNextIdCounter(this.schema)
			return this.getSnapshot()
		}

		const persistenceResult = VirtualFileSystemStorage.read(this.storage)
		if (persistenceResult.kind === 'missing') {
			this.schema = this.createSeedSchema()
			this.nextIdCounter = this.deriveNextIdCounter(this.schema)
			this.save()
			return this.getSnapshot()
		}
		if (persistenceResult.kind === 'corrupt') {
			this.warning = persistenceResult.warning
			this.schema = this.createSeedSchema()
			this.nextIdCounter = this.deriveNextIdCounter(this.schema)
			this.save()
			return this.getSnapshot()
		}
		this.warning = persistenceResult.warning
		this.schema = persistenceResult.schema
		this.nextIdCounter = this.deriveNextIdCounter(this.schema)
		if (persistenceResult.shouldRewrite) {
			this.save()
		}
		return this.getSnapshot()
	}

	@Spec('Persists the current filesystem snapshot immediately when storage is available.')
	save(): void {
		if (this.pendingSaveHandle !== null) {
			globalThis.clearTimeout(this.pendingSaveHandle)
			this.pendingSaveHandle = null
		}
		if (this.storage === null) {
			return
		}
		try {
			VirtualFileSystemStorage.write(this.storage, this.schema)
		} catch {
			this.warning = 'Filesystem changes could not be saved to local storage.'
		}
	}

	@Spec('Subscribes a listener that is notified whenever the filesystem snapshot changes and returns an unsubscribe callback.')
	subscribe(listener: VirtualFileSystemContract['SubscriptionListener']): () => void {
		this.listeners.add(listener)
		return () => {
			this.listeners.delete(listener)
		}
	}

	@Spec('Returns the current filesystem snapshot including any recoverable warning message.')
	getSnapshot(): VirtualFileSystemContract['Snapshot'] {
		return {
			schema: this.cloneSchema(this.schema),
			warning: this.warning
		}
	}

	@Spec('Returns one node by identifier when it exists in the current filesystem snapshot.')
	getNode(nodeId: string): VirtualFileSystemContract['Node'] | null {
		const node = this.schema.nodesById[nodeId]
		if (node === undefined) {
			return null
		}
		return this.cloneNode(node)
	}

	@Spec('Lists the direct children of a folder in their persisted display order.')
	listChildren(folderId: string): VirtualFileSystemContract['Node'][] {
		const folderNode = this.requireFolderNode(folderId)
		const childIds = this.schema.childrenById[folderNode.id] ?? []
		return childIds
			.map(childId => this.schema.nodesById[childId])
			.filter((node): node is VirtualFileSystemContract['Node'] => node !== undefined)
			.map(node => this.cloneNode(node))
	}

	@Spec('Resolves an absolute filesystem path into a node when every segment exists.')
	resolvePath(path: string): VirtualFileSystemContract['Node'] | null {
		const normalizedPath = path.trim()
		if (normalizedPath === '/' || normalizedPath === '') {
			return this.getNode(this.schema.rootId)
		}
		const segments = normalizedPath.split('/').filter(segment => segment.trim() !== '')
		let currentFolderId = this.schema.rootId
		for (const segment of segments) {
			const childId = this.findChildIdByName(currentFolderId, segment)
			if (childId === null) {
				return null
			}
			currentFolderId = childId
		}
		return this.getNode(currentFolderId)
	}

	@Spec('Creates a folder under the given parent, auto-suffixing the name when a sibling already uses it.')
	createFolder(parentId: string, name: string): VirtualFileSystemContract['Node'] {
		const parentNode = this.requireFolderNode(parentId)
		const normalizedName = this.ensureValidName(name)
		const uniqueName = this.ensureUniqueSiblingName(parentNode.id, normalizedName)
		const timestamp = new Date().toISOString()
		const folderId = this.createNodeId()
		const folderNode: VirtualFileSystemContract['Node'] = {
			id: folderId,
			kind: 'folder',
			name: uniqueName,
			parentId: parentNode.id,
			mimeType: null,
			extension: null,
			size: 0,
			createdAt: timestamp,
			updatedAt: timestamp
		}
		this.schema.nodesById[folderId] = folderNode
		this.schema.childrenById[folderId] = []
		this.schema.childrenById[parentNode.id] = [...(this.schema.childrenById[parentNode.id] ?? []), folderId]
		this.emitChange()
		return this.cloneNode(folderNode)
	}

	@Spec('Creates a UTF-8 text file under the given parent and persists its initial content separately from metadata.')
	createTextFile(parentId: string, name: string, initialContent: string = ''): VirtualFileSystemContract['Node'] {
		const parentNode = this.requireFolderNode(parentId)
		const normalizedName = this.ensureValidName(name)
		const uniqueName = this.ensureUniqueSiblingName(parentNode.id, normalizedName)
		const timestamp = new Date().toISOString()
		const fileId = this.createNodeId()
		const fileNode = this.buildTextFileNode(fileId, uniqueName, parentNode.id, initialContent, timestamp)
		this.schema.nodesById[fileId] = fileNode
		this.schema.fileContentsById[fileId] = { encoding: 'utf8', data: initialContent }
		this.schema.childrenById[parentNode.id] = [...(this.schema.childrenById[parentNode.id] ?? []), fileId]
		this.emitChange()
		return this.cloneNode(fileNode)
	}

	@Spec('Creates a binary-style file under the given parent using a data URL payload and optional thumbnail metadata.')
	createBinaryFile(parentId: string, name: string, mimeType: string, dataUrl: string, thumbnailDataUrl?: string): VirtualFileSystemContract['Node'] {
		const parentNode = this.requireFolderNode(parentId)
		const normalizedName = this.ensureValidName(name)
		const uniqueName = this.ensureUniqueSiblingName(parentNode.id, normalizedName)
		const timestamp = new Date().toISOString()
		const fileId = this.createNodeId()
		const fileNode = this.buildBinaryFileNode(fileId, uniqueName, parentNode.id, mimeType, dataUrl, timestamp, thumbnailDataUrl)
		this.schema.nodesById[fileId] = fileNode
		this.schema.fileContentsById[fileId] = { encoding: 'data-url', data: dataUrl }
		this.schema.childrenById[parentNode.id] = [...(this.schema.childrenById[parentNode.id] ?? []), fileId]
		this.emitChange()
		return this.cloneNode(fileNode)
	}

	@Spec('Writes UTF-8 text content into an existing file and refreshes its metadata.')
	writeTextFile(fileId: string, content: string): VirtualFileSystemContract['Node'] {
		const fileNode = this.requireFileNode(fileId)
		this.schema.fileContentsById[fileId] = { encoding: 'utf8', data: content }
		const updatedNode: VirtualFileSystemContract['Node'] = {
			...fileNode,
			size: this.measureContentSize(content),
			updatedAt: new Date().toISOString()
		}
		this.schema.nodesById[fileId] = updatedNode
		this.emitChange()
		return this.cloneNode(updatedNode)
	}

	@Spec('Reads UTF-8 text content from an existing file when that file stores text data.')
	readTextFile(fileId: string): string | null {
		this.requireFileNode(fileId)
		const content = this.schema.fileContentsById[fileId]
		if (content === undefined || content.encoding !== 'utf8') {
			return null
		}
		return content.data
	}

	@Spec('Reads a data URL payload from an existing file when that file stores binary-style data.')
	readBinaryFile(fileId: string): string | null {
		this.requireFileNode(fileId)
		const content = this.schema.fileContentsById[fileId]
		if (content === undefined || content.encoding !== 'data-url') {
			return null
		}
		return content.data
	}

	@Spec('Renames a node, rejects empty names, and auto-suffixes the result when a sibling already uses the requested name.')
	renameNode(nodeId: string, newName: string): VirtualFileSystemContract['Node'] {
		const node = this.requireNode(nodeId)
		if (node.parentId === null) {
			throw new Error('The root folder cannot be renamed.')
		}
		const normalizedName = this.ensureValidName(newName)
		const uniqueName = this.ensureUniqueSiblingName(node.parentId, normalizedName, node.id)
		const renamedNode: VirtualFileSystemContract['Node'] = {
			...node,
			name: uniqueName,
			extension: node.kind === 'file' ? this.extractExtension(uniqueName) : null,
			mimeType: node.kind === 'file' ? this.resolveMimeType(uniqueName, node.mimeType) : null,
			updatedAt: new Date().toISOString()
		}
		this.schema.nodesById[node.id] = renamedNode
		this.emitChange()
		return this.cloneNode(renamedNode)
	}

	@Spec('Moves a node to a different folder while preventing recursive folder cycles and sibling name collisions.')
	moveNode(nodeId: string, nextParentId: string): VirtualFileSystemContract['Node'] {
		const node = this.requireNode(nodeId)
		const nextParentNode = this.requireFolderNode(nextParentId)
		if (node.parentId === null) {
			throw new Error('The root folder cannot be moved.')
		}
		if (node.id === nextParentNode.id) {
			throw new Error('A node cannot be moved into itself.')
		}
		if (node.parentId === nextParentNode.id) {
			return this.cloneNode(node)
		}
		if (node.kind === 'folder' && this.isFolderAncestor(node.id, nextParentNode.id)) {
			throw new Error('A folder cannot be moved into one of its descendants.')
		}

		const uniqueName = this.ensureUniqueSiblingName(nextParentNode.id, node.name)
		this.schema.childrenById[node.parentId] = (this.schema.childrenById[node.parentId] ?? []).filter(childId => childId !== node.id)
		this.schema.childrenById[nextParentNode.id] = [...(this.schema.childrenById[nextParentNode.id] ?? []), node.id]
		const movedNode: VirtualFileSystemContract['Node'] = {
			...node,
			name: uniqueName,
			parentId: nextParentNode.id,
			updatedAt: new Date().toISOString()
		}
		this.schema.nodesById[node.id] = movedNode
		this.emitChange()
		return this.cloneNode(movedNode)
	}

	@Spec('Deletes a node recursively when needed and removes all descendant metadata and file payload records.')
	deleteNode(nodeId: string): void {
		const node = this.requireNode(nodeId)
		if (node.parentId === null) {
			throw new Error('The root folder cannot be deleted.')
		}
		const nodeIdsToDelete = this.collectSubtreeNodeIds(nodeId)
		this.schema.childrenById[node.parentId] = (this.schema.childrenById[node.parentId] ?? []).filter(childId => childId !== node.id)
		for (const currentNodeId of nodeIdsToDelete) {
			const currentNode = this.schema.nodesById[currentNodeId]
			if (currentNode?.kind === 'folder') {
				delete this.schema.childrenById[currentNodeId]
			}
			if (currentNode?.kind === 'file') {
				delete this.schema.fileContentsById[currentNodeId]
			}
			delete this.schema.nodesById[currentNodeId]
		}
		this.emitChange()
	}

	@Spec('Builds the deterministic seeded filesystem used on first run and after recoverable reset scenarios.')
	private createSeedSchema(): VirtualFileSystemContract['Schema'] {
		const createdAt = new Date('2025-01-01T09:41:00.000Z').toISOString()
		const rootId = 'node-1'
		const desktopId = 'node-2'
		const documentsId = 'node-3'
		const downloadsId = 'node-4'
		const picturesId = 'node-5'
		const wallpapersId = 'node-6'
		const readmeId = 'node-7'
		const notesId = 'node-8'
		const readmeContent = 'Welcome to IvaOS.\n\nThis seeded virtual filesystem is persisted in your browser storage.\nCreate, rename, move, and edit files in later sprints.'
		const notesContent = 'Notes\n- Desktop\n- Documents\n- Downloads\n- Pictures\n'
		return {
			version: VirtualFileSystemService.currentVersion,
			rootId,
			nodesById: {
				[rootId]: {
					id: rootId,
					kind: 'folder',
					name: '',
					parentId: null,
					mimeType: null,
					extension: null,
					size: 0,
					createdAt,
					updatedAt: createdAt
				},
				[desktopId]: {
					id: desktopId,
					kind: 'folder',
					name: 'Desktop',
					parentId: rootId,
					mimeType: null,
					extension: null,
					size: 0,
					createdAt,
					updatedAt: createdAt
				},
				[documentsId]: {
					id: documentsId,
					kind: 'folder',
					name: 'Documents',
					parentId: rootId,
					mimeType: null,
					extension: null,
					size: 0,
					createdAt,
					updatedAt: createdAt
				},
				[downloadsId]: {
					id: downloadsId,
					kind: 'folder',
					name: 'Downloads',
					parentId: rootId,
					mimeType: null,
					extension: null,
					size: 0,
					createdAt,
					updatedAt: createdAt
				},
				[picturesId]: {
					id: picturesId,
					kind: 'folder',
					name: 'Pictures',
					parentId: rootId,
					mimeType: null,
					extension: null,
					size: 0,
					createdAt,
					updatedAt: createdAt
				},
				[wallpapersId]: {
					id: wallpapersId,
					kind: 'folder',
					name: 'Wallpapers',
					parentId: picturesId,
					mimeType: null,
					extension: null,
					size: 0,
					createdAt,
					updatedAt: createdAt
				},
				[readmeId]: this.buildTextFileNode(readmeId, 'README.txt', documentsId, readmeContent, createdAt),
				[notesId]: this.buildTextFileNode(notesId, 'Notes.txt', documentsId, notesContent, createdAt)
			},
			childrenById: {
				[rootId]: [desktopId, documentsId, downloadsId, picturesId],
				[desktopId]: [],
				[documentsId]: [readmeId, notesId],
				[downloadsId]: [],
				[picturesId]: [wallpapersId],
				[wallpapersId]: []
			},
			fileContentsById: {
				[readmeId]: { encoding: 'utf8', data: readmeContent },
				[notesId]: { encoding: 'utf8', data: notesContent }
			}
		}
	}


	@Spec('Returns the browser localStorage object when available to the current runtime.')
	private resolveDefaultStorage(): VirtualFileSystemContract['StorageLike'] | null {
		if ('localStorage' in globalThis === false) {
			return null
		}
		return globalThis.localStorage
	}

	@Spec('Emits a fresh snapshot to subscribers and debounces the corresponding persistence write.')
	private emitChange(): void {
		this.scheduleSave()
		const snapshot = this.getSnapshot()
		for (const listener of this.listeners) {
			listener(snapshot)
		}
	}

	@Spec('Schedules one near-future persistence write so bursts of mutations avoid excessive localStorage churn.')
	private scheduleSave(): void {
		if (this.pendingSaveHandle !== null) {
			globalThis.clearTimeout(this.pendingSaveHandle)
		}
		this.pendingSaveHandle = globalThis.setTimeout(() => {
			this.pendingSaveHandle = null
			this.save()
		}, this.saveDebounceMs)
	}

	@Spec('Allocates the next sequential node identifier for a new file or folder.')
	private createNodeId(): string {
		const nodeId = `node-${String(this.nextIdCounter)}`
		this.nextIdCounter += 1
		return nodeId
	}

	@Spec('Derives the next available sequential node identifier from the identifiers currently stored in the schema.')
	private deriveNextIdCounter(schema: VirtualFileSystemContract['Schema']): number {
		const usedIds = Object.keys(schema.nodesById)
		const maxId = usedIds.reduce((currentMax, nodeId) => {
			const match = /^node-(\d+)$/.exec(nodeId)
			if (match === null) {
				return currentMax
			}
			return Math.max(currentMax, Number.parseInt(match[1], 10))
		}, 0)
		return maxId + 1
	}

	@Spec('Builds file metadata for one UTF-8 text file while keeping payload bytes in the separate file-content table.')
	private buildTextFileNode(fileId: string, name: string, parentId: string, content: string, timestamp: string): VirtualFileSystemContract['Node'] {
		return {
			id: fileId,
			kind: 'file',
			name,
			parentId,
			mimeType: this.resolveMimeType(name, 'text/plain'),
			extension: this.extractExtension(name),
			size: this.measureContentSize(content),
			createdAt: timestamp,
			updatedAt: timestamp
		}
	}

	@Spec('Builds file metadata for one binary-style file while keeping payload bytes in the separate file-content table.')
	private buildBinaryFileNode(
		fileId: string,
		name: string,
		parentId: string,
		mimeType: string,
		dataUrl: string,
		timestamp: string,
		thumbnailDataUrl?: string
	): VirtualFileSystemContract['Node'] {
		return {
			id: fileId,
			kind: 'file',
			name,
			parentId,
			mimeType: this.resolveMimeType(name, mimeType),
			extension: this.extractExtension(name),
			size: this.measureContentSize(dataUrl),
			createdAt: timestamp,
			updatedAt: timestamp,
			...(thumbnailDataUrl === undefined ? {} : { thumbnailDataUrl })
		}
	}

	@Spec('Measures persisted content size in code units for the lightweight browser-hosted storage model used in this sprint.')
	private measureContentSize(content: string): number {
		return content.length
	}

	@Spec('Extracts the final file extension segment from a name when one exists.')
	private extractExtension(name: string): string | null {
		const lastDotIndex = name.lastIndexOf('.')
		if (lastDotIndex <= 0 || lastDotIndex === name.length - 1) {
			return null
		}
		return name.slice(lastDotIndex + 1).toLowerCase()
	}

	@Spec('Resolves a mime type for supported text and image files while preserving a fallback when needed.')
	private resolveMimeType(name: string, fallbackMimeType: string | null): string | null {
		const extension = this.extractExtension(name)
		if (extension === 'json') {
			return 'application/json'
		}
		if (extension === 'md') {
			return 'text/markdown'
		}
		if (extension === 'txt') {
			return 'text/plain'
		}
		if (extension === 'png') {
			return 'image/png'
		}
		if (extension === 'jpg' || extension === 'jpeg') {
			return 'image/jpeg'
		}
		if (extension === 'webp') {
			return 'image/webp'
		}
		if (extension === 'gif') {
			return 'image/gif'
		}
		if (fallbackMimeType !== null) {
			return fallbackMimeType
		}
		return 'text/plain'
	}

	@Spec('Validates that a user-provided node name is non-empty after trimming and returns the normalized value.')
	private ensureValidName(name: string): string {
		const normalizedName = name.trim()
		if (normalizedName === '') {
			throw new Error('Node names cannot be empty.')
		}
		return normalizedName
	}

	@Spec('Ensures that a node name is unique among one folder’s direct children by adding a numeric suffix when required.')
	private ensureUniqueSiblingName(parentId: string, requestedName: string, excludedNodeId?: string): string {
		const siblingNames = new Set(
			(this.schema.childrenById[parentId] ?? [])
				.filter(childId => childId !== excludedNodeId)
				.map(childId => this.schema.nodesById[childId]?.name)
				.filter((name): name is string => typeof name === 'string')
		)
		if (siblingNames.has(requestedName) === false) {
			return requestedName
		}
		const lastDotIndex = requestedName.lastIndexOf('.')
		const hasExtension = lastDotIndex > 0 && lastDotIndex < requestedName.length - 1
		const baseName = hasExtension ? requestedName.slice(0, lastDotIndex) : requestedName
		const extensionSuffix = hasExtension ? requestedName.slice(lastDotIndex) : ''
		let duplicateNumber = 1
		let nextName = `${baseName} (${String(duplicateNumber)})${extensionSuffix}`
		while (siblingNames.has(nextName)) {
			duplicateNumber += 1
			nextName = `${baseName} (${String(duplicateNumber)})${extensionSuffix}`
		}
		return nextName
	}

	@Spec('Finds one direct child identifier by exact visible name inside the given folder.')
	private findChildIdByName(folderId: string, childName: string): string | null {
		const childIds = this.schema.childrenById[folderId] ?? []
		for (const childId of childIds) {
			const childNode = this.schema.nodesById[childId]
			if (childNode?.name === childName) {
				return childId
			}
		}
		return null
	}

	@Spec('Checks whether one folder identifier is an ancestor of another node by walking parent links upward.')
	private isFolderAncestor(folderId: string, candidateDescendantId: string): boolean {
		let currentNode = this.schema.nodesById[candidateDescendantId] ?? null
		while (currentNode !== null && currentNode.parentId !== null) {
			if (currentNode.parentId === folderId) {
				return true
			}
			currentNode = this.schema.nodesById[currentNode.parentId] ?? null
		}
		return false
	}

	@Spec('Collects all node identifiers inside one subtree so recursive delete can remove children before forgetting the parent.')
	private collectSubtreeNodeIds(nodeId: string): string[] {
		const nodeIds: string[] = []
		const pendingNodeIds: string[] = [nodeId]
		while (pendingNodeIds.length > 0) {
			const currentNodeId = pendingNodeIds.pop()
			if (currentNodeId === undefined) {
				continue
			}
			nodeIds.push(currentNodeId)
			const childIds = this.schema.childrenById[currentNodeId] ?? []
			for (const childId of childIds) {
				pendingNodeIds.push(childId)
			}
		}
		return nodeIds.reverse()
	}

	@Spec('Returns one existing node or throws when the caller references an unknown identifier.')
	private requireNode(nodeId: string): VirtualFileSystemContract['Node'] {
		const node = this.schema.nodesById[nodeId]
		if (node === undefined) {
			throw new Error(`Unknown node id: ${nodeId}`)
		}
		return node
	}

	@Spec('Returns one existing folder node or throws when the caller references a file or unknown identifier.')
	private requireFolderNode(nodeId: string): VirtualFileSystemContract['Node'] {
		const node = this.requireNode(nodeId)
		if (node.kind !== 'folder') {
			throw new Error(`Expected folder node: ${nodeId}`)
		}
		return node
	}

	@Spec('Returns one existing file node or throws when the caller references a folder or unknown identifier.')
	private requireFileNode(nodeId: string): VirtualFileSystemContract['Node'] {
		const node = this.requireNode(nodeId)
		if (node.kind !== 'file') {
			throw new Error(`Expected file node: ${nodeId}`)
		}
		return node
	}

	@Spec('Clones one node into plain data so callers cannot mutate the service’s internal source of truth accidentally.')
	private cloneNode(node: VirtualFileSystemContract['Node']): VirtualFileSystemContract['Node'] {
		return JSON.parse(JSON.stringify(node)) as VirtualFileSystemContract['Node']
	}

	@Spec('Clones one schema snapshot into plain data for safe external reads and subscriber notifications.')
	private cloneSchema(schema: VirtualFileSystemContract['Schema']): VirtualFileSystemContract['Schema'] {
		return JSON.parse(JSON.stringify(schema)) as VirtualFileSystemContract['Schema']
	}
}
