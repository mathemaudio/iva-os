import './ShellFileDrop.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { ShellFileDrop } from './ShellFileDrop.lll'
import { PlatformTestContextFactory } from '../../platform/PlatformTestContextFactory.lll'

@Spec('Exercises the shell drag-drop overlay and message UI through browser-like drag events.')
export class ShellFileDropTest {
	testType = 'behavioral'

	@Scenario('shows a shell-styled oversized upload alert after a too-large image is dropped onto Desktop')
	static async showsOversizedImageMessage(subjectFactory: SubjectFactory<ShellFileDrop>, scenario: ScenarioParameter): Promise<{ messageText: string, overlayVisibleAfterDrop: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const shellFileDrop = await subjectFactory()
		document.body.append(shellFileDrop)
		shellFileDrop.filesystem = PlatformTestContextFactory.createApplicationContext('file-manager', this.createMemoryStorage(), null, null).context.filesystem
		await waitFor(() => shellFileDrop.shadowRoot !== null, 'Expected the shell drag-drop surface to render its shadow DOM')
		const desktopTarget = document.createElement('div')
		desktopTarget.setAttribute('data-drop-folder-path', '/Desktop')
		window.dispatchEvent(this.createDragEvent('dragenter', [this.createImageFile('Huge.png', 2 * 1024 * 1024 + 1)], [desktopTarget]))
		await shellFileDrop.updateComplete
		assert(this.find(shellFileDrop, '[data-testid="shell-file-drop-overlay"]') !== null, 'Expected the drag overlay to appear while a file drag is active')
		window.dispatchEvent(this.createDragEvent('drop', [this.createImageFile('Huge.png', 2 * 1024 * 1024 + 1)], [desktopTarget]))
		await waitFor(() => this.find(shellFileDrop, '[data-testid="shell-file-drop-message"]') !== null, 'Expected the shell drop message to appear after the oversized file is dropped')
		const messageText = this.readText(shellFileDrop, '[data-testid="shell-file-drop-message"]')
		const overlayVisibleAfterDrop = this.find(shellFileDrop, '[data-testid="shell-file-drop-overlay"]') !== null
		assert(messageText.includes('larger than 2 megabytes'), 'Expected the shell drop alert to explain the 2 megabyte limit')
		assert(overlayVisibleAfterDrop === false, 'Expected the drag overlay to disappear once the drop finishes')
		shellFileDrop.remove()
		return { messageText, overlayVisibleAfterDrop }
	}

	@Spec('Creates one deterministic in-memory storage adapter for isolated shell drop view tests.')
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

	@Spec('Builds one File instance that behaves like a browser-dropped image payload with a controlled byte size.')
	private static createImageFile(fileName: string, size: number): File {
		const file = new File(['x'], fileName, { type: 'image/png' })
		Object.defineProperty(file, 'size', { value: size })
		return file
	}

	@Spec('Builds one DragEvent-like object for the shell drag-drop behavioral tests.')
	private static createDragEvent(type: string, files: File[], path: EventTarget[]): Event {
		const event = new Event(type, { bubbles: true, cancelable: true, composed: true })
		const dataTransferLike = {
			files,
			types: ['Files'],
			dropEffect: 'copy',
			effectAllowed: 'all'
		}
		Object.defineProperty(event, 'dataTransfer', { value: dataTransferLike as unknown as DataTransfer })
		Object.defineProperty(event, 'composedPath', { value: (): EventTarget[] => path })
		return event
	}

	@Spec('Finds one element in the shell drag-drop shadow root by selector.')
	private static find(shellFileDrop: ShellFileDrop, selector: string): HTMLElement | null {
		return shellFileDrop.shadowRoot?.querySelector<HTMLElement>(selector) ?? null
	}

	@Spec('Reads trimmed text content from one element in the shell drag-drop shadow root.')
	private static readText(shellFileDrop: ShellFileDrop, selector: string): string {
		const element = this.find(shellFileDrop, selector)
		if (element === null) {
			throw new Error(`Expected shell drag-drop text element to exist for selector: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
	}
}
