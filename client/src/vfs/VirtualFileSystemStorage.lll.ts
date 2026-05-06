import { Spec } from '@shared/lll.lll'
import type { VirtualFileSystemContract } from './VirtualFileSystemContract.lll'

@Spec('Owns the browser localStorage key layout for the virtual filesystem by keeping metadata centralized and storing each file payload in its own record.')
export class VirtualFileSystemStorage {
	private static readonly schemaKey = 'iva.vfs.v2'
	private static readonly legacySchemaKey = 'iva.vfs.v1'
	private static readonly nodeContentPrefix = 'iva.node-'
	private static readonly currentVersion = 2

	@Spec('Reads the persisted filesystem from storage, including legacy migration from the previous single-record format when possible.')
	static read(storage: VirtualFileSystemContract['StorageLike']): VirtualFileSystemContract['PersistenceReadResult'] {
		const currentSchema = this.readCurrentSchema(storage)
		if (currentSchema.kind !== 'missing') {
			return currentSchema
		}
		return this.readLegacySchema(storage)
	}

	@Spec('Writes the current filesystem metadata and per-file payload records into storage while removing stale payload keys from prior saves.')
	static write(storage: VirtualFileSystemContract['StorageLike'], schema: VirtualFileSystemContract['Schema']): void {
		const storedSchema: VirtualFileSystemContract['StoredSchema'] = {
			version: VirtualFileSystemStorage.currentVersion,
			rootId: schema.rootId,
			nodesById: schema.nodesById,
			childrenById: schema.childrenById
		}
		storage.setItem(this.schemaKey, JSON.stringify(storedSchema))
		const activeFileIds = new Set<string>()
		for (const [fileId, fileContent] of Object.entries(schema.fileContentsById)) {
			activeFileIds.add(fileId)
			storage.setItem(this.buildNodeContentKey(fileId), JSON.stringify(fileContent))
		}
		for (const staleFileId of this.listPersistedNodeContentIds(storage)) {
			if (activeFileIds.has(staleFileId) === false) {
				storage.removeItem(this.buildNodeContentKey(staleFileId))
			}
		}
		storage.removeItem(this.legacySchemaKey)
	}

	@Spec('Removes all known VFS metadata and per-node payload records from storage for test isolation or hard reset flows.')
	static clear(storage: VirtualFileSystemContract['StorageLike']): void {
		storage.removeItem(this.schemaKey)
		storage.removeItem(this.legacySchemaKey)
		for (const fileId of this.listPersistedNodeContentIds(storage)) {
			storage.removeItem(this.buildNodeContentKey(fileId))
		}
	}

	@Spec('Returns the dedicated storage key used for one file payload record.')
	static buildNodeContentKey(fileId: string): string {
		return `${this.nodeContentPrefix}${fileId}`
	}

	@Spec('Reads the current split-storage schema and all referenced node payload records when they are available and well formed.')
	private static readCurrentSchema(storage: VirtualFileSystemContract['StorageLike']): VirtualFileSystemContract['PersistenceReadResult'] {
		const rawSchema = storage.getItem(this.schemaKey)
		if (rawSchema === null) {
			return { kind: 'missing' }
		}
		try {
			const parsedSchema: unknown = JSON.parse(rawSchema)
			const normalizedStoredSchema = this.normalizeStoredSchema(parsedSchema)
			if (normalizedStoredSchema === null) {
				return {
					kind: 'corrupt',
					warning: 'Stored filesystem data was corrupt and has been reset to a clean seed.'
				}
			}
			const fileContentsById = this.readFileContentsForNodes(storage, normalizedStoredSchema.nodesById)
			if (fileContentsById === null) {
				return {
					kind: 'corrupt',
					warning: 'Stored filesystem data was corrupt and has been reset to a clean seed.'
				}
			}
			return {
				kind: 'loaded',
				schema: {
					version: this.currentVersion,
					rootId: normalizedStoredSchema.rootId,
					nodesById: normalizedStoredSchema.nodesById,
					childrenById: normalizedStoredSchema.childrenById,
					fileContentsById
				},
				warning: null,
				shouldRewrite: false
			}
		} catch {
			return {
				kind: 'corrupt',
				warning: 'Stored filesystem data could not be read and has been reset to a clean seed.'
			}
		}
	}

	@Spec('Reads the old single-record schema and converts it into the split-storage model so existing browsers migrate forward automatically.')
	private static readLegacySchema(storage: VirtualFileSystemContract['StorageLike']): VirtualFileSystemContract['PersistenceReadResult'] {
		const rawSchema = storage.getItem(this.legacySchemaKey)
		if (rawSchema === null) {
			return { kind: 'missing' }
		}
		try {
			const parsedSchema: unknown = JSON.parse(rawSchema)
			const normalizedLegacySchema = this.normalizeLegacySchema(parsedSchema)
			if (normalizedLegacySchema === null) {
				return {
					kind: 'corrupt',
					warning: 'Stored filesystem data was corrupt and has been reset to a clean seed.'
				}
			}
			return {
				kind: 'loaded',
				schema: {
					version: this.currentVersion,
					rootId: normalizedLegacySchema.rootId,
					nodesById: normalizedLegacySchema.nodesById,
					childrenById: normalizedLegacySchema.childrenById,
					fileContentsById: normalizedLegacySchema.fileContentsById
				},
				warning: 'Filesystem data was migrated to the latest schema version.',
				shouldRewrite: true
			}
		} catch {
			return {
				kind: 'corrupt',
				warning: 'Stored filesystem data could not be read and has been reset to a clean seed.'
			}
		}
	}

