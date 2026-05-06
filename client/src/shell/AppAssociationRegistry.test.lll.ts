import './AppAssociationRegistry.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { AppAssociationRegistry } from './AppAssociationRegistry.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Covers default application associations for VFS folders, text files, and image files.')
export class AppAssociationRegistryTest {
	testType = 'unit'

	@Scenario('maps folders, text files, and image files to their default shell apps')
	static async resolvesDefaultAppIds(scenario: ScenarioParameter): Promise<{ folderAppId: string | null, textAppId: string | null, imageAppId: string | null }> {
		const assert: AssertFn = scenario.assert
		const folderNode = this.createNode('folder', 'Documents', null, null)
		const textNode = this.createNode('file', 'README.txt', 'txt', 'text/plain')
		const imageNode = this.createNode('file', 'Photo.jpg', 'jpg', 'image/jpeg')
		const folderAppId = AppAssociationRegistry.resolveDefaultAppId(folderNode)
		const textAppId = AppAssociationRegistry.resolveDefaultAppId(textNode)
		const imageAppId = AppAssociationRegistry.resolveDefaultAppId(imageNode)
		assert(folderAppId === 'file-manager', 'Expected folders to open in File Manager')
		assert(textAppId === 'text-editor', 'Expected text files to open in Text Editor')
		assert(imageAppId === 'image-viewer', 'Expected image files to open in Image Viewer')
		return { folderAppId, textAppId, imageAppId }
	}

	@Scenario('recognizes text and image files from fallback mime and extension rules')
	static async recognizesMimeAndExtensionFallbacks(scenario: ScenarioParameter): Promise<{ jsonIsText: boolean, webpIsImage: boolean, unsupportedAppId: string | null }> {
		const assert: AssertFn = scenario.assert
		const jsonNode = this.createNode('file', 'Data.json', 'json', 'application/json')
		const webpNode = this.createNode('file', 'Backdrop.webp', 'webp', null)
		const unsupportedNode = this.createNode('file', 'Archive.bin', 'bin', 'application/octet-stream')
		const jsonIsText = AppAssociationRegistry.isTextFile(jsonNode)
		const webpIsImage = AppAssociationRegistry.isImageFile(webpNode)
		const unsupportedAppId = AppAssociationRegistry.resolveDefaultAppId(unsupportedNode)
		assert(jsonIsText, 'Expected JSON files to be treated as editable text')
		assert(webpIsImage, 'Expected WebP files to be treated as images even without a mime type')
		assert(unsupportedAppId === null, 'Expected unsupported files to have no default app association')
		return { jsonIsText, webpIsImage, unsupportedAppId }
	}

	@Spec('Builds one minimal VFS node fixture for association registry unit tests.')
	private static createNode(kind: 'folder' | 'file', name: string, extension: string | null, mimeType: string | null): VirtualFileSystemContract['Node'] {
		return {
			id: `${kind}-${name}`,
			kind,
			name,
			parentId: 'root',
			mimeType,
			extension,
			size: 0,
			createdAt: '2025-01-01T09:41:00.000Z',
			updatedAt: '2025-01-01T09:41:00.000Z'
		}
	}
}
