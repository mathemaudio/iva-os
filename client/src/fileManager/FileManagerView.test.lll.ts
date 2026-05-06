import './FileManagerView.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { FileManagerView } from './FileManagerView.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

@Spec('Exercises the File Manager view through user-visible Sprint 2 interactions.')
export class FileManagerViewTest {
	testType = 'behavioral'

	@Scenario('sidebar and breadcrumbs navigate the shared virtual filesystem')
	static async navigatesViaSidebarAndBreadcrumbs(subjectFactory: SubjectFactory<FileManagerView>, scenario: ScenarioParameter): Promise<{ currentFolder: string, breadcrumbCount: number }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const fileManager = await this.createPreparedFileManager(subjectFactory, waitFor)
		this.click(fileManager, '[data-testid="file-manager-sidebar-Documents"]')
		await waitFor(() => this.readText(fileManager, '[data-testid="file-manager-current-folder"]') === 'Documents', 'Expected Documents to become the current folder')
		this.click(fileManager, '[data-testid="file-manager-breadcrumb-Home"]')
		await waitFor(() => this.readText(fileManager, '[data-testid="file-manager-current-folder"]') === 'Home', 'Expected Home breadcrumb to navigate back to the root folder')
		const currentFolder = this.readText(fileManager, '[data-testid="file-manager-current-folder"]')
		const breadcrumbCount = this.findAll(fileManager, '[data-testid^="file-manager-breadcrumb-"]').length
		assert(currentFolder === 'Home', 'Expected breadcrumb navigation to return to Home')
		assert(breadcrumbCount >= 1, 'Expected at least one breadcrumb to render')
		return { currentFolder, breadcrumbCount }
	}

	@Scenario('grid and list view toggle preserves folder context and selection')
	static async togglesGridAndListPreservingContext(subjectFactory: SubjectFactory<FileManagerView>, scenario: ScenarioParameter): Promise<{ initialMode: string, finalMode: string, selectedNodeName: string }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const fileManager = await this.createPreparedFileManager(subjectFactory, waitFor)
		this.click(fileManager, '[data-testid="file-manager-sidebar-Documents"]')
		await waitFor(() => this.readText(fileManager, '[data-testid="file-manager-current-folder"]') === 'Documents', 'Expected Documents to load before selecting a file')
		this.clickByNodeName(fileManager, 'README.txt')
		const initialMode = this.readViewMode(fileManager)
		this.click(fileManager, '[data-testid="file-manager-action-toggle-view"]')
		await fileManager.updateComplete
		const finalMode = this.readViewMode(fileManager)
		const selectedNodeName = this.readSelectedNodeName(fileManager)
		assert(initialMode === 'grid', 'Expected File Manager to start in grid mode')
		assert(finalMode === 'list', 'Expected toggle to switch into list mode')
		assert(selectedNodeName === 'README.txt', 'Expected selection to persist while switching view modes')
		return { initialMode, finalMode, selectedNodeName }
	}

	@Scenario('creating and renaming entries updates the visible folder immediately')
	static async createsAndRenamesEntries(subjectFactory: SubjectFactory<FileManagerView>, scenario: ScenarioParameter): Promise<{ createdFolderName: string, renamedFileName: string }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const fileManager = await this.createPreparedFileManager(subjectFactory, waitFor)
		this.click(fileManager, '[data-testid="file-manager-action-new-folder"]')
		await waitFor(() => this.hasNodeNamed(fileManager, 'New Folder'), 'Expected New Folder to appear immediately')
		this.click(fileManager, '[data-testid="file-manager-action-new-text-file"]')
		await waitFor(() => this.hasNodeNamed(fileManager, 'Untitled.txt'), 'Expected Untitled.txt to appear immediately')
		this.clickByNodeName(fileManager, 'Untitled.txt')
		await waitFor(() => this.readSelectedNodeName(fileManager) === 'Untitled.txt', 'Expected Untitled.txt to become the current selection before renaming')
		this.click(fileManager, '[data-testid="file-manager-action-rename"]')
		await waitFor(() => this.find(fileManager, '[data-testid="file-manager-rename-dialog"]') !== null, 'Expected rename dialog to open')
		const renameInput = this.find(fileManager, '[data-testid="file-manager-rename-input"]')
		assert(renameInput instanceof HTMLInputElement, 'Expected rename input to render')
		renameInput.value = 'Journal.txt'
		renameInput.dispatchEvent(new Event('input', { bubbles: true }))
		this.click(fileManager, '[data-testid="file-manager-rename-confirm"]')
		await waitFor(() => this.hasNodeNamed(fileManager, 'Journal.txt'), 'Expected renamed file to appear immediately')
		const createdFolderName = this.findNodeByName(fileManager, 'New Folder')?.getAttribute('data-node-name') ?? ''
		const renamedFileName = this.findNodeByName(fileManager, 'Journal.txt')?.getAttribute('data-node-name') ?? ''
		assert(createdFolderName === 'New Folder', 'Expected the new folder to remain visible')
		assert(renamedFileName === 'Journal.txt', 'Expected the renamed file to be visible')
		return { createdFolderName, renamedFileName }
	}

	@Scenario('moving and deleting items refreshes the source listing through shared VFS updates')
	static async movesAndDeletesEntries(subjectFactory: SubjectFactory<FileManagerView>, scenario: ScenarioParameter): Promise<{ movedFileVisibleInDocuments: boolean, removedFromDesktop: boolean, deletedFolderGone: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const fileManager = await this.createPreparedFileManager(subjectFactory, waitFor)
		this.click(fileManager, '[data-testid="file-manager-action-new-folder"]')
		await waitFor(() => this.hasNodeNamed(fileManager, 'New Folder'), 'Expected New Folder to appear on Desktop before deletion testing')
		this.click(fileManager, '[data-testid="file-manager-action-new-text-file"]')
		await waitFor(() => this.hasNodeNamed(fileManager, 'Untitled.txt'), 'Expected Untitled.txt to appear on Desktop before move testing')
		this.clickByNodeName(fileManager, 'Untitled.txt')
		await waitFor(() => this.readSelectedNodeName(fileManager) === 'Untitled.txt', 'Expected Untitled.txt to become the current selection before moving')
		this.click(fileManager, '[data-testid="file-manager-action-move"]')
		await waitFor(() => this.find(fileManager, '[data-testid="file-manager-move-dialog"]') !== null, 'Expected move dialog to open')
		const moveSelect = this.find(fileManager, '[data-testid="file-manager-move-select"]')
		assert(moveSelect instanceof HTMLSelectElement, 'Expected move destination select to render')
		moveSelect.value = this.findOptionValue(moveSelect, '/Documents')
		moveSelect.dispatchEvent(new Event('change', { bubbles: true }))
		this.click(fileManager, '[data-testid="file-manager-move-confirm"]')
		await waitFor(() => this.hasNodeNamed(fileManager, 'Untitled.txt') === false, 'Expected moved file to disappear from Desktop immediately')
		const removedFromDesktop = this.hasNodeNamed(fileManager, 'Untitled.txt') === false
		this.click(fileManager, '[data-testid="file-manager-sidebar-Documents"]')
		await waitFor(() => this.hasNodeNamed(fileManager, 'Untitled.txt'), 'Expected moved file to appear in Documents immediately')
		const movedFileVisibleInDocuments = this.hasNodeNamed(fileManager, 'Untitled.txt')
		this.click(fileManager, '[data-testid="file-manager-breadcrumb-Home"]')
		await waitFor(() => this.readText(fileManager, '[data-testid="file-manager-current-folder"]') === 'Home', 'Expected Home breadcrumb to return to root before delete testing')
		this.clickByNodeName(fileManager, 'New Folder')
		await waitFor(() => this.readSelectedNodeName(fileManager) === 'New Folder', 'Expected New Folder to become the current selection before deleting')
		this.click(fileManager, '[data-testid="file-manager-action-delete"]')
		await waitFor(() => this.find(fileManager, '[data-testid="file-manager-delete-dialog"]') !== null, 'Expected delete dialog to open')
		this.click(fileManager, '[data-testid="file-manager-delete-confirm"]')
		await waitFor(() => this.hasNodeNamed(fileManager, 'New Folder') === false, 'Expected deleted folder to disappear from the current listing')
		const deletedFolderGone = this.hasNodeNamed(fileManager, 'New Folder') === false
		assert(movedFileVisibleInDocuments, 'Expected moved file to appear in the Documents listing')
		assert(removedFromDesktop, 'Expected moved file to leave the Desktop listing')
		assert(deletedFolderGone, 'Expected deleted folder to disappear after confirmation')
		return { movedFileVisibleInDocuments, removedFromDesktop, deletedFolderGone }
	}

	@Spec('Creates a File Manager host with an isolated shared VFS service and waits for first render.')
	private static async createPreparedFileManager(subjectFactory: SubjectFactory<FileManagerView>, waitFor: WaitForFn): Promise<FileManagerView> {
		const fileManager = await subjectFactory()
		if (fileManager.virtualFileSystemService === null) {
			const service = new VirtualFileSystemService(this.createMemoryStorage())
			service.load()
			fileManager.virtualFileSystemService = service
		}
		await waitFor(() => fileManager.shadowRoot !== null, 'Expected File Manager shadow DOM to render')
		await fileManager.updateComplete
		return fileManager
	}

	@Spec('Finds one element in the File Manager shadow root by selector.')
	private static find(fileManager: FileManagerView, selector: string): HTMLElement | null {
		return fileManager.shadowRoot?.querySelector<HTMLElement>(selector) ?? null
	}

	@Spec('Finds all matching elements in the File Manager shadow root.')
	private static findAll(fileManager: FileManagerView, selector: string): HTMLElement[] {
		return Array.from(fileManager.shadowRoot?.querySelectorAll<HTMLElement>(selector) ?? [])
	}

	@Spec('Clicks one element in the File Manager shadow root by selector.')
	private static click(fileManager: FileManagerView, selector: string): void {
		const element = this.find(fileManager, selector)
		if (element === null) {
			throw new Error(`Expected element to exist for selector: ${selector}`)
		}
		element.click()
	}

	@Spec('Clicks the visible node entry that matches one exact node name.')
	private static clickByNodeName(fileManager: FileManagerView, nodeName: string): void {
		const node = this.findNodeByName(fileManager, nodeName)
		if (node === null) {
			throw new Error(`Expected node to exist for name: ${nodeName}`)
		}
		node.click()
	}

	@Spec('Finds the visible node element that matches one exact node name.')
	private static findNodeByName(fileManager: FileManagerView, nodeName: string): HTMLElement | null {
		return this.findAll(fileManager, '[data-testid^="file-manager-node-"]').find(node => node.getAttribute('data-node-name') === nodeName) ?? null
	}

	@Spec('Returns true when the current visible listing contains one exact node name.')
	private static hasNodeNamed(fileManager: FileManagerView, nodeName: string): boolean {
		return this.findNodeByName(fileManager, nodeName) !== null
	}

	@Spec('Reads text content from one element in the File Manager shadow root.')
	private static readText(fileManager: FileManagerView, selector: string): string {
		const element = this.find(fileManager, selector)
		if (element === null) {
			throw new Error(`Expected text element to exist for selector: ${selector}`)
		}
		return element.textContent?.trim() ?? ''
	}

	@Spec('Reads the current visible File Manager view mode from the root data attribute.')
	private static readViewMode(fileManager: FileManagerView): string {
		return this.find(fileManager, '[data-testid="file-manager-view"]')?.getAttribute('data-view-mode') ?? ''
	}

	@Spec('Reads the currently selected node name from the visible listing.')
	private static readSelectedNodeName(fileManager: FileManagerView): string {
		const selectedNode = this.findAll(fileManager, '[data-testid^="file-manager-node-"]').find(node => node.getAttribute('data-selected') === 'true')
		return selectedNode?.getAttribute('data-node-name') ?? ''
	}

	@Spec('Builds an isolated in-memory storage adapter for File Manager behavior tests.')
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

	@Spec('Finds the option value that corresponds to one visible destination path in the move dialog.')
	private static findOptionValue(select: HTMLSelectElement, visibleLabel: string): string {
		const option = Array.from(select.options).find(candidate => candidate.textContent?.trim() === visibleLabel)
		if (option === undefined) {
			throw new Error(`Expected move option to exist: ${visibleLabel}`)
		}
		return option.value
	}
}
