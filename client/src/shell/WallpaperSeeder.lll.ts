import { Spec } from '@shared/lll.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

@Spec('Seeds the shared virtual filesystem with curated Unsplash wallpapers when the wallpapers folder is empty.')
export class WallpaperSeeder {
	private static readonly curatedWallpapers = [
		{ fileName: 'Coastal Dawn.jpg', imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80' },
		{ fileName: 'Mountain Light.jpg', imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80' },
		{ fileName: 'Forest Horizon.jpg', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80' },
		{ fileName: 'Calm Lake.jpg', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80' },
		{ fileName: 'Desert Sky.jpg', imageUrl: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1600&q=80' }
	]

	@Spec('Creates the wallpapers folder when missing and imports curated Unsplash images when that folder has no content yet.')
	static async seedIfNeeded(virtualFileSystemService: VirtualFileSystemService, fetchLike?: typeof globalThis.fetch): Promise<string[]> {
		const wallpapersFolder = this.ensureWallpapersFolder(virtualFileSystemService)
		if (virtualFileSystemService.listChildren(wallpapersFolder.id).length > 0) {
			return []
		}
		if (fetchLike === undefined) {
			return []
		}
		const createdWallpaperIds: string[] = []
		for (const wallpaper of this.curatedWallpapers) {
			try {
				const response = await fetchLike(wallpaper.imageUrl)
				if (response.ok !== true) {
					continue
				}
				const blob = await response.blob()
				const dataUrl = await this.readBlobAsDataUrl(blob)
				const createdNode = virtualFileSystemService.createBinaryFile(
					wallpapersFolder.id,
					wallpaper.fileName,
					blob.type === '' ? 'image/jpeg' : blob.type,
					dataUrl,
					dataUrl
				)
				createdWallpaperIds.push(createdNode.id)
			} catch {
				continue
			}
		}
		return createdWallpaperIds
	}

	@Spec('Ensures the Pictures and Wallpapers folders exist before wallpaper seed work begins.')
	private static ensureWallpapersFolder(virtualFileSystemService: VirtualFileSystemService): { id: string } {
		const rootNode = virtualFileSystemService.resolvePath('/')
		if (rootNode === null || rootNode.kind !== 'folder') {
			throw new Error('The virtual filesystem root folder is unavailable.')
		}
		const picturesFolder = virtualFileSystemService.resolvePath('/Pictures') ?? virtualFileSystemService.createFolder(rootNode.id, 'Pictures')
		const wallpapersFolder = virtualFileSystemService.resolvePath('/Pictures/Wallpapers') ?? virtualFileSystemService.createFolder(picturesFolder.id, 'Wallpapers')
		if (wallpapersFolder.kind !== 'folder') {
			throw new Error('The wallpapers location must be a folder.')
		}
		return wallpapersFolder
	}

	@Spec('Reads one downloaded image blob into a data URL for VFS persistence.')
	private static async readBlobAsDataUrl(blob: Blob): Promise<string> {
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
				reject(reader.error ?? new Error('Failed to read downloaded wallpaper data.'))
			})
			reader.readAsDataURL(blob)
		})
	}
}
