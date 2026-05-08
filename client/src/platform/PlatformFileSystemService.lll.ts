import { Spec } from '@shared/lll.lll'
import type { PlatformContract } from './PlatformContract.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'
import type { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

@Spec('Provides the app-facing filesystem service boundary on top of the shared virtual filesystem implementation.')
export class PlatformFileSystemService {
	constructor(private readonly virtualFileSystemService: VirtualFileSystemService) {
		Spec('Wraps one shared virtual filesystem implementation behind the stable platform filesystem contract.')
	}

	@Spec('Returns the latest app-visible filesystem snapshot.')
	public getSnapshot(): VirtualFileSystemContract['Snapshot'] {
		return this.virtualFileSystemService.getSnapshot()
	}

	@Spec('Subscribes one app listener to filesystem snapshot changes.')
	public subscribe(listener: (snapshot: VirtualFileSystemContract['Snapshot']) => void): () => void {
		return this.virtualFileSystemService.subscribe(listener)
	}

	@Spec('Returns one app-visible node by identifier when it still exists.')
	public getNode(nodeId: string): VirtualFileSystemContract['Node'] | null {
		return this.virtualFileSystemService.getNode(nodeId) ?? null
	}

	@Spec('Resolves one absolute path through the app-facing filesystem service.')
	public resolvePath(path: string): VirtualFileSystemContract['Node'] | null {
		return this.virtualFileSystemService.resolvePath(path)
	}

	@Spec('Creates one folder through the platform filesystem boundary.')
	public createFolder(parentId: string, name: string): VirtualFileSystemContract['Node'] {
		return this.virtualFileSystemService.createFolder(parentId, name)
	}

	@Spec('Creates one UTF-8 text file through the platform filesystem boundary.')
	public createTextFile(parentId: string, name: string, initialContent: string): VirtualFileSystemContract['Node'] {
		return this.virtualFileSystemService.createTextFile(parentId, name, initialContent)
	}

	@Spec('Creates one binary file through the platform filesystem boundary.')
	public createBinaryFile(parentId: string, name: string, mimeType: string, dataUrl: string, thumbnailDataUrl?: string): VirtualFileSystemContract['Node'] {
		return this.virtualFileSystemService.createBinaryFile(parentId, name, mimeType, dataUrl, thumbnailDataUrl)
	}

	@Spec('Writes UTF-8 text content into one existing file through the platform boundary.')
	public writeTextFile(fileId: string, content: string): VirtualFileSystemContract['Node'] {
		return this.virtualFileSystemService.writeTextFile(fileId, content)
	}

	@Spec('Reads UTF-8 text content from one existing file through the platform boundary.')
	public readTextFile(fileId: string): string | null {
		return this.virtualFileSystemService.readTextFile(fileId)
	}

	@Spec('Reads binary data-url content from one existing file through the platform boundary.')
	public readBinaryFile(fileId: string): string | null {
		return this.virtualFileSystemService.readBinaryFile(fileId)
	}

	@Spec('Renames one filesystem node through the platform boundary.')
	public renameNode(nodeId: string, newName: string): VirtualFileSystemContract['Node'] {
		return this.virtualFileSystemService.renameNode(nodeId, newName)
	}

	@Spec('Moves one filesystem node through the platform boundary.')
	public moveNode(nodeId: string, nextParentId: string): VirtualFileSystemContract['Node'] {
		return this.virtualFileSystemService.moveNode(nodeId, nextParentId)
	}

	@Spec('Deletes one filesystem node through the platform boundary.')
	public deleteNode(nodeId: string): void {
		this.virtualFileSystemService.deleteNode(nodeId)
	}

	@Spec('Returns this wrapper as the stable platform filesystem contract shape for app consumption.')
	public toContract(): PlatformContract['FileSystemService'] {
		return this
	}
}
