import './FileManagerFormatting.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { FileManagerFormatting } from './FileManagerFormatting.lll'

@Spec('Covers formatting helpers used by the File Manager UI.')
export class FileManagerFormattingTest {
	testType = 'unit'

	@Scenario('formats visible node labels, sizes, and inferred import metadata')
	static async formatsFileManagerLabels(scenario: ScenarioParameter): Promise<{ folderType: string, imageType: string, textType: string, smallSize: string, inferredMimeType: string }> {
		const assert: AssertFn = scenario.assert
		const folderType = FileManagerFormatting.describeNodeType({
			id: 'folder-1',
			kind: 'folder',
			name: 'Pictures',
			parentId: 'root',
			mimeType: null,
			extension: null,
			size: 0,
			createdAt: '2025-01-01T09:41:00.000Z',
			updatedAt: '2025-01-01T09:41:00.000Z'
		})
		const imageType = FileManagerFormatting.describeNodeType({
			id: 'file-1',
			kind: 'file',
			name: 'Photo.png',
			parentId: 'root',
			mimeType: 'image/png',
			extension: 'png',
			size: 2048,
			createdAt: '2025-01-01T09:41:00.000Z',
			updatedAt: '2025-01-01T09:41:00.000Z'
		})
		const textType = FileManagerFormatting.describeNodeType({
			id: 'file-2',
			kind: 'file',
			name: 'README.txt',
			parentId: 'root',
			mimeType: 'text/plain',
			extension: 'txt',
			size: 15,
			createdAt: '2025-01-01T09:41:00.000Z',
			updatedAt: '2025-01-01T09:41:00.000Z'
		})
		const smallSize = FileManagerFormatting.formatSizeLabel({
			id: 'file-3',
			kind: 'file',
			name: 'Plan.txt',
			parentId: 'root',
			mimeType: 'text/plain',
			extension: 'txt',
			size: 99,
			createdAt: '2025-01-01T09:41:00.000Z',
			updatedAt: '2025-01-01T09:41:00.000Z'
		})
		const inferredMimeType = FileManagerFormatting.inferImageMimeType('wallpaper.webp')
		assert(folderType === 'Folder', 'Expected folders to format as Folder')
		assert(imageType === 'Image', 'Expected image files to format as Image')
		assert(textType === 'Text', 'Expected text files to format as Text')
		assert(smallSize === '99 B', 'Expected small file sizes to render in bytes')
		assert(inferredMimeType === 'image/webp', 'Expected webp imports to infer image/webp')
		return { folderType, imageType, textType, smallSize, inferredMimeType }
	}
}
