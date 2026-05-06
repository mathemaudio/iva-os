import { LitElement, html, type PropertyValues, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import { FileManagerFormatting } from './FileManagerFormatting.lll'
import { FileManagerSnapshot } from './FileManagerSnapshot.lll'
import { FileManagerViewStyles } from './FileManagerViewStyles.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

@Spec('Renders the Sprint 2 file manager browsing experience on top of the shared virtual filesystem service.')
@customElement('iva-file-manager-view')
export class FileManagerView extends LitElement {
	static styles = FileManagerViewStyles.styles

	@property({ attribute: false })
	virtualFileSystemService: VirtualFileSystemService | null = null

	@property({ attribute: false })
	requestedFolderId: string | null = null

	@property({ attribute: false })
	onOpenNode: ((nodeId: string, currentFolderId: string) => void) | null = null

	@state()
	private snapshot: VirtualFileSystemContract['Snapshot'] | null = null

	@state()
	private currentFolderId: string = ''

	@state()
	private selectedNodeId: string | null = null

	@state()
	private focusedNodeId: string | null = null

	@state()
	private viewMode: 'grid' | 'list' = 'grid'

	@state()
	private renameNodeId: string | null = null

	@state()
	private renameValue: string = ''

	@state()
	private moveNodeId: string | null = null

	@state()
	private moveDestinationFolderId: string = ''

	@state()
	private deleteNodeId: string | null = null

	@state()
	private errorMessage: string | null = null

	private unsubscribe: (() => void) | null = null

	@Spec('Attaches to the shared virtual filesystem service after the view connects to the DOM.')
	connectedCallback(): void {
		super.connectedCallback()
		this.attachToService()
	}

	@Spec('Releases the virtual filesystem subscription when the view disconnects from the DOM.')
	disconnectedCallback(): void {
		if (this.unsubscribe !== null) {
			this.unsubscribe()
			this.unsubscribe = null
		}
		super.disconnectedCallback()
	}

	@Spec('Reattaches to the shared virtual filesystem service when the injected service property changes.')
	updated(changedProperties: PropertyValues<this>): void {
		if (changedProperties.has('virtualFileSystemService')) {
			this.attachToService()
		}
		if (changedProperties.has('requestedFolderId')) {
			this.applyRequestedFolderId()
		}
	}

	@Spec('Renders the full File Manager sidebar, toolbar, breadcrumbs, content view, and active modal state.')
	render(): TemplateResult {
		if (this.snapshot === null) {
			return html`<div class="status-pill" data-testid="file-manager-loading">Loading shared filesystem…</div>`
		}

		const currentFolderNode = FileManagerSnapshot.getCurrentFolder(this.snapshot, this.currentFolderId)
		const visibleNodes = FileManagerSnapshot.getChildren(this.snapshot, currentFolderNode.id)
		const selectedNode = this.selectedNodeId === null ? null : this.snapshot.schema.nodesById[this.selectedNodeId] ?? null
		const sidebarLocations = FileManagerSnapshot.getSidebarLocations(this.snapshot)
		const breadcrumbs = FileManagerSnapshot.getBreadcrumbs(this.snapshot, currentFolderNode.id)
		const renameNode = this.renameNodeId === null ? null : this.snapshot.schema.nodesById[this.renameNodeId] ?? null
		const moveNode = this.moveNodeId === null ? null : this.snapshot.schema.nodesById[this.moveNodeId] ?? null
		const deleteNode = this.deleteNodeId === null ? null : this.snapshot.schema.nodesById[this.deleteNodeId] ?? null
		const folderChoices = this.moveNodeId === null ? [] : FileManagerSnapshot.getMoveDestinationFolders(this.snapshot, this.moveNodeId)
		const currentFolderName = currentFolderNode.name === '' ? 'Home' : currentFolderNode.name
		return html`
			<div class="file-manager" data-testid="file-manager-view" data-view-mode=${this.viewMode}>
				<aside class="sidebar">
					<h3>Locations</h3>
					<div class="sidebar-list">
						${sidebarLocations.map(location => html`
							<button
								class="sidebar-button"
								data-testid=${`file-manager-sidebar-${location.name}`}
								data-active=${String(currentFolderNode.id === location.id)}
								@click=${() => this.navigateToFolder(location.id)}
							>
								${location.name}
							</button>
						`)}
					</div>
				</aside>
				<section class="main">
					<div class="toolbar">
						<button data-testid="file-manager-action-new-folder" @click=${() => this.createFolder()}>New Folder</button>
						<button data-testid="file-manager-action-new-text-file" @click=${() => this.createTextFile()}>New Text File</button>
						<button data-testid="file-manager-action-open" ?disabled=${selectedNode === null} @click=${() => this.openSelectedNode()}>Open</button>
						<button data-testid="file-manager-action-rename" ?disabled=${selectedNode === null} @click=${() => this.beginRename()}>Rename</button>
						<button data-testid="file-manager-action-move" ?disabled=${selectedNode === null} @click=${() => this.beginMove()}>Move</button>
						<button data-testid="file-manager-action-delete" ?disabled=${selectedNode === null} @click=${() => this.beginDelete()}>Delete</button>
						<button data-testid="file-manager-action-toggle-view" @click=${() => this.toggleViewMode()}>${this.viewMode === 'grid' ? 'Switch to List' : 'Switch to Grid'}</button>
						<button data-testid="file-manager-action-upload" @click=${() => this.triggerUpload()}>Upload</button>
						<input
							id="file-manager-upload-input"
							class="sr-only"
							data-testid="file-manager-upload-input"
							type="file"
							multiple
							accept=".txt,.md,.json,text/*,image/*"
							@change=${(event: Event) => this.onUploadChange(event)}
						/>
					</div>
					<div class="location-bar">
						<div class="current-folder" data-testid="file-manager-current-folder">${currentFolderName}</div>
						<div class="breadcrumbs" data-testid="file-manager-breadcrumbs">
							${breadcrumbs.map((node, index) => html`
								${index === 0 ? null : html`<span>/</span>`}
								<button
									class="breadcrumb-button"
									data-testid=${`file-manager-breadcrumb-${node.name === '' ? 'Home' : node.name}`}
									@click=${() => this.navigateToFolder(node.id)}
								>
									${node.name === '' ? 'Home' : node.name}
								</button>
							`)}
						</div>
					</div>
					<div class="status-stack">
						${this.snapshot.warning === null ? null : html`<div class="status-pill" data-testid="file-manager-warning">⚠️ ${this.snapshot.warning}</div>`}
						${this.errorMessage === null ? null : html`<div class="error-pill" data-testid="file-manager-error">${this.errorMessage}</div>`}
					</div>
					<div class="content-region">
						${visibleNodes.length === 0 ? this.renderEmptyState() : this.renderContentView(visibleNodes)}
					</div>
				</section>
				${renameNode === null ? null : this.renderRenameDialog(renameNode)}
				${moveNode === null ? null : this.renderMoveDialog(moveNode, folderChoices)}
				${deleteNode === null ? null : this.renderDeleteDialog(deleteNode)}
			</div>
		`
	}

	@Spec('Renders the empty-folder placeholder for the current visible location.')
	private renderEmptyState(): TemplateResult {
		return html`
			<div class="empty-state" data-testid="file-manager-empty-state">
				<strong>This folder is empty.</strong>
				<span>Create a folder, add a text file, or upload content here.</span>
			</div>
		`
	}

	@Spec('Renders either the grid or list representation for the current folder content.')
	private renderContentView(nodes: VirtualFileSystemContract['Node'][]): TemplateResult {
		if (this.viewMode === 'grid') {
			return html`<div class="grid-view" data-testid="file-manager-grid-view">${nodes.map(node => this.renderGridNode(node))}</div>`
		}
		return html`
			<div class="list-view" data-testid="file-manager-list-view">
				<div class="list-header"><span>Name</span><span>Type</span><span>Modified</span><span>Size</span></div>
				${nodes.map(node => this.renderListNode(node))}
			</div>
		`
	}

	@Spec('Renders one visible node inside the icon-first grid view.')
	private renderGridNode(node: VirtualFileSystemContract['Node']): TemplateResult {
		return html`
			<button
				class="node-card"
				data-testid=${`file-manager-node-${node.id}`}
				data-node-name=${node.name}
				data-node-kind=${node.kind}
				data-selected=${String(this.selectedNodeId === node.id)}
				data-focused=${String(this.focusedNodeId === node.id)}
				@click=${() => this.selectNode(node.id)}
				@dblclick=${() => this.activateNode(node.id)}
				@focus=${() => this.focusNode(node.id)}
				@keydown=${(event: KeyboardEvent) => this.onNodeKeyDown(node.id, event)}
			>
				<div class="node-preview">${this.renderNodePreview(node, 'grid')}</div>
				<div class="node-title">${node.name}</div>
				<div class="node-meta">${FileManagerFormatting.describeNodeType(node)}</div>
			</button>
		`
	}

	@Spec('Renders one visible node inside the list view with Name, Type, Modified, and Size columns.')
	private renderListNode(node: VirtualFileSystemContract['Node']): TemplateResult {
		return html`
			<button
				class="node-row"
				data-testid=${`file-manager-node-${node.id}`}
				data-node-name=${node.name}
				data-node-kind=${node.kind}
				data-selected=${String(this.selectedNodeId === node.id)}
				data-focused=${String(this.focusedNodeId === node.id)}
				@click=${() => this.selectNode(node.id)}
				@dblclick=${() => this.activateNode(node.id)}
				@focus=${() => this.focusNode(node.id)}
				@keydown=${(event: KeyboardEvent) => this.onNodeKeyDown(node.id, event)}
			>
				<span class="node-row-name">${this.renderNodePreview(node, 'list')}<span>${node.name}</span></span>
				<span>${FileManagerFormatting.describeNodeType(node)}</span>
				<span>${FileManagerFormatting.formatModifiedLabel(node.updatedAt)}</span>
				<span>${FileManagerFormatting.formatSizeLabel(node)}</span>
			</button>
		`
	}

	@Spec('Renders either a thumbnail or a fallback icon preview for one file-system node.')
	private renderNodePreview(node: VirtualFileSystemContract['Node'], mode: 'grid' | 'list'): TemplateResult {
		const binarySource = node.kind === 'file' && typeof node.mimeType === 'string' && node.mimeType.startsWith('image/')
			? node.thumbnailDataUrl ?? this.virtualFileSystemService?.readBinaryFile(node.id) ?? null
			: null
		if (binarySource !== null) {
			if (mode === 'list') {
				return html`<img class="row-thumbnail" src=${binarySource} alt=${node.name} />`
			}
			return html`<img src=${binarySource} alt=${node.name} />`
		}
		const symbol = node.kind === 'folder' ? '📁' : typeof node.mimeType === 'string' && node.mimeType.startsWith('image/') ? '🖼️' : '📄'
		return html`<span>${symbol}</span>`
	}

	@Spec('Renders the rename dialog for the current selection.')
	private renderRenameDialog(node: VirtualFileSystemContract['Node']): TemplateResult {
		return html`
			<div class="dialog-scrim">
				<div class="dialog" data-testid="file-manager-rename-dialog">
					<h3>Rename ${node.name}</h3>
					<input data-testid="file-manager-rename-input" .value=${this.renameValue} @input=${(event: Event) => this.onRenameValueChange(event)} />
					<div class="dialog-actions">
						<button data-testid="file-manager-rename-cancel" @click=${() => this.cancelRename()}>Cancel</button>
						<button data-testid="file-manager-rename-confirm" @click=${() => this.confirmRename()}>Save</button>
					</div>
				</div>
			</div>
		`
	}

	@Spec('Renders the move dialog and destination folder picker for the current selection.')
	private renderMoveDialog(node: VirtualFileSystemContract['Node'], folderChoices: Array<{ id: string, path: string }>): TemplateResult {
		return html`
			<div class="dialog-scrim">
				<div class="dialog" data-testid="file-manager-move-dialog">
					<h3>Move ${node.name}</h3>
					<p>Choose a destination folder.</p>
					<select data-testid="file-manager-move-select" .value=${this.moveDestinationFolderId} @change=${(event: Event) => this.onMoveDestinationChange(event)}>
						${folderChoices.map(folder => html`<option .value=${folder.id}>${folder.path}</option>`)}
					</select>
					<div class="dialog-actions">
						<button data-testid="file-manager-move-cancel" @click=${() => this.cancelMove()}>Cancel</button>
						<button data-testid="file-manager-move-confirm" @click=${() => this.confirmMove()}>Move</button>
					</div>
				</div>
			</div>
		`
	}

	@Spec('Renders the delete confirmation dialog for the current selection.')
	private renderDeleteDialog(node: VirtualFileSystemContract['Node']): TemplateResult {
		return html`
			<div class="dialog-scrim">
				<div class="dialog" data-testid="file-manager-delete-dialog">
					<h3>Delete ${node.name}?</h3>
					<p>${node.kind === 'folder' ? 'This removes the folder and all of its contents.' : 'This removes the selected file.'}</p>
					<div class="dialog-actions">
						<button data-testid="file-manager-delete-cancel" @click=${() => this.cancelDelete()}>Cancel</button>
						<button data-testid="file-manager-delete-confirm" @click=${() => this.confirmDelete()}>Delete</button>
					</div>
				</div>
			</div>
		`
	}

	@Spec('Attaches the component to the latest shared filesystem service and refreshes the rendered snapshot.')
	private attachToService(): void {
		if (this.unsubscribe !== null) {
			this.unsubscribe()
			this.unsubscribe = null
		}
		if (this.virtualFileSystemService === null) {
			this.snapshot = null
			return
		}
		this.snapshot = this.virtualFileSystemService.getSnapshot()
		this.synchronizeSelectionState()
		this.unsubscribe = this.virtualFileSystemService.subscribe(snapshot => {
			this.snapshot = snapshot
			this.synchronizeSelectionState()
		})
	}

	@Spec('Keeps current folder, selection, focus, and modal ids valid as the filesystem changes underneath the UI.')
	private synchronizeSelectionState(): void {
		if (this.snapshot === null) {
			return
		}
		const synchronizedState = FileManagerSnapshot.synchronizeViewState(this.snapshot, {
			currentFolderId: this.currentFolderId,
			selectedNodeId: this.selectedNodeId,
			focusedNodeId: this.focusedNodeId,
			renameNodeId: this.renameNodeId,
			moveNodeId: this.moveNodeId,
			deleteNodeId: this.deleteNodeId
		})
		this.currentFolderId = synchronizedState.currentFolderId
		this.selectedNodeId = synchronizedState.selectedNodeId
		this.focusedNodeId = synchronizedState.focusedNodeId
		this.renameNodeId = synchronizedState.renameNodeId
		this.moveNodeId = synchronizedState.moveNodeId
		this.deleteNodeId = synchronizedState.deleteNodeId
		if (this.renameNodeId === null) {
			this.renameValue = ''
		}
		if (this.moveNodeId === null) {
			this.moveDestinationFolderId = ''
		}
		this.applyRequestedFolderId()
	}

	@Spec('Applies the latest shell-requested folder target when it points at a valid folder node.')
	private applyRequestedFolderId(): void {
		if (this.snapshot === null || this.requestedFolderId === null) {
			return
		}
		const requestedFolder = this.snapshot.schema.nodesById[this.requestedFolderId] ?? null
		if (requestedFolder?.kind !== 'folder' || this.currentFolderId === requestedFolder.id) {
			return
		}
		this.currentFolderId = requestedFolder.id
		this.selectedNodeId = null
		this.focusedNodeId = null
		this.errorMessage = null
	}

	@Spec('Navigates the file manager route to a selected folder and clears transient selection state.')
	private navigateToFolder(folderId: string): void {
		if (this.snapshot === null) {
			return
		}
		const folderNode = this.snapshot.schema.nodesById[folderId]
		if (folderNode === undefined || folderNode.kind !== 'folder') {
			return
		}
		this.currentFolderId = folderId
		this.selectedNodeId = null
		this.focusedNodeId = null
		this.errorMessage = null
	}

	@Spec('Selects one visible node as the current single selection.')
	private selectNode(nodeId: string): void {
		this.selectedNodeId = nodeId
		this.focusedNodeId = nodeId
		this.errorMessage = null
	}

	@Spec('Activates a node on double-click by routing through the shared shell open callback when available.')
	private activateNode(nodeId: string): void {
		if (this.snapshot === null) {
			return
		}
		const node = this.snapshot.schema.nodesById[nodeId] ?? null
		if (node === null) {
			return
		}
		this.selectNode(node.id)
		if (this.onOpenNode !== null) {
			this.onOpenNode(node.id, this.getCurrentFolderNode()?.id ?? this.snapshot.schema.rootId)
			return
		}
		if (node.kind === 'folder') {
			this.navigateToFolder(node.id)
		}
	}

	@Spec('Marks one visible node as the keyboard-focused target.')
	private focusNode(nodeId: string): void {
		this.focusedNodeId = nodeId
	}

	@Spec('Supports keyboard-friendly navigation and activation from visible node cards and rows.')
	private onNodeKeyDown(nodeId: string, event: KeyboardEvent): void {
		if (event.key === 'Enter') {
			this.activateNode(nodeId)
			return
		}
		if (event.key === ' ') {
			event.preventDefault()
			this.selectNode(nodeId)
			return
		}
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
			event.preventDefault()
			this.moveFocusedSelection(nodeId, 1)
			return
		}
		if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			event.preventDefault()
			this.moveFocusedSelection(nodeId, -1)
		}
	}

	@Spec('Moves keyboard focus to a nearby visible node in the current folder content view.')
	private moveFocusedSelection(nodeId: string, offset: number): void {
		if (this.snapshot === null) {
			return
		}
		const currentFolderNode = FileManagerSnapshot.getCurrentFolder(this.snapshot, this.currentFolderId)
		const nodes = FileManagerSnapshot.getChildren(this.snapshot, currentFolderNode.id)
		const currentIndex = nodes.findIndex(node => node.id === nodeId)
		if (currentIndex === -1) {
			return
		}
		const nextIndex = currentIndex + offset
		if (nextIndex < 0 || nextIndex >= nodes.length) {
			return
		}
		const nextNode = nodes[nextIndex]
		this.selectedNodeId = nextNode.id
		this.focusedNodeId = nextNode.id
		const nextElement = this.renderRoot.querySelector<HTMLElement>(`[data-testid="file-manager-node-${nextNode.id}"]`)
		nextElement?.focus()
	}

	@Spec('Opens the currently selected node through the same activation path used by double-click and keyboard enter.')
	private openSelectedNode(): void {
		if (this.selectedNodeId === null) {
			return
		}
		this.activateNode(this.selectedNodeId)
	}

	@Spec('Toggles the visible folder content between grid and list modes while preserving folder context and selection.')
	private toggleViewMode(): void {
		this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid'
	}

	@Spec('Creates a new folder inside the current location and immediately selects it.')
	private createFolder(): void {
		const currentFolderNode = this.getCurrentFolderNode()
		if (currentFolderNode === null || this.virtualFileSystemService === null) {
			return
		}
		try {
			const folder = this.virtualFileSystemService.createFolder(currentFolderNode.id, 'New Folder')
			this.selectedNodeId = folder.id
			this.focusedNodeId = folder.id
			this.errorMessage = null
		} catch (error) {
			this.errorMessage = FileManagerFormatting.readErrorMessage(error)
		}
	}

	@Spec('Creates a new text file inside the current location and immediately selects it.')
	private createTextFile(): void {
		const currentFolderNode = this.getCurrentFolderNode()
		if (currentFolderNode === null || this.virtualFileSystemService === null) {
			return
		}
		try {
			const file = this.virtualFileSystemService.createTextFile(currentFolderNode.id, 'Untitled.txt', '')
			this.selectedNodeId = file.id
			this.focusedNodeId = file.id
			this.errorMessage = null
		} catch (error) {
			this.errorMessage = FileManagerFormatting.readErrorMessage(error)
		}
	}

	@Spec('Opens the rename dialog for the current selection and seeds it with the visible name.')
	private beginRename(): void {
		const node = this.getSelectedNode()
		if (node === null) {
			this.errorMessage = 'Select a file or folder before renaming.'
			return
		}
		this.renameNodeId = node.id
		this.renameValue = node.name
		this.errorMessage = null
	}

	@Spec('Updates the rename dialog input state from user typing.')
	private onRenameValueChange(event: Event): void {
		const input = event.target
		if (input instanceof HTMLInputElement) {
			this.renameValue = input.value
		}
	}

	@Spec('Closes the rename dialog without changing the filesystem.')
	private cancelRename(): void {
		this.renameNodeId = null
		this.renameValue = ''
	}

	@Spec('Commits the rename dialog value to the shared filesystem and keeps the renamed item selected.')
	private confirmRename(): void {
		if (this.virtualFileSystemService === null || this.renameNodeId === null) {
			return
		}
		try {
			const renamedNode = this.virtualFileSystemService.renameNode(this.renameNodeId, this.renameValue)
			this.selectedNodeId = renamedNode.id
			this.focusedNodeId = renamedNode.id
			this.renameNodeId = null
			this.renameValue = ''
			this.errorMessage = null
		} catch (error) {
			this.errorMessage = FileManagerFormatting.readErrorMessage(error)
		}
	}

	@Spec('Opens the move dialog for the current selection and seeds the destination with the first valid folder.')
	private beginMove(): void {
		if (this.snapshot === null) {
			return
		}
		const node = this.getSelectedNode()
		if (node === null) {
			this.errorMessage = 'Select a file or folder before moving it.'
			return
		}
		this.moveNodeId = node.id
		const folderChoices = FileManagerSnapshot.getMoveDestinationFolders(this.snapshot, node.id)
		this.moveDestinationFolderId = folderChoices.length === 0 ? '' : folderChoices[0].id
		this.errorMessage = null
	}

	@Spec('Updates the chosen destination folder in the move dialog.')
	private onMoveDestinationChange(event: Event): void {
		const select = event.target
		if (select instanceof HTMLSelectElement) {
			this.moveDestinationFolderId = select.value
		}
	}

	@Spec('Closes the move dialog without changing the filesystem.')
	private cancelMove(): void {
		this.moveNodeId = null
		this.moveDestinationFolderId = ''
	}

	@Spec('Moves the selected item into the chosen destination folder and relies on the shared VFS subscription to refresh the view.')
	private confirmMove(): void {
		if (this.virtualFileSystemService === null || this.moveNodeId === null || this.moveDestinationFolderId === '') {
			return
		}
		try {
			this.virtualFileSystemService.moveNode(this.moveNodeId, this.moveDestinationFolderId)
			this.selectedNodeId = null
			this.focusedNodeId = null
			this.moveNodeId = null
			this.moveDestinationFolderId = ''
			this.errorMessage = null
		} catch (error) {
			this.errorMessage = FileManagerFormatting.readErrorMessage(error)
		}
	}

	@Spec('Opens the delete confirmation dialog for the current selection.')
	private beginDelete(): void {
		const node = this.getSelectedNode()
		if (node === null) {
			this.errorMessage = 'Select a file or folder before deleting it.'
			return
		}
		this.deleteNodeId = node.id
		this.errorMessage = null
	}

	@Spec('Closes the delete confirmation dialog without changing the filesystem.')
	private cancelDelete(): void {
		this.deleteNodeId = null
	}

	@Spec('Deletes the selected file or folder recursively when needed and clears the selection.')
	private confirmDelete(): void {
		if (this.virtualFileSystemService === null || this.deleteNodeId === null) {
			return
		}
		try {
			this.virtualFileSystemService.deleteNode(this.deleteNodeId)
			this.selectedNodeId = null
			this.focusedNodeId = null
			this.deleteNodeId = null
			this.errorMessage = null
		} catch (error) {
			this.errorMessage = FileManagerFormatting.readErrorMessage(error)
		}
	}

	@Spec('Opens the hidden file input so host files can be imported into the current virtual folder.')
	private triggerUpload(): void {
		const input = this.renderRoot.querySelector<HTMLInputElement>('#file-manager-upload-input')
		input?.click()
	}

	@Spec('Imports supported host text and image files into the current folder of the shared virtual filesystem.')
	private async onUploadChange(event: Event): Promise<void> {
		const currentFolderNode = this.getCurrentFolderNode()
		if (currentFolderNode === null || this.virtualFileSystemService === null) {
			return
		}
		const input = event.target
		if (!(input instanceof HTMLInputElement) || input.files === null) {
			return
		}
		const uploadedFiles = Array.from(input.files)
		let unsupportedCount = 0
		for (const uploadedFile of uploadedFiles) {
			const extension = FileManagerFormatting.readExtension(uploadedFile.name)
			const isTextFile = uploadedFile.type.startsWith('text/') || extension === 'txt' || extension === 'md' || extension === 'json'
			const isImageFile = uploadedFile.type.startsWith('image/') || extension === 'png' || extension === 'jpg' || extension === 'jpeg' || extension === 'webp' || extension === 'gif'
			if (isTextFile) {
				const content = await uploadedFile.text()
				this.virtualFileSystemService.createTextFile(currentFolderNode.id, uploadedFile.name, content)
				continue
			}
			if (isImageFile) {
				const dataUrl = await this.readFileAsDataUrl(uploadedFile)
				const mimeType = uploadedFile.type === '' ? FileManagerFormatting.inferImageMimeType(uploadedFile.name) : uploadedFile.type
				this.virtualFileSystemService.createBinaryFile(currentFolderNode.id, uploadedFile.name, mimeType, dataUrl, dataUrl)
				continue
			}
			unsupportedCount += 1
		}
		input.value = ''
		this.errorMessage = unsupportedCount > 0
			? `${String(unsupportedCount)} file${unsupportedCount === 1 ? '' : 's'} could not be imported because only text and image uploads are supported right now.`
			: null
	}

	@Spec('Reads one host file into a data URL so it can be persisted through the virtual filesystem binary payload table.')
	private async readFileAsDataUrl(file: File): Promise<string> {
		return await new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.addEventListener('load', () => {
				if (typeof reader.result !== 'string') {
					reject(new Error('Expected a string data URL result.'))
					return
				}
				resolve(reader.result)
			})
			reader.addEventListener('error', () => {
				reject(reader.error ?? new Error('Failed to read host file.'))
			})
			reader.readAsDataURL(file)
		})
	}

	@Spec('Returns the active current folder node when the snapshot is ready.')
	private getCurrentFolderNode(): VirtualFileSystemContract['Node'] | null {
		if (this.snapshot === null) {
			return null
		}
		return FileManagerSnapshot.getCurrentFolder(this.snapshot, this.currentFolderId)
	}

	@Spec('Returns the currently selected node when one exists in the active snapshot.')
	private getSelectedNode(): VirtualFileSystemContract['Node'] | null {
		if (this.snapshot === null || this.selectedNodeId === null) {
			return null
		}
		return this.snapshot.schema.nodesById[this.selectedNodeId] ?? null
	}
}
