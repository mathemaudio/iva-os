import { Spec } from '@shared/lll.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'
import { FileManagerSnapshot } from '../fileManager/FileManagerSnapshot.lll'

@Spec('Provides built-in wallpaper choices plus VFS-backed wallpaper discovery for the shell settings UI.')
export class ShellWallpaperCatalog {
	private static readonly builtInWallpapers = [
		{
			id: 'aurora',
			label: 'Aurora',
			style: 'background-image: linear-gradient(180deg, rgba(8, 15, 33, 0.18), rgba(7, 10, 20, 0.3)), linear-gradient(135deg, rgb(32, 78, 151), rgb(15, 23, 42) 55%, rgb(56, 189, 248)); background-size: cover; background-position: center; background-repeat: no-repeat;'
		},
		{
			id: 'dunes',
			label: 'Dunes',
			style: 'background-image: linear-gradient(180deg, rgba(41, 24, 12, 0.12), rgba(19, 14, 26, 0.2)), linear-gradient(160deg, rgb(245, 158, 11), rgb(234, 88, 12) 48%, rgb(120, 53, 15)); background-size: cover; background-position: center; background-repeat: no-repeat;'
		},
		{
			id: 'grid',
			label: 'Grid',
			style: 'background-image: radial-gradient(circle at top left, rgba(34, 197, 94, 0.28), transparent 35%), linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(135deg, rgb(15, 23, 42), rgb(17, 94, 89)); background-size: auto, 32px 32px, 32px 32px, auto; background-position: center; background-repeat: no-repeat;'
		}
	]

	@Spec('Returns all wallpaper choices visible in settings, with built-in options first and VFS wallpapers second.')
	static getChoices(snapshot: VirtualFileSystemContract['Snapshot']): Array<{ id: string, label: string }> {
		const choices = this.builtInWallpapers.map(choice => ({ id: choice.id, label: choice.label }))
		const wallpapersFolder = FileManagerSnapshot.resolvePath(snapshot, '/Pictures/Wallpapers')
		if (wallpapersFolder === null || wallpapersFolder.kind !== 'folder') {
			return choices
		}
		for (const childId of snapshot.schema.childrenById[wallpapersFolder.id] ?? []) {
			const childNode = snapshot.schema.nodesById[childId]
			if (childNode?.kind === 'file' && typeof childNode.mimeType === 'string' && childNode.mimeType.startsWith('image/')) {
				choices.push({ id: childNode.id, label: childNode.name })
			}
		}
		return choices
	}

	@Spec('Returns the inline background style for the currently active wallpaper selection, falling back to Aurora when needed.')
	static getBackgroundStyle(activeWallpaper: string, snapshot: VirtualFileSystemContract['Snapshot'], readBinaryFile: (fileId: string) => string | null): string {
		const builtInChoice = this.builtInWallpapers.find(choice => choice.id === activeWallpaper)
		if (builtInChoice !== undefined) {
			return builtInChoice.style
		}
		const wallpaperNode = snapshot.schema.nodesById[activeWallpaper]
		if (wallpaperNode?.kind !== 'file') {
			return this.builtInWallpapers[0].style
		}
		const fileContent = readBinaryFile(activeWallpaper)
		if (typeof fileContent === 'string') {
			return `background-image: url(${fileContent}); background-size: cover; background-position: center; background-repeat: no-repeat;`
		}
		return this.builtInWallpapers[0].style
	}
}
