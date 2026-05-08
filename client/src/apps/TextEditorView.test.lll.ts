import './TextEditorView.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { TextEditorView } from './TextEditorView.lll'
import { PlatformTestContextFactory } from '../platform/PlatformTestContextFactory.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Exercises the VFS-backed Text Editor through observable open, save, and Save As behavior.')
export class TextEditorViewTest {
	testType = 'behavioral'

	@Scenario('opens a text file, marks dirty state, and saves content back into the shared VFS')
	static async opensAndSavesExistingFile(subjectFactory: SubjectFactory<TextEditorView>, scenario: ScenarioParameter): Promise<{ titleAfterDirty: string, titleAfterSave: string, savedContent: string | null }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const storage = this.createMemoryStorage()
		const seedContext = PlatformTestContextFactory.createApplicationContext('text-editor', storage, null, null)
		const fileNode = seedContext.virtualFileSystemService.resolvePath('/Documents/README.txt')
		assert(fileNode !== null && fileNode.kind === 'file', 'Expected the seeded README.txt file to exist before editor testing')
		const titles: string[] = []
		const editor = await subjectFactory()
		const context = PlatformTestContextFactory.createApplicationContext('text-editor', storage, fileNode.id, fileNode.parentId, (title: string) => {
			titles.push(title)
		})
		editor.platformContext = context.context
		await waitFor(() => editor.shadowRoot !== null, 'Expected Text Editor shadow DOM to render')
		await editor.updateComplete
		const textarea = this.find(editor, '[data-testid="text-editor-textarea"]')
		assert(textarea instanceof HTMLTextAreaElement, 'Expected the text editor textarea to render')
		textarea.value = 'Edited text content'
		textarea.dispatchEvent(new Event('input', { bubbles: true }))
		await editor.updateComplete
		this.click(editor, '[data-testid="text-editor-save"]')
		await editor.updateComplete
		const titleAfterDirty = titles.find(title => title.includes('*')) ?? ''
		const titleAfterSave = titles[titles.length - 1] ?? ''
		const savedContent = context.virtualFileSystemService.readTextFile(fileNode.id)
		assert(titleAfterDirty.includes('*'), 'Expected typing to mark the title as dirty')
		assert(titleAfterSave === 'README.txt', 'Expected saving to restore the clean file title')
		assert(savedContent === 'Edited text content', 'Expected save to persist edited text back into the shared VFS')
		return { titleAfterDirty, titleAfterSave, savedContent }
	}

	@Scenario('creates a new text file through Save As when no file is open')
	static async savesNewDocumentViaSaveAs(subjectFactory: SubjectFactory<TextEditorView>, scenario: ScenarioParameter): Promise<{ createdFileName: string | null, createdContent: string | null, emittedNodeId: string | null }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const storage = this.createMemoryStorage()
		const seedContext = PlatformTestContextFactory.createApplicationContext('text-editor', storage, null, null)
		const documentsFolder = seedContext.virtualFileSystemService.resolvePath('/Documents')
		assert(documentsFolder !== null && documentsFolder.kind === 'folder', 'Expected the Documents folder to exist before Save As testing')
		let emittedNodeId: string | null = null
		const editor = await subjectFactory()
		const context = PlatformTestContextFactory.createApplicationContext('text-editor', storage, null, documentsFolder.id, undefined, (nodeId: string | null) => {
			emittedNodeId = nodeId
		})
		editor.platformContext = context.context
		await waitFor(() => editor.shadowRoot !== null, 'Expected Text Editor shadow DOM to render')
		await editor.updateComplete
		const textarea = this.find(editor, '[data-testid="text-editor-textarea"]')
		assert(textarea instanceof HTMLTextAreaElement, 'Expected the text editor textarea to render before Save As')
		textarea.value = 'Fresh journal entry'
		textarea.dispatchEvent(new Event('input', { bubbles: true }))
		await editor.updateComplete
		this.click(editor, '[data-testid="text-editor-save-as"]')
		await waitFor(() => this.find(editor, '[data-testid="text-editor-save-as-dialog"]') !== null, 'Expected Save As dialog to open')
		const fileNameInput = this.find(editor, '[data-testid="text-editor-save-as-name"]')
		assert(fileNameInput instanceof HTMLInputElement, 'Expected Save As file name input to render')
		fileNameInput.value = 'Journal.txt'
		fileNameInput.dispatchEvent(new Event('input', { bubbles: true }))
		this.click(editor, '[data-testid="text-editor-save-as-confirm"]')
		await editor.updateComplete
		const createdFile = context.virtualFileSystemService.resolvePath('/Documents/Journal.txt')
		const createdFileName = createdFile?.name ?? null
		const createdContent = createdFile === null ? null : context.virtualFileSystemService.readTextFile(createdFile.id)
		assert(createdFileName === 'Journal.txt', 'Expected Save As to create Journal.txt in the Documents folder')
		assert(createdContent === 'Fresh journal entry', 'Expected Save As to persist the current editor draft')
		assert(emittedNodeId === createdFile?.id, 'Expected Save As to notify the shell about the new active file id')
		return { createdFileName, createdContent, emittedNodeId }
	}

	@Spec('Finds one element in the Text Editor shadow root by selector.')
	private static find(editor: TextEditorView, selector: string): HTMLElement | null {
		return editor.shadowRoot?.querySelector<HTMLElement>(selector) ?? null
	}

	@Spec('Clicks one element in the Text Editor shadow root by selector.')
	private static click(editor: TextEditorView, selector: string): void {
		const element = this.find(editor, selector)
		if (element === null) {
			throw new Error(`Expected element to exist for selector: ${selector}`)
		}
		element.click()
	}

	@Spec('Builds an isolated in-memory storage adapter for deterministic editor behavior tests.')
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
