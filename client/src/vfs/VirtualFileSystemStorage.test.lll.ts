import './VirtualFileSystemStorage.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { VirtualFileSystemStorage } from './VirtualFileSystemStorage.lll'
import type { VirtualFileSystemContract } from './VirtualFileSystemContract.lll'

@Spec('Covers split VFS localStorage persistence, legacy migration, and cleanup behavior for per-node payload records.')
export class VirtualFileSystemStorageTest {
	testType = 'unit'

	@Scenario('writes central metadata separately from per-node file payload records')
	static async writesMetadataAndNodeRecords(scenario: ScenarioParameter): Promise<{ hasMetadataRecord: boolean, hasNodeRecord: boolean, metadataOmitsPayloads: boolean, metadataOmitsDuplicateThumbnailBytes: boolean }> {
		const assert: AssertFn = scenario.assert
		const storage = this.createMemoryStorage()
		VirtualFileSystemStorage.write(storage, this.buildSchema())
		const metadataRecord = storage.getItem('iva.vfs.v2')
		const readmeRecord = storage.getItem('iva.node-node-7')
		const hasMetadataRecord = metadataRecord !== null
		const hasNodeRecord = readmeRecord !== null
		const metadataOmitsPayloads = metadataRecord?.includes('fileContentsById') === false
		const metadataOmitsDuplicateThumbnailBytes = metadataRecord?.includes('thumbnailDataUrl') === false
		assert(hasMetadataRecord, 'Expected the split-storage metadata record to be written')
		assert(hasNodeRecord, 'Expected the text file payload to be written to a dedicated iva.node-* key')
		assert(metadataOmitsPayloads, 'Expected central VFS metadata to omit inline file payload bytes')
		assert(metadataOmitsDuplicateThumbnailBytes, 'Expected central VFS metadata to omit duplicate thumbnail data when it matches the full image payload')
		return { hasMetadataRecord, hasNodeRecord, metadataOmitsPayloads, metadataOmitsDuplicateThumbnailBytes }
	}

	@Scenario('reads split-storage metadata and payload records back into one in-memory schema')
	static async readsSplitStorageBackIntoSchema(scenario: ScenarioParameter): Promise<{ rootId: string, restoredText: string | null, restoredImageEncoding: string | null }> {
		const assert: AssertFn = scenario.assert
		const storage = this.createMemoryStorage()
		VirtualFileSystemStorage.write(storage, this.buildSchema())
		const readResult = VirtualFileSystemStorage.read(storage)
		assert(readResult.kind === 'loaded', 'Expected split storage read to produce a loaded schema result')
		if (readResult.kind !== 'loaded') {
			throw new Error('Expected loaded split storage result')
		}
		const restoredText = readResult.schema.fileContentsById['node-7']?.data ?? null
		const restoredImageEncoding = readResult.schema.fileContentsById['node-8']?.encoding ?? null
		assert(readResult.schema.rootId === 'node-1', 'Expected split storage read to preserve the root identifier')
		assert(restoredText === 'Seeded', 'Expected split storage read to restore text payload bytes')
		assert(restoredImageEncoding === 'data-url', 'Expected split storage read to restore binary payload encoding')
		return { rootId: readResult.schema.rootId, restoredText, restoredImageEncoding }
	}

	@Scenario('migrates a legacy single-record schema into the split-storage read model')
	static async migratesLegacySingleRecordSchema(scenario: ScenarioParameter): Promise<{ warning: string | null, shouldRewrite: boolean, restoredText: string | null }> {
		const assert: AssertFn = scenario.assert
		const storage = this.createMemoryStorage()
		storage.setItem('iva.vfs.v1', JSON.stringify(this.buildLegacySchema()))
		const readResult = VirtualFileSystemStorage.read(storage)
		assert(readResult.kind === 'loaded', 'Expected legacy storage read to produce a loaded schema result')
		if (readResult.kind !== 'loaded') {
			throw new Error('Expected loaded legacy storage result')
		}
		const restoredText = readResult.schema.fileContentsById['node-7']?.data ?? null
		assert(readResult.warning !== null, 'Expected legacy migration to surface a migration warning')
		assert(readResult.shouldRewrite, 'Expected legacy migration to request a split-storage rewrite')
		assert(restoredText === 'Seeded', 'Expected legacy migration to preserve text payload bytes')
		return { warning: readResult.warning, shouldRewrite: readResult.shouldRewrite, restoredText }
	}

	@Scenario('marks older split-storage records for compaction when they still duplicate thumbnail bytes in metadata')
	static async requestsRewriteForDuplicatedThumbnailBytes(scenario: ScenarioParameter): Promise<{ shouldRewrite: boolean, restoredThumbnailMissing: boolean, restoredImageEncoding: string | null }> {
		const assert: AssertFn = scenario.assert
		const storage = this.createMemoryStorage()
		storage.setItem('iva.vfs.v2', JSON.stringify(this.buildSchema()))
		storage.setItem('iva.node-node-7', JSON.stringify({ encoding: 'utf8', data: 'Seeded' }))
		storage.setItem('iva.node-node-8', JSON.stringify({ encoding: 'data-url', data: 'data:image/jpeg;base64,ZmFrZS1pbWFnZS1kYXRh' }))
		const readResult = VirtualFileSystemStorage.read(storage)
		assert(readResult.kind === 'loaded', 'Expected duplicated-thumbnail split storage to remain readable')
		if (readResult.kind !== 'loaded') {
			throw new Error('Expected loaded duplicated-thumbnail split storage result')
		}
		const restoredThumbnailMissing = typeof readResult.schema.nodesById['node-8']?.thumbnailDataUrl !== 'string'
		const restoredImageEncoding = readResult.schema.fileContentsById['node-8']?.encoding ?? null
		assert(readResult.shouldRewrite, 'Expected duplicated thumbnail bytes in metadata to request one compaction rewrite')
		assert(restoredThumbnailMissing === false, 'Expected existing duplicated-thumbnail metadata to stay readable until compaction runs')
		assert(restoredImageEncoding === 'data-url', 'Expected duplicated-thumbnail split storage to keep its binary payload readable')
		return { shouldRewrite: readResult.shouldRewrite, restoredThumbnailMissing, restoredImageEncoding }
	}