	@Spec('Builds the in-memory file-content table by reading one dedicated localStorage record for each persisted file node.')
	private static readFileContentsForNodes(
		storage: VirtualFileSystemContract['StorageLike'],
		nodesById: Record<string, VirtualFileSystemContract['Node']>
	): VirtualFileSystemContract['FileContentsById'] | null {
		const fileContentsById: VirtualFileSystemContract['FileContentsById'] = {}
		for (const node of Object.values(nodesById)) {
			if (node.kind !== 'file') {
				continue
			}
			const rawFileContent = storage.getItem(this.buildNodeContentKey(node.id))
			if (rawFileContent === null) {
				return null
			}
			const parsedFileContent: unknown = JSON.parse(rawFileContent)
			const normalizedFileContent = this.normalizeFileContent(parsedFileContent)
			if (normalizedFileContent === null) {
				return null
			}
			fileContentsById[node.id] = normalizedFileContent
		}
		return fileContentsById
	}

	@Spec('Lists all currently persisted split-storage payload node identifiers when the storage adapter supports key enumeration.')
	private static listPersistedNodeContentIds(storage: VirtualFileSystemContract['StorageLike']): string[] {
		if (typeof storage.length !== 'number' || typeof storage.key !== 'function') {
			return []
		}
		const nodeIds: string[] = []
		for (let index = 0; index < storage.length; index += 1) {
			const key = storage.key(index)
			if (typeof key !== 'string' || key.startsWith(this.nodeContentPrefix) === false) {
				continue
			}
			nodeIds.push(key.slice(this.nodeContentPrefix.length))
		}
		return nodeIds
	}

	@Spec('Normalizes the current split-storage metadata object into the structure expected by the in-memory VFS service.')
	private static normalizeStoredSchema(candidateSchema: unknown): VirtualFileSystemContract['StoredSchema'] | null {
		if (typeof candidateSchema !== 'object' || candidateSchema === null) {
			return null
		}
		const version = Reflect.get(candidateSchema, 'version')
		const rootId = Reflect.get(candidateSchema, 'rootId')
		const nodesById = Reflect.get(candidateSchema, 'nodesById')
		const childrenById = Reflect.get(candidateSchema, 'childrenById')
		if (version !== this.currentVersion || typeof rootId !== 'string') {
			return null
		}
		if (typeof nodesById !== 'object' || nodesById === null) {
			return null
		}
		if (typeof childrenById !== 'object' || childrenById === null) {
			return null
		}
		if (rootId in nodesById === false) {
			return null
		}
		return {
			version,
			rootId,
			nodesById: JSON.parse(JSON.stringify(nodesById)) as Record<string, VirtualFileSystemContract['Node']>,
			childrenById: JSON.parse(JSON.stringify(childrenById)) as Record<string, string[]>
		}
	}

	@Spec('Normalizes the previous single-record metadata-plus-payload schema so it can be rewritten into the new split-storage layout.')
	private static normalizeLegacySchema(candidateSchema: unknown): VirtualFileSystemContract['Schema'] | null {
		if (typeof candidateSchema !== 'object' || candidateSchema === null) {
			return null
		}
		const rootId = Reflect.get(candidateSchema, 'rootId')
		const nodesById = Reflect.get(candidateSchema, 'nodesById')
		const childrenById = Reflect.get(candidateSchema, 'childrenById')
		const fileContentsById = Reflect.get(candidateSchema, 'fileContentsById')
		if (typeof rootId !== 'string') {
			return null
		}
		if (typeof nodesById !== 'object' || nodesById === null) {
			return null
		}
		if (typeof childrenById !== 'object' || childrenById === null) {
			return null
		}
		if (typeof fileContentsById !== 'object' || fileContentsById === null) {
			return null
		}
		if (rootId in nodesById === false) {
			return null
		}
		const normalizedFileContentsById = this.normalizeFileContentsById(fileContentsById)
		if (normalizedFileContentsById === null) {
			return null
		}
		return {
			version: this.currentVersion,
			rootId,
			nodesById: JSON.parse(JSON.stringify(nodesById)) as Record<string, VirtualFileSystemContract['Node']>,
			childrenById: JSON.parse(JSON.stringify(childrenById)) as Record<string, string[]>,
			fileContentsById: normalizedFileContentsById
		}
	}

	@Spec('Normalizes a file-content lookup object by validating every value as one supported persisted payload shape.')
	private static normalizeFileContentsById(candidateFileContentsById: unknown): VirtualFileSystemContract['FileContentsById'] | null {
		if (typeof candidateFileContentsById !== 'object' || candidateFileContentsById === null) {
			return null
		}
		const fileContentsById: VirtualFileSystemContract['FileContentsById'] = {}
		for (const [fileId, candidateFileContent] of Object.entries(candidateFileContentsById)) {
			const normalizedFileContent = this.normalizeFileContent(candidateFileContent)
			if (normalizedFileContent === null) {
				return null
			}
			fileContentsById[fileId] = normalizedFileContent
		}
		return fileContentsById
	}

	@Spec('Normalizes one persisted file payload record into either supported UTF-8 text or data-url binary content.')
	private static normalizeFileContent(candidateFileContent: unknown): VirtualFileSystemContract['FileContent'] | null {
		if (typeof candidateFileContent !== 'object' || candidateFileContent === null) {
			return null
		}
		const encoding = Reflect.get(candidateFileContent, 'encoding')
		const data = Reflect.get(candidateFileContent, 'data')
		if (typeof data !== 'string') {
			return null
		}
		if (encoding === 'utf8' || encoding === 'data-url') {
			return { encoding, data }
		}
		return null
	}
}
