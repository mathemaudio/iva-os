import { Spec } from '@shared/lll.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Provides small formatting helpers for File Manager labels and host file imports.')
export class FileManagerFormatting {
	@Spec('Returns a concise visible type label for one file-system node.')
	static describeNodeType(node: VirtualFileSystemContract['Node']): string {
		if (node.kind === 'folder') {
			return 'Folder'
		}
		if (typeof node.mimeType === 'string' && node.mimeType.startsWith('image/')) {
			return 'Image'
		}
		if (typeof node.mimeType === 'string' && node.mimeType.startsWith('text/')) {
			return 'Text'
		}
		return node.mimeType ?? 'File'
	}

	@Spec('Formats a last-modified timestamp into a short user-facing label.')
	static formatModifiedLabel(isoTimestamp: string): string {
		const date = new Date(isoTimestamp)
		if (Number.isNaN(date.getTime())) {
			return 'Unknown'
		}
		return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
	}

	@Spec('Formats one node size for visible list rendering while leaving folders without a byte count.')
	static formatSizeLabel(node: VirtualFileSystemContract['Node']): string {
		if (node.kind === 'folder') {
			return '—'
		}
		if (node.size < 1024) {
			return `${String(node.size)} B`
		}
		const kilobytes = Math.round((node.size / 1024) * 10) / 10
		return `${String(kilobytes)} KB`
	}

	@Spec('Extracts the lowercase file extension from one visible host filename when present.')
	static readExtension(fileName: string): string | null {
		const lastDotIndex = fileName.lastIndexOf('.')
		if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
			return null
		}
		return fileName.slice(lastDotIndex + 1).toLowerCase()
	}

	@Spec('Infers one supported image mime type from a host filename when the browser omits it.')
	static inferImageMimeType(fileName: string): string {
		const extension = this.readExtension(fileName)
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
		return 'image/png'
	}

	@Spec('Normalizes thrown errors into user-facing messages for recoverable file operations.')
	static readErrorMessage(error: unknown): string {
		if (error instanceof Error) {
			return error.message
		}
		return 'The requested file operation could not be completed.'
	}
}
