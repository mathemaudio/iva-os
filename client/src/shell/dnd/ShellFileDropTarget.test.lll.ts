import './ShellFileDropTarget.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { ShellFileDropTarget } from './ShellFileDropTarget.lll'
import { PlatformTestContextFactory } from '../../platform/PlatformTestContextFactory.lll'

@Spec('Covers browser-visible folder resolution and size validation for shell drag-and-drop image uploads.')
export class ShellFileDropTargetTest {
	testType = 'unit'

	@Scenario('imports a dropped image into the visible desktop target when the browser exposes that drop location')
	static async importsImageIntoDesktopTarget(scenario: ScenarioParameter): Promise<{ importedIntoDesktop: boolean, message: string | null }> {
		const assert: AssertFn = scenario.assert
		const testContext = PlatformTestContextFactory.createApplicationContext('file-manager', this.createMemoryStorage(), null, null)
		const desktopFolder = testContext.virtualFileSystemService.resolvePath('/Desktop')
		assert(desktopFolder !== null && desktopFolder.kind === 'folder', 'Expected the seeded Desktop folder to exist before shell drop testing')
		const event = this.createDragEvent([this.createImageFile('Poster.png', 1024)], [this.createDropElement('desktop-surface', { 'data-drop-folder-path': '/Desktop' })])
		const message = await ShellFileDropTarget.importDroppedImages(event, testContext.context.filesystem)
		const importedNode = testContext.virtualFileSystemService.resolvePath('/Desktop/Poster.png')
		const importedIntoDesktop = importedNode !== null && importedNode.kind === 'file'
		assert(importedIntoDesktop, 'Expected the dropped image to be imported into the Desktop folder')
		assert(message === null, 'Expected a successful image drop not to produce an error message')
		return { importedIntoDesktop, message }
	}

	@Scenario('rejects dropped images larger than two megabytes with the shell message')
	static async rejectsOversizedImages(scenario: ScenarioParameter): Promise<{ errorMessage: string | null, importedNodeExists: boolean }> {
		const assert: AssertFn = scenario.assert
		const testContext = PlatformTestContextFactory.createApplicationContext('file-manager', this.createMemoryStorage(), null, null)
		const event = this.createDragEvent([this.createImageFile('Huge.png', 2 * 1024 * 1024 + 1)], [this.createDropElement('desktop-surface', { 'data-drop-folder-path': '/Desktop' })])
		const errorMessage = await ShellFileDropTarget.importDroppedImages(event, testContext.context.filesystem)
		const importedNodeExists = testContext.virtualFileSystemService.resolvePath('/Desktop/Huge.png') !== null
		assert(errorMessage === 'This image is larger than 2 megabytes, so it cannot be uploaded here.', 'Expected the oversized image warning to match the shell wording exactly')
		assert(importedNodeExists === false, 'Expected oversized images not to be imported into the filesystem')
		return { errorMessage, importedNodeExists }
	}

	@Scenario('resolves the currently visible File Manager folder when the drop lands on a folder card')
	static async resolvesOpenFolderTarget(scenario: ScenarioParameter): Promise<{ resolvedFolderName: string | null }> {
		const assert: AssertFn = scenario.assert
		const testContext = PlatformTestContextFactory.createApplicationContext('file-manager', this.createMemoryStorage(), null, null)
		const picturesFolder = testContext.virtualFileSystemService.resolvePath('/Pictures')
		assert(picturesFolder !== null && picturesFolder.kind === 'folder', 'Expected the seeded Pictures folder to exist before folder-target resolution testing')
		const event = this.createDragEvent([], [this.createDropElement('folder-card', { 'data-drop-folder-path': '/Pictures' })])
		const resolvedFolderId = ShellFileDropTarget.resolveFolderIdFromEvent(event, testContext.context.filesystem)
		const resolvedFolder = resolvedFolderId === null ? null : testContext.context.filesystem.getNode(resolvedFolderId)
		const resolvedFolderName = resolvedFolder?.name ?? null
		assert(resolvedFolderName === 'Pictures', 'Expected the browser drop path to resolve to the visible Pictures folder')
		return { resolvedFolderName }
	}

	@Spec('Creates a deterministic in-memory storage adapter for isolated shell drop tests.')
	private static createMemoryStorage(): { getItem: (key: string) => string | null, setItem: (key: string, value: string) => void, removeItem: (key: string) => void } {
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

	@Spec('Builds one File instance that behaves like a browser-dropped image payload with a forced byte size.')
	private static createImageFile(fileName: string, size: number): File {
		const file = new File(['x'], fileName, { type: 'image/png' })
		Object.defineProperty(file, 'size', { value: size })
		return file
	}

	@Spec('Creates one HTMLElement-like drop path entry with the requested shell-target attributes.')
	private static createDropElement(testId: string, attributes: Record<string, string>): HTMLElement {
		const element = document.createElement('div')
		element.setAttribute('data-testid', testId)
		for (const [attributeName, attributeValue] of Object.entries(attributes)) {
			element.setAttribute(attributeName, attributeValue)
		}
		return element
	}

	@Spec('Builds one DragEvent-like object with file payload metadata and a composed path for unit testing.')
	private static createDragEvent(files: File[], path: EventTarget[]): DragEvent {
		const dataTransferLike = {
			files,
			types: ['Files'],
			dropEffect: 'copy',
			effectAllowed: 'all'
		}
		return {
			dataTransfer: dataTransferLike as unknown as DataTransfer,
			composedPath(): EventTarget[] {
				return path
			}
		} as unknown as DragEvent
	}
}