	@Scenario('clears split and legacy records together for isolated reset flows')
	static async clearsKnownStorageKeys(scenario: ScenarioParameter): Promise<{ hasSchemaAfterClear: boolean, hasLegacyAfterClear: boolean, hasNodeAfterClear: boolean }> {
		const assert: AssertFn = scenario.assert
		const storage = this.createMemoryStorage()
		storage.setItem('iva.vfs.v1', JSON.stringify(this.buildLegacySchema()))
		VirtualFileSystemStorage.write(storage, this.buildSchema())
		VirtualFileSystemStorage.clear(storage)
		const hasSchemaAfterClear = storage.getItem('iva.vfs.v2') !== null
		const hasLegacyAfterClear = storage.getItem('iva.vfs.v1') !== null
		const hasNodeAfterClear = storage.getItem('iva.node-node-7') !== null
		assert(hasSchemaAfterClear === false, 'Expected clear to remove split-schema metadata')
		assert(hasLegacyAfterClear === false, 'Expected clear to remove legacy single-record metadata')
		assert(hasNodeAfterClear === false, 'Expected clear to remove per-node payload records')
		return { hasSchemaAfterClear, hasLegacyAfterClear, hasNodeAfterClear }
	}

	@Spec('Builds one representative in-memory VFS schema with both text and image payloads.')
	private static buildSchema(): VirtualFileSystemContract['Schema'] {
		const createdAt = new Date('2025-01-01T09:41:00.000Z').toISOString()
		const imageDataUrl = 'data:image/jpeg;base64,ZmFrZS1pbWFnZS1kYXRh'
		return {
			version: 2,
			rootId: 'node-1',
			nodesById: {
				'node-1': { id: 'node-1', kind: 'folder', name: '', parentId: null, mimeType: null, extension: null, size: 0, createdAt, updatedAt: createdAt },
				'node-2': { id: 'node-2', kind: 'folder', name: 'Desktop', parentId: 'node-1', mimeType: null, extension: null, size: 0, createdAt, updatedAt: createdAt },
				'node-3': { id: 'node-3', kind: 'folder', name: 'Documents', parentId: 'node-1', mimeType: null, extension: null, size: 0, createdAt, updatedAt: createdAt },
				'node-4': { id: 'node-4', kind: 'folder', name: 'Downloads', parentId: 'node-1', mimeType: null, extension: null, size: 0, createdAt, updatedAt: createdAt },
				'node-5': { id: 'node-5', kind: 'folder', name: 'Pictures', parentId: 'node-1', mimeType: null, extension: null, size: 0, createdAt, updatedAt: createdAt },
				'node-6': { id: 'node-6', kind: 'folder', name: 'Wallpapers', parentId: 'node-5', mimeType: null, extension: null, size: 0, createdAt, updatedAt: createdAt },
				'node-7': { id: 'node-7', kind: 'file', name: 'README.txt', parentId: 'node-3', mimeType: 'text/plain', extension: 'txt', size: 6, createdAt, updatedAt: createdAt },
				'node-8': { id: 'node-8', kind: 'file', name: 'Sample.jpg', parentId: 'node-5', mimeType: 'image/jpeg', extension: 'jpg', size: imageDataUrl.length, createdAt, updatedAt: createdAt, thumbnailDataUrl: imageDataUrl }
			},
			childrenById: {
				'node-1': ['node-2', 'node-3', 'node-4', 'node-5'],
				'node-2': [],
				'node-3': ['node-7'],
				'node-4': [],
				'node-5': ['node-6', 'node-8'],
				'node-6': []
			},
			fileContentsById: {
				'node-7': { encoding: 'utf8', data: 'Seeded' },
				'node-8': { encoding: 'data-url', data: imageDataUrl }
			}
		}
	}

	@Spec('Builds one representative legacy VFS schema fixture that still stores file payloads inline in the central record.')
	private static buildLegacySchema(): unknown {
		const schema = this.buildSchema()
		return {
			version: 1,
			rootId: schema.rootId,
			nodesById: schema.nodesById,
			childrenById: schema.childrenById,
			fileContentsById: schema.fileContentsById
		}
	}

	@Spec('Builds an isolated in-memory storage adapter that supports key enumeration for split-storage cleanup tests.')
	private static createMemoryStorage(): VirtualFileSystemContract['StorageLike'] {
		const valuesByKey: Record<string, string> = {}
		return {
			get length(): number {
				return Object.keys(valuesByKey).length
			},
			key(index: number): string | null {
				const keys = Object.keys(valuesByKey)
				return keys[index] ?? null
			},
			getItem(key: string): string | null {
				return key in valuesByKey ? valuesByKey[key] : null
			},
			setItem(key: string, value: string): void {
				valuesByKey[key] = value
			},
			removeItem(key: string): void {
				delete valuesByKey[key]
			}
		}
	}
}
