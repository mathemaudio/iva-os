import { Spec } from '@shared/lll.lll'
import type { FileManagerView } from './FileManagerView.lll'
import { FileManagerFormatting } from './FileManagerFormatting.lll'

@Spec('Imports host files into one VFS folder for the File Manager while preserving browser-supported text and image handling rules.')
export class FileManagerDropImporter {
	public constructor(private readonly source: FileManagerView) {
		Spec('Stores the owning File Manager view so host file imports can reuse its platform filesystem boundary.')
	}

	@Spec('Imports supported text and image files into one target folder and returns how many files were skipped as unsupported.')
	public async importFilesIntoFolder(uploadedFiles: File[], folderId: string): Promise<number> {
		if (this.source.platformContext === null) {
			return uploadedFiles.length
		}
		let unsupportedCount = 0
		for (const uploadedFile of uploadedFiles) {
			const extension = FileManagerFormatting.readExtension(uploadedFile.name)
			const isTextFile = uploadedFile.type.startsWith('text/') || extension === 'txt' || extension === 'md' || extension === 'json'
			const isImageFile = uploadedFile.type.startsWith('image/') || extension === 'png' || extension === 'jpg' || extension === 'jpeg' || extension === 'webp' || extension === 'gif'
			if (isTextFile) {
				const content = await uploadedFile.text()
				this.source.platformContext.filesystem.createTextFile(folderId, uploadedFile.name, content)
				continue
			}
			if (isImageFile) {
				const dataUrl = await this.readFileAsDataUrl(uploadedFile)
				const mimeType = uploadedFile.type === '' ? FileManagerFormatting.inferImageMimeType(uploadedFile.name) : uploadedFile.type
				this.source.platformContext.filesystem.createBinaryFile(folderId, uploadedFile.name, mimeType, dataUrl, dataUrl)
				continue
			}
			unsupportedCount += 1
		}
		return unsupportedCount
	}

	@Spec('Reads one host file into a data URL so it can be persisted through the virtual filesystem binary payload table.')
	public async readFileAsDataUrl(file: File): Promise<string> {
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
				reject(reader.error ?? new Error('Failed to read host file.'))
			})
			reader.readAsDataURL(file)
		})
	}
}
