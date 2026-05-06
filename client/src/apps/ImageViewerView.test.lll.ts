import './ImageViewerView.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { ImageViewerView } from './ImageViewerView.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Exercises the VFS-backed Image Viewer through observable open and missing-file behavior.')
export class ImageViewerViewTest {
	testType = 'behavioral'

	@Scenario('opens a VFS image file and renders its metadata and preview source')
	static async opensImageFromVfs(subjectFactory: SubjectFactory<ImageViewerView>, scenario: ScenarioParameter): Promise<{ metadataLabel: string, imageSourcePrefix: string, title: string }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const service = new VirtualFileSystemService(this.createMemoryStorage())
		service.load()
		const picturesFolder = service.resolvePath('/Pictures')
		assert(picturesFolder !== null && picturesFolder.kind === 'folder', 'Expected the Pictures folder to exist before viewer testing')
		const imageNode = service.createBinaryFile(picturesFolder.id, 'Poster.jpg', 'image/jpeg', 'data:image/jpeg;base64,cG9zdGVy', 'data:image/jpeg;base64,cG9zdGVy')
		let title = ''
		const viewer = await subjectFactory()
		viewer.virtualFileSystemService = service
		viewer.snapshot = service.getSnapshot()
		viewer.fileNodeId = imageNode.id
		viewer.onTitleChange = (nextTitle: string): void => {
			title = nextTitle
		}
		await waitFor(() => viewer.shadowRoot !== null, 'Expected Image Viewer shadow DOM to render')
		await viewer.updateComplete
		const metadataLabel = this.readText(viewer, '[data-testid="image-viewer-metadata"] strong')
		const image = this.find(viewer, '[data-testid="image-viewer-image"]')
		assert(image instanceof HTMLImageElement, 'Expected the image viewer to render an image element')
		const imageSourcePrefix = image.getAttribute('src')?.slice(0, 15) ?? ''
		assert(metadataLabel === 'Poster.jpg', 'Expected the image viewer metadata to show the active file name')
		assert(imageSourcePrefix === 'data:image/jpeg', 'Expected the image viewer to bind the VFS data-url payload as the preview source')
		assert(title === 'Poster.jpg', 'Expected the viewer to publish the opened file name as the window title')
		return { metadataLabel, imageSourcePrefix, title }
	}

	@Scenario('shows a recoverable missing-file state when the opened image disappears from the VFS')
	static async showsMissingFileState(subjectFactory: SubjectFactory<ImageViewerView>, scenario: ScenarioParameter): Promise<{ title: string, errorMessage: string }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const service = new VirtualFileSystemService(this.createMemoryStorage())
		service.load()
		const picturesFolder = service.resolvePath('/Pictures')
		assert(picturesFolder !== null && picturesFolder.kind === 'folder', 'Expected the Pictures folder to exist before deletion testing')
		const imageNode = service.createBinaryFile(picturesFolder.id, 'Poster.jpg', 'image/jpeg', 'data:image/jpeg;base64,cG9zdGVy', 'data:image/jpeg;base64,cG9zdGVy')
		let title = ''
		const viewer = await subjectFactory()
		viewer.virtualFileSystemService = service
		viewer.snapshot = service.getSnapshot()
		viewer.fileNodeId = imageNode.id
		viewer.onTitleChange = (nextTitle: string): void => {
			title = nextTitle
		}
		await waitFor(() => viewer.shadowRoot !== null, 'Expected Image Viewer shadow DOM to render before deletion')
		await viewer.updateComplete
		service.deleteNode(imageNode.id)
		viewer.snapshot = service.getSnapshot()
		viewer.fileNodeId = `${imageNode.id}-missing`
		await viewer.updateComplete
		viewer.fileNodeId = imageNode.id
		await viewer.updateComplete
		const errorMessage = this.readText(viewer, '[data-testid="image-viewer-error"]')
		assert(title.includes('(missing)'), 'Expected the viewer title to reflect the missing-file state after deletion')
		assert(errorMessage.includes('deleted') || errorMessage.includes('longer available'), 'Expected the viewer to explain the recoverable missing image state')
		return { title, errorMessage }
	}

	@Spec('Finds one element in the Image Viewer shadow root by selector.')
	private static find(viewer: ImageViewerView, selector: string): HTMLElement | null {
		return viewer.shadowRoot?.querySelector<HTMLElement>(selector) ?? null
	}

	@Spec('Reads text content from one element in the Image Viewer shadow root.')
	private static readText(viewer: ImageViewerView, selector: string): string {
		const element = this.find(viewer, selector)
		if (element === null) {
			throw new Error(`Expected text element to exist for selector: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Builds an isolated in-memory storage adapter for deterministic image-viewer behavior tests.')
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
