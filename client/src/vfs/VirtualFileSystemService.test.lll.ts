import './VirtualFileSystemService.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { VirtualFileSystemService } from './VirtualFileSystemService.lll'
import type { VirtualFileSystemContract } from './VirtualFileSystemContract.lll'

@Spec('Covers virtual filesystem pathing, guarded mutations, recursive delete, and persistence behavior.')
export class VirtualFileSystemServiceTest {
	testType = 'unit'

	@Scenario('resolves seeded paths and lists children from the first-run filesystem')
	static async resolvesSeededPathsAndListsChildren(subjectFactory: SubjectFactory<VirtualFileSystemService>, scenario: ScenarioParameter): Promise<{ rootChildren: string[], readmePath: string | null, wallpapersPath: string | null }> {
		const scenarioParameter = this.resolveScenarioParameter(subjectFactory, scenario)
		const assert: AssertFn = scenarioParameter.assert
		const service = new VirtualFileSystemService(this.createMemoryStorage())
		service.load()

		const rootNode = service.resolvePath('/')
		assert(rootNode !== null, 'Expected the root node to resolve')
		const rootChildren = service.listChildren(rootNode.id).map(node => node.name)
		const readmePath = service.resolvePath('/Documents/README.txt')?.name ?? null
		const wallpapersPath = service.resolvePath('/Pictures/Wallpapers')?.name ?? null
		assert(rootChildren.join('|') === 'Desktop|Documents|Downloads|Pictures', 'Expected the seeded top-level folders to be present in order')
		assert(readmePath === 'README.txt', 'Expected README.txt to resolve from the seeded path')
		assert(wallpapersPath === 'Wallpapers', 'Expected the nested Wallpapers folder to resolve')
		return { rootChildren, readmePath, wallpapersPath }
	}

	@Scenario('creates and renames files with unique sibling suffixes when names collide')
	static async createsAndRenamesWithUniqueSiblingSuffixes(subjectFactory: SubjectFactory<VirtualFileSystemService>, scenario: ScenarioParameter): Promise<{ createdName: string, renamedName: string }> {
		const scenarioParameter = this.resolveScenarioParameter(subjectFactory, scenario)
		const assert: AssertFn = scenarioParameter.assert
		const service = new VirtualFileSystemService(this.createMemoryStorage())
		service.load()

		const documentsNode = service.resolvePath('/Documents')
		assert(documentsNode !== null, 'Expected /Documents to exist in the seeded filesystem')
		const createdFile = service.createTextFile(documentsNode.id, 'Notes.txt', 'duplicate file')
		const readmeNode = service.resolvePath('/Documents/README.txt')
		assert(readmeNode !== null, 'Expected /Documents/README.txt to exist before rename')
		const renamedFile = service.renameNode(readmeNode.id, 'Notes.txt')
		assert(createdFile.name === 'Notes (1).txt', 'Expected create collision to produce Notes (1).txt')
		assert(renamedFile.name === 'Notes (2).txt', 'Expected rename collision to skip to the next free suffix')
		return { createdName: createdFile.name, renamedName: renamedFile.name }
	}

	@Scenario('rejects moving a folder into one of its descendants')
	static async rejectsRecursiveFolderMoves(subjectFactory: SubjectFactory<VirtualFileSystemService>, scenario: ScenarioParameter): Promise<{ errorMessage: string }> {
		const scenarioParameter = this.resolveScenarioParameter(subjectFactory, scenario)
		const assert: AssertFn = scenarioParameter.assert
		const service = new VirtualFileSystemService(this.createMemoryStorage())
		service.load()

		const picturesNode = service.resolvePath('/Pictures')
		const wallpapersNode = service.resolvePath('/Pictures/Wallpapers')
		assert(picturesNode !== null, 'Expected /Pictures to exist before move guard testing')
		assert(wallpapersNode !== null, 'Expected /Pictures/Wallpapers to exist before move guard testing')
		let errorMessage = ''
		try {
			service.moveNode(picturesNode.id, wallpapersNode.id)
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : String(error)
		}
		assert(errorMessage.includes('descendants'), 'Expected a descendant move guard error message')
		return { errorMessage }
	}

