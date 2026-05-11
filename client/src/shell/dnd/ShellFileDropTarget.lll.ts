import { Spec } from '@shared/lll.lll'
import type { PlatformContract } from '../../platform/PlatformContract.lll'
import { FileManagerFormatting } from '../../fileManager/FileManagerFormatting.lll'

@Spec('Resolves browser-visible drop targets and imports supported image files into the shared virtual filesystem with shell-styled validation messages.')
export class ShellFileDropTarget {
	private static readonly maximumImageBytes = 2 * 1024 * 1024

	@Spec('Returns true when the current drag payload appears to contain at least one file.')
	public static hasFilePayload(event: DragEvent): boolean {
		const dragTypes = event.dataTransfer?.types ?? []
		return Array.from(dragTypes).includes('Files')
	}

	@Spec('Resolves one filesystem folder id from the current browser-visible drop location when contemporary HTML can identify one.')
	public static resolveFolderIdFromEvent(event: DragEvent, filesystem: PlatformContract['FileSystemService']): string | null {
		const composedPath = typeof event.composedPath === 'function' ? event.composedPath() : []
		for (const pathEntry of composedPath) {
			if (!(pathEntry instanceof HTMLElement)) {
				continue
			}
			const folderPath = pathEntry.getAttribute('data-drop-folder-path')
			if (typeof folderPath === 'string' && folderPath !== '') {
				const folderNode = filesystem.resolvePath(folderPath)
				if (folderNode?.kind === 'folder') {
					return folderNode.id
				}
			}
			const currentFolderId = pathEntry.getAttribute('data-current-folder-id')
			const appId = pathEntry.getAttribute('data-app-id')
			if (appId === 'file-manager' && typeof currentFolderId === 'string' && currentFolderId !== '') {
				const folderNode = filesystem.getNode(currentFolderId)
				if (folderNode?.kind === 'folder') {
					return folderNode.id
				}
			}
		}
		return null
	}

	@Spec('Imports dropped image files into the resolved folder when their type and size fit the browser shell rules, otherwise returns one shell-visible error message.')
	public static async importDroppedImages(event: DragEvent, filesystem: PlatformContract['FileSystemService']): Promise<string | null> {
		const folderId = this.resolveFolderIdFromEvent(event, filesystem)
		if (folderId === null) {
			return 'This browser can upload dropped images only when the drop lands on the desktop surface or on an open File Manager folder view.'
		}
		const droppedFiles = Array.from(event.dataTransfer?.files ?? [])
		if (droppedFiles.length === 0) {
			return null
		}
		let oversizedCount = 0
		let unsupportedCount = 0
		let importedCount = 0
		for (const droppedFile of droppedFiles) {
			const extension = FileManagerFormatting.readExtension(droppedFile.name)
			const isImageFile = droppedFile.type.startsWith('image/') || (extension !== null && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extension))
			if (isImageFile === false) {
				unsupportedCount += 1
				continue
			}
			if (droppedFile.size > this.maximumImageBytes) {
				oversizedCount += 1
				continue
			}
			const dataUrl = await this.readFileAsDataUrl(droppedFile)
			const mimeType = droppedFile.type === '' ? FileManagerFormatting.inferImageMimeType(droppedFile.name) : droppedFile.type
			filesystem.createBinaryFile(folderId, droppedFile.name, mimeType, dataUrl, dataUrl)
			importedCount += 1
		}
		if (oversizedCount > 0) {
			return oversizedCount === 1
				? 'This image is larger than 2 megabytes, so it cannot be uploaded here.'
				: `${String(oversizedCount)} images are larger than 2 megabytes, so they cannot be uploaded here.`
		}
		if (unsupportedCount > 0 && importedCount === 0) {
			return unsupportedCount === 1
				? 'Only image files can be uploaded by dragging them onto the window right now.'
				: 'Only image files can be uploaded by dragging them onto the window right now.'
		}
		if (unsupportedCount > 0 && importedCount > 0) {
			return `${String(importedCount)} image${importedCount === 1 ? '' : 's'} uploaded. ${String(unsupportedCount)} non-image file${unsupportedCount === 1 ? ' was' : 's were'} skipped.`
		}
		return null
	}

	@Spec('Reads one dropped host file into a data URL so the shell can persist it through the virtual filesystem image store.')
	private static async readFileAsDataUrl(file: File): Promise<string> {
		return await new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.addEventListener('load', () => {
				if (typeof reader.result !== 'string') {
					reject(new Error('Expected a string data URL result.'))
					return
				}
				resolve(reader.result)
			})
			reader.addEventListener('error', () => {
				reject(reader.error ?? new Error('Failed to read dropped file.'))
			})
			reader.readAsDataURL(file)
		})
	}
}
