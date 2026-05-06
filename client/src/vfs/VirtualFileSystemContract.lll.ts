import { Spec } from '@shared/lll.lll'

Spec('Defines the normalized virtual filesystem contract used by the client shell and storage service.')
export type VirtualFileSystemContract = {
	StorageLike: {
		getItem: (key: string) => string | null
		setItem: (key: string, value: string) => void
		removeItem: (key: string) => void
		length?: number
		key?: (index: number) => string | null
	}
	FileSource: {
		provider: 'unsplash'
		attributionName: string
		attributionUrl: string
		downloadUrl: string
	}
	FileContent: { encoding: 'utf8', data: string } | { encoding: 'data-url', data: string }
	FileContentsById: Record<string, VirtualFileSystemContract['FileContent']>
	Node: {
		id: string
		kind: 'folder' | 'file'
		name: string
		parentId: string | null
		mimeType: string | null
		extension: string | null
		size: number
		createdAt: string
		updatedAt: string
		thumbnailDataUrl?: string
		source?: VirtualFileSystemContract['FileSource']
	}
	Schema: {
		version: number
		rootId: string
		nodesById: Record<string, VirtualFileSystemContract['Node']>
		childrenById: Record<string, string[]>
		fileContentsById: VirtualFileSystemContract['FileContentsById']
	}
	StoredSchema: {
		version: number
		rootId: string
		nodesById: Record<string, VirtualFileSystemContract['Node']>
		childrenById: Record<string, string[]>
	}
	Snapshot: {
		schema: VirtualFileSystemContract['Schema']
		warning: string | null
	}
	PersistenceReadResult:
		| { kind: 'missing' }
		| {
			kind: 'loaded'
			schema: VirtualFileSystemContract['Schema']
			warning: string | null
			shouldRewrite: boolean
		}
		| {
			kind: 'corrupt'
			warning: string
		}
	SubscriptionListener: (snapshot: VirtualFileSystemContract['Snapshot']) => void
}
