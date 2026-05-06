import './FileManagerSnapshot.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { FileManagerSnapshot } from './FileManagerSnapshot.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

@Spec('Covers snapshot navigation helpers used by the File Manager UI.')
export class FileManagerSnapshotTest {
	testType = 'unit'

	@Scenario('derives sidebar shortcuts, breadcrumbs, and valid move destinations from a VFS snapshot')
	static async derivesSnapshotNavigationState(scenario: ScenarioParameter): Promise<{ sidebarCount: number, breadcrumbs: string[], destinationPaths: string[] }> {
		const assert: AssertFn = scenario.assert
		const service = new VirtualFileSystemService(null)
		let snapshot = service.load()
		const documentsFolder = service.resolvePath('/Documents')
		const picturesFolder = service.resolvePath('/Pictures')
		assert(documentsFolder !== null, 'Expected /Documents to exist in the seeded VFS')
		assert(picturesFolder !== null, 'Expected /Pictures to exist in the seeded VFS')
		const projectFolder = service.createFolder(documentsFolder.id, 'Project')
		service.createFolder(projectFolder.id, 'Drafts')
		snapshot = service.getSnapshot()
		const sidebarCount = FileManagerSnapshot.getSidebarLocations(snapshot).length
		const breadcrumbs = FileManagerSnapshot.getBreadcrumbs(snapshot, projectFolder.id).map(node => node.name === '' ? 'Home' : node.name)
		const destinationPaths = FileManagerSnapshot.getMoveDestinationFolders(snapshot, projectFolder.id).map(folder => folder.path)
		assert(sidebarCount === 5, 'Expected the seeded sidebar locations to include five entries')
		assert(breadcrumbs.join('|') === 'Home|Documents|Project', 'Expected breadcrumbs to reflect the Project folder chain')
		assert(destinationPaths.includes('/Pictures'), 'Expected unrelated folders to remain valid move destinations')
		assert(destinationPaths.includes('/Documents/Project') === false, 'Expected a folder to be excluded from moving into itself')
		return { sidebarCount, breadcrumbs, destinationPaths }
	}
}
