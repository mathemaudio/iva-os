import './PlatformFileSystemService.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { PlatformFileSystemService } from './PlatformFileSystemService.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

@Spec('Covers the platform filesystem service wrapper over the shared virtual filesystem implementation.')
export class PlatformFileSystemServiceTest {
	testType = 'behavioral'

	@Scenario('proxies snapshot reads and basic file mutations through the platform filesystem contract')
	static async proxiesFilesystemOperations(subjectFactory: SubjectFactory<PlatformFileSystemService>, scenario: ScenarioParameter): Promise<{ rootExists: boolean, createdFolderName: string | null, savedContent: string | null }> {
		const assert: AssertFn = scenario.assert
		void subjectFactory
		const service = new VirtualFileSystemService(null)
		service.load()
		const platformService = new PlatformFileSystemService(service)
		const rootNode = platformService.resolvePath('/')
		const documentsFolder = platformService.resolvePath('/Documents')
		assert(rootNode !== null && rootNode.kind === 'folder', 'Expected the root folder to resolve through the platform filesystem service')
		assert(documentsFolder !== null && documentsFolder.kind === 'folder', 'Expected Documents to resolve through the platform filesystem service')
		const createdFolder = platformService.createFolder(documentsFolder.id, 'Projects')
		const createdFile = platformService.createTextFile(createdFolder.id, 'Notes.txt', 'draft')
		platformService.writeTextFile(createdFile.id, 'saved')
		const savedContent = platformService.readTextFile(createdFile.id)
		assert(createdFolder.name === 'Projects', 'Expected folder creation to proxy through the platform filesystem service')
		assert(savedContent === 'saved', 'Expected text writes to proxy through the platform filesystem service')
		return { rootExists: true, createdFolderName: createdFolder.name, savedContent }
	}
}
