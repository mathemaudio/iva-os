import { Spec } from '@shared/lll.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Maps virtual filesystem nodes to their default IvaOS application identifiers.')
export class AppAssociationRegistry {
	private static readonly textExtensions = new Set(['txt', 'md', 'json'])
	private static readonly imageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])

	@Spec('Returns the default application identifier for one filesystem node when the node is supported by the shell.')
	static resolveDefaultAppId(node: VirtualFileSystemContract['Node']): string | null {
		if (node.kind === 'folder') {
			return 'file-manager'
		}
		if (this.isTextFile(node)) {
			return 'text-editor'
		}
		if (this.isImageFile(node)) {
			return 'image-viewer'
		}
		return null
	}

	@Spec('Returns true when one file node should open in the Text Editor by extension or mime type.')
	static isTextFile(node: VirtualFileSystemContract['Node']): boolean {
		if (node.kind !== 'file') {
			return false
		}
		if (typeof node.mimeType === 'string' && node.mimeType.startsWith('text/')) {
			return true
		}
		if (node.mimeType === 'application/json') {
			return true
		}
		return typeof node.extension === 'string' && this.textExtensions.has(node.extension)
	}

	@Spec('Returns true when one file node should open in the Image Viewer by extension or mime type.')
	static isImageFile(node: VirtualFileSystemContract['Node']): boolean {
		if (node.kind !== 'file') {
			return false
		}
		if (typeof node.mimeType === 'string' && node.mimeType.startsWith('image/')) {
			return true
		}
		return typeof node.extension === 'string' && this.imageExtensions.has(node.extension)
	}
}