	@Scenario('deletes folders recursively and removes descendant file content records')
	static async deletesFoldersRecursively(subjectFactory: SubjectFactory<VirtualFileSystemService>, scenario: ScenarioParameter): Promise<{ deletedFolderMissing: boolean, deletedFileMissing: boolean }> {
		const scenarioParameter = this.resolveScenarioParameter(subjectFactory, scenario)
		const assert: AssertFn = scenarioParameter.assert
		const service = new VirtualFileSystemService(this.createMemoryStorage())
		service.load()

		const downloadsNode = service.resolvePath('/Downloads')
		assert(downloadsNode !== null, 'Expected /Downloads to exist before recursive delete testing')
		const projectFolder = service.createFolder(downloadsNode.id, 'Project')
		const nestedFolder = service.createFolder(projectFolder.id, 'Drafts')
		const nestedFile = service.createTextFile(nestedFolder.id, 'Todo.txt', 'todo')
		service.deleteNode(projectFolder.id)
		const deletedFolderMissing = service.getNode(projectFolder.id) === null && service.getNode(nestedFolder.id) === null
		const deletedFileMissing = service.getNode(nestedFile.id) === null
		assert(deletedFolderMissing, 'Expected the deleted folder subtree to disappear from node lookups')
		assert(deletedFileMissing, 'Expected deleted descendant file metadata and content to be removed')
		return { deletedFolderMissing, deletedFileMissing }
	}

	@Scenario('persists mutations to storage and restores them after service reload')
	static async persistsAndReloadsFilesystemState(subjectFactory: SubjectFactory<VirtualFileSystemService>, scenario: ScenarioParameter): Promise<{ restoredFolderName: string | null, restoredFileContent: string | null, writes: number }> {
		const scenarioParameter = this.resolveScenarioParameter(subjectFactory, scenario)
		const assert: AssertFn = scenarioParameter.assert
		const storage = this.createMemoryStorage()
		const firstService = new VirtualFileSystemService(storage, 5)
		firstService.load()
		const desktopNode = firstService.resolvePath('/Desktop')
		assert(desktopNode !== null, 'Expected /Desktop to exist before persistence testing')
		const restoredFolder = firstService.createFolder(desktopNode.id, 'Sprint Docs')
		const restoredFile = firstService.createTextFile(restoredFolder.id, 'Plan.txt', 'sprint 1')
		firstService.writeTextFile(restoredFile.id, 'sprint 1 ready')
		await this.wait(20)

		const secondService = new VirtualFileSystemService(storage, 5)
		secondService.load()
		const restoredFolderName = secondService.resolvePath('/Desktop/Sprint Docs')?.name ?? null
		const restoredFileNode = secondService.resolvePath('/Desktop/Sprint Docs/Plan.txt')
		const restoredFileContent = restoredFileNode === null ? null : secondService.readTextFile(restoredFileNode.id)
		assert(restoredFolderName === 'Sprint Docs', 'Expected the created folder to persist across service reload')
		assert(restoredFileContent === 'sprint 1 ready', 'Expected the edited file content to persist across service reload')
		assert(storage.writeCount >= 1, 'Expected persistence writes to reach the storage adapter')
		return { restoredFolderName, restoredFileContent, writes: storage.writeCount }
	}

	@Scenario('recovers from corrupt storage by reseeding and surfacing a warning')
	static async recoversFromCorruptStorage(subjectFactory: SubjectFactory<VirtualFileSystemService>, scenario: ScenarioParameter): Promise<{ warning: string | null, hasDocuments: boolean }> {
		const scenarioParameter = this.resolveScenarioParameter(subjectFactory, scenario)
		const assert: AssertFn = scenarioParameter.assert
		const storage = this.createMemoryStorage()
		storage.setItem('iva.vfs.v1', '{not-json')
		const service = new VirtualFileSystemService(storage, 5)
		const snapshot = service.load()
		const hasDocuments = service.resolvePath('/Documents') !== null
		assert(snapshot.warning !== null, 'Expected corrupt storage recovery to surface a warning')
		assert(hasDocuments, 'Expected corrupt storage recovery to reseed the filesystem')
		return { warning: snapshot.warning, hasDocuments }
	}

	@Spec('Resolves the actual scenario parameter when the client test runner forwards either one or two callback arguments.')
	private static resolveScenarioParameter(subjectFactory: SubjectFactory<VirtualFileSystemService>, scenario: ScenarioParameter | undefined): ScenarioParameter {
		if (scenario !== undefined) {
			return scenario
		}
		return subjectFactory as unknown as ScenarioParameter
	}

	@Spec('Builds an isolated in-memory storage adapter for deterministic persistence tests.')
	private static createMemoryStorage(): VirtualFileSystemContract['StorageLike'] & { writeCount: number } {
		const valuesByKey: Record<string, string> = {}
		return {
			writeCount: 0,
			getItem(key: string): string | null {
				return key in valuesByKey ? valuesByKey[key] : null
			},
			setItem(key: string, value: string): void {
				valuesByKey[key] = value
				this.writeCount += 1
			},
			removeItem(key: string): void {
				delete valuesByKey[key]
			}
		}
	}

	@Spec('Waits briefly so debounced persistence writes can complete inside unit tests.')
	private static async wait(durationMs: number): Promise<void> {
		await new Promise(resolve => {
			globalThis.setTimeout(resolve, durationMs)
		})
	}
}
