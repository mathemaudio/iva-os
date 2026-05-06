import './WallpaperSeeder.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { WallpaperSeeder } from './WallpaperSeeder.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Covers Unsplash wallpaper seeding behavior for the shared virtual filesystem.')
export class WallpaperSeederTest {
	testType = 'unit'

	@Scenario('creates curated wallpapers only when the wallpapers folder is empty')
	static async seedsCuratedWallpapersIntoEmptyFolder(scenario: ScenarioParameter): Promise<{ createdCount: number, folderChildCount: number, firstMimeType: string | null }> {
		const assert: AssertFn = scenario.assert
		const service = new VirtualFileSystemService(this.createMemoryStorage())
		service.load()
		const createdIds = await WallpaperSeeder.seedIfNeeded(service, this.createFetchStub())
		const wallpapersFolder = service.resolvePath('/Pictures/Wallpapers')
		assert(wallpapersFolder !== null && wallpapersFolder.kind === 'folder', 'Expected /Pictures/Wallpapers to exist after seeding')
		const children = service.listChildren(wallpapersFolder.id)
		const firstMimeType = createdIds.length === 0 ? null : service.getNode(createdIds[0])?.mimeType ?? null
		assert(createdIds.length === 5, 'Expected five curated wallpapers to be created on first run')
		assert(children.length === 5, 'Expected the wallpapers folder to contain five imported files after seeding')
		assert(firstMimeType === 'image/jpeg', 'Expected seeded wallpaper files to use image/jpeg metadata')
		return { createdCount: createdIds.length, folderChildCount: children.length, firstMimeType }
	}

	@Scenario('skips repeated seeding when the wallpapers folder already contains files')
	static async skipsSeedingWhenFolderAlreadyHasFiles(scenario: ScenarioParameter): Promise<{ firstRunCount: number, secondRunCount: number, folderChildCount: number }> {
		const assert: AssertFn = scenario.assert
		const service = new VirtualFileSystemService(this.createMemoryStorage())
		service.load()
		const firstRunIds = await WallpaperSeeder.seedIfNeeded(service, this.createFetchStub())
		const secondRunIds = await WallpaperSeeder.seedIfNeeded(service, this.createFetchStub())
		const wallpapersFolder = service.resolvePath('/Pictures/Wallpapers')
		assert(wallpapersFolder !== null && wallpapersFolder.kind === 'folder', 'Expected /Pictures/Wallpapers to exist after repeated seeding attempts')
		const folderChildCount = service.listChildren(wallpapersFolder.id).length
		assert(firstRunIds.length === 5, 'Expected the first run to import five wallpapers')
		assert(secondRunIds.length === 0, 'Expected the second run to skip seeding because wallpapers already exist')
		assert(folderChildCount === 5, 'Expected the wallpapers folder to keep exactly the first seeded files')
		return { firstRunCount: firstRunIds.length, secondRunCount: secondRunIds.length, folderChildCount }
	}

	@Spec('Builds an isolated in-memory storage adapter for deterministic wallpaper seeding tests.')
	private static createMemoryStorage(): VirtualFileSystemContract['StorageLike'] {
		const valuesByKey: Record<string, string> = {}
		return {
			getItem(key: string): string | null {
				return key in valuesByKey ? valuesByKey[key] : null
			},
			setItem(key: string, value: string): void {
				valuesByKey[key] = value
			},
			removeItem(key: string): void {
				delete valuesByKey[key]
			}
		}
	}

	@Spec('Builds a tiny successful fetch stub that returns a JPEG blob suitable for wallpaper data-url conversion.')
	private static createFetchStub(): typeof globalThis.fetch {
		return (async (): Promise<Response> => {
			const blob = new Blob(['seeded-wallpaper'], { type: 'image/jpeg' })
			return new Response(blob, { status: 200 })
		}) as typeof globalThis.fetch
	}
}
