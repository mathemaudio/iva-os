import './PlatformTestContextFactory.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { PlatformTestContextFactory } from './PlatformTestContextFactory.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Covers the isolated platform test-context factory used by app view tests.')
export class PlatformTestContextFactoryTest {
	testType = 'unit'

	@Scenario('creates isolated application contexts with seeded filesystem access and window callbacks')
	static async createsIsolatedContexts(scenario: ScenarioParameter): Promise<{ hasDocumentsFolder: boolean, title: string, openedNodeId: string | null }> {
		const assert: AssertFn = scenario.assert
		let title = ''
		let openedNodeId: string | null = null
		const context = PlatformTestContextFactory.createApplicationContext(
			'text-editor',
			this.createMemoryStorage(),
			null,
			null,
			(nextTitle: string) => {
				title = nextTitle
			},
			(nodeId: string | null) => {
				openedNodeId = nodeId
			}
		)
		const documentsFolder = context.virtualFileSystemService.resolvePath('/Documents')
		context.context.window.setTitle('Journal.txt')
		context.context.window.setOpenedNodeId('node-5')
		assert(documentsFolder !== null && documentsFolder.kind === 'folder', 'Expected the isolated platform test context to seed the Documents folder')
		assert(title === 'Journal.txt', 'Expected the isolated platform test context to wire title callbacks')
		assert(openedNodeId === 'node-5', 'Expected the isolated platform test context to wire opened-node callbacks')
		return { hasDocumentsFolder: true, title, openedNodeId }
	}

	@Spec('Builds an isolated in-memory storage adapter for platform test-context unit tests.')
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
}
