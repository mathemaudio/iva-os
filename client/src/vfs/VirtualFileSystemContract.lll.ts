import { Spec } from '@shared/lll.lll'

Spec('Defines the normalized virtual filesystem contract used by the client shell and storage service.')
export type VirtualFileSystemContract = {
	StorageLike: {
		getItem: (key: string) => string | null
		setItem: (key: string, value: string) => void
		removeItem: (key: string) => void
	}
	FileSource: {
		provider: 'unsplash'
		attributionName: string
		attributionUrl: string
		downloadUrl: string
	}
	FileContent: { encoding: 'utf8', data: string } | { encoding: 'data-url', data: string }
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
		fileContentsById: Record<string, VirtualFileSystemContract['FileContent']>
	}
	Snapshot: {
		schema: VirtualFileSystemContract['Schema']
		warning: string | null
	}
	SubscriptionListener: (snapshot: VirtualFileSystemContract['Snapshot']) => void
}
