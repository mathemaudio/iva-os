import './ShellWallpaperCatalog.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { ShellWallpaperCatalog } from './ShellWallpaperCatalog.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

@Spec('Covers built-in and VFS-backed wallpaper catalog behavior for shell settings and desktop background rendering.')
export class ShellWallpaperCatalogTest {
	testType = 'unit'

	@Scenario('lists built-in wallpapers and VFS wallpaper files together for settings')
	static async listsBuiltInAndVfsChoices(scenario: ScenarioParameter): Promise<{ choiceCount: number, hasAurora: boolean, hasVfsWallpaper: boolean }> {
		const assert: AssertFn = scenario.assert
		const service = new VirtualFileSystemService(null)
		service.load()
		const wallpapersFolder = service.resolvePath('/Pictures/Wallpapers')
		assert(wallpapersFolder !== null && wallpapersFolder.kind === 'folder', 'Expected /Pictures/Wallpapers to exist in the seeded filesystem')
		service.createBinaryFile(wallpapersFolder.id, 'Sunrise.jpg', 'image/jpeg', 'data:image/jpeg;base64,c3VucmlzZQ==', 'data:image/jpeg;base64,c3VucmlzZQ==')
		const choices = ShellWallpaperCatalog.getChoices(service.getSnapshot())
		const hasAurora = choices.some(choice => choice.id === 'aurora')
		const hasVfsWallpaper = choices.some(choice => choice.label === 'Sunrise.jpg')
		assert(hasAurora, 'Expected the built-in Aurora wallpaper to remain visible')
		assert(hasVfsWallpaper, 'Expected VFS-backed wallpaper files to appear in settings choices')
		return { choiceCount: choices.length, hasAurora, hasVfsWallpaper }
	}

	@Scenario('returns built-in and VFS-backed desktop background styles with fallback behavior')
	static async resolvesBackgroundStyles(scenario: ScenarioParameter): Promise<{ builtInUsesGradient: boolean, vfsUsesImageUrl: boolean, fallbackUsesAurora: boolean }> {
		const assert: AssertFn = scenario.assert
		const service = new VirtualFileSystemService(null)
		service.load()
		const wallpapersFolder = service.resolvePath('/Pictures/Wallpapers')
		assert(wallpapersFolder !== null && wallpapersFolder.kind === 'folder', 'Expected /Pictures/Wallpapers to exist before style resolution testing')
		const createdWallpaper = service.createBinaryFile(wallpapersFolder.id, 'Cliff.jpg', 'image/jpeg', 'data:image/jpeg;base64,Y2xpZmY=', 'data:image/jpeg;base64,Y2xpZmY=')
		const snapshot = service.getSnapshot()
		const builtInStyle = ShellWallpaperCatalog.getBackgroundStyle('grid', snapshot, fileId => service.readBinaryFile(fileId))
		const vfsStyle = ShellWallpaperCatalog.getBackgroundStyle(createdWallpaper.id, snapshot, fileId => service.readBinaryFile(fileId))
		const fallbackStyle = ShellWallpaperCatalog.getBackgroundStyle('missing-node', snapshot, fileId => service.readBinaryFile(fileId))
		const builtInUsesGradient = builtInStyle.includes('gradient')
		const vfsUsesImageUrl = vfsStyle.includes('url(')
		const fallbackUsesAurora = fallbackStyle.includes('rgb(32, 78, 151)')
		assert(builtInUsesGradient, 'Expected built-in wallpapers to resolve to gradient-based backgrounds')
		assert(vfsUsesImageUrl, 'Expected VFS wallpaper selection to resolve to a data-url background image')
		assert(fallbackUsesAurora, 'Expected missing wallpaper ids to fall back to the Aurora background style')
		return { builtInUsesGradient, vfsUsesImageUrl, fallbackUsesAurora }
	}
}
