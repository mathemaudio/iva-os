import { LitElement, css, html, type PropertyValues, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import { FileManagerSnapshot } from '../fileManager/FileManagerSnapshot.lll'
import type { PlatformContract } from '../platform/PlatformContract.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Renders the VFS-backed Text Editor with open, edit, save, and Save As flows.')
@customElement('iva-text-editor-view')
export class TextEditorView extends LitElement {
	static styles = css`
		:host {
			--text-editor-scrollbar-track: var(--shell-scrollbar-track, rgba(255, 255, 255, 0.08));
			--text-editor-scrollbar-thumb: var(--shell-scrollbar-thumb, rgba(226, 232, 240, 0.58));
			--text-editor-scrollbar-thumb-hover: var(--shell-scrollbar-thumb-hover, rgba(241, 245, 249, 0.78));
			--text-editor-scrollbar-corner: var(--shell-scrollbar-corner, rgba(255, 255, 255, 0.04));
			display: grid;
			height: 100%;
			min-height: 0;
			color-scheme: inherit;
		}

		.editor {
			display: grid;
			grid-template-rows: auto auto 1fr;
			gap: calc(12px * var(--shell-density-scale, 1));
			height: 100%;
			min-height: 0;
		}

		.toolbar,
		.status,
		.dialog {
			padding: calc(12px * var(--shell-density-scale, 1));
			border-radius: calc(14px * var(--shell-density-scale, 1));
			background: rgba(255, 255, 255, 0.08);
			border: 1px solid rgba(255, 255, 255, 0.12);
		}

		.toolbar {
			display: flex;
			flex-wrap: wrap;
			gap: calc(10px * var(--shell-density-scale, 1));
			align-items: center;
			justify-content: space-between;
		}

		.toolbar-actions {
			display: flex;
			flex-wrap: wrap;
			gap: calc(10px * var(--shell-density-scale, 1));
		}

		button,
		select,
		input,
		textarea {
			font: inherit;
		}

		button,
		select,
		input {
			border-radius: calc(12px * var(--shell-density-scale, 1));
			border: 1px solid rgba(255, 255, 255, 0.14);
			background: rgba(255, 255, 255, 0.08);
			color: inherit;
		}

		button {
			padding: calc(9px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			cursor: pointer;
		}

		select,
		input {
			padding: calc(10px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
		}

		textarea {
			width: 100%;
			height: 100%;
			min-height: calc(220px * var(--shell-density-scale, 1));
			padding: calc(14px * var(--shell-density-scale, 1));
			border-radius: calc(16px * var(--shell-density-scale, 1));
			border: 1px solid rgba(255, 255, 255, 0.14);
			background: rgba(2, 6, 23, 0.35);
			color: inherit;
			resize: none;
			scrollbar-color: var(--text-editor-scrollbar-thumb) var(--text-editor-scrollbar-track);
			scrollbar-width: thin;
		}

		textarea::-webkit-scrollbar {
			width: calc(12px * var(--shell-density-scale, 1));
			height: calc(12px * var(--shell-density-scale, 1));
		}

		textarea::-webkit-scrollbar-track {
			background: var(--text-editor-scrollbar-track);
			border-radius: 999px;
		}

		textarea::-webkit-scrollbar-thumb {
			background-color: var(--text-editor-scrollbar-thumb);
			border-radius: 999px;
			border: calc(3px * var(--shell-density-scale, 1)) solid transparent;
			background-clip: content-box;
		}

		textarea::-webkit-scrollbar-thumb:hover {
			background-color: var(--text-editor-scrollbar-thumb-hover);
		}

		textarea::-webkit-scrollbar-corner {
			background: var(--text-editor-scrollbar-corner);
		}

		.status {
			display: grid;
			gap: calc(6px * var(--shell-density-scale, 1));
		}

		.status strong,
		.status span,
		label,
		p,
		h3 {
			margin: 0;
		}

		.dialog-scrim {
			position: absolute;
			inset: 0;
			display: grid;
			place-items: center;
			background: rgba(15, 23, 42, 0.5);
		}

		.dialog {
			width: min(calc(420px * var(--shell-density-scale, 1)), calc(100% - calc(24px * var(--shell-density-scale, 1))));
			display: grid;
			gap: calc(12px * var(--shell-density-scale, 1));
		}

		.form-row {
			display: grid;
			gap: calc(8px * var(--shell-density-scale, 1));
		}

		.dialog-actions {
			display: flex;
			justify-content: flex-end;
			gap: calc(10px * var(--shell-density-scale, 1));
		}
	`

	@property({ attribute: false })
	platformContext: PlatformContract['ApplicationContext'] | null = null

	@state()
	private editorValue: string = ''

	@state()
	private loadedFileId: string | null = null

	@state()
	private lastKnownFileName: string | null = null

	@state()
	private isDirty: boolean = false

	@state()
	private errorMessage: string | null = null

	@state()
	private isSaveAsOpen: boolean = false

	@state()
	private saveAsName: string = 'Untitled.txt'

	@state()
	private saveAsFolderId: string = ''

	@Spec('Synchronizes the visible editor state whenever the shell updates the active snapshot or selected file.')
	updated(changedProperties: PropertyValues<this>): void {
		if (changedProperties.has('platformContext')) {
			this.synchronizeEditorState()
		}
	}

	@Spec('Renders the current editor content, recoverable error state, and Save As dialog.')
	render(): TemplateResult {
		const activeFileNode = this.getActiveFileNode()
		return html`
			<div class="editor" data-testid="text-editor-view">
				<div class="toolbar">
					<div>
						<strong data-testid="text-editor-file-label">${this.lastKnownFileName ?? 'Untitled.txt'}</strong>
						<span>${this.isDirty === true ? 'Unsaved changes' : activeFileNode === null ? 'Ready to save' : 'Saved to virtual filesystem'}</span>
					</div>
					<div class="toolbar-actions">
						<button data-testid="text-editor-save" @click=${() => this.saveCurrentDocument()}>Save</button>
						<button data-testid="text-editor-save-as" @click=${() => this.openSaveAsDialog()}>Save As</button>
					</div>
				</div>
				${this.errorMessage === null ? null : html`
					<div class="status" data-testid="text-editor-error">
						<strong>Recoverable file issue</strong>
						<span>${this.errorMessage}</span>
					</div>
				`}
				<textarea data-testid="text-editor-textarea" .value=${this.editorValue} @input=${(event: Event) => this.onEditorInput(event)} spellcheck="false"></textarea>
				${this.isSaveAsOpen === false ? null : this.renderSaveAsDialog()}
			</div>
		`
	}

	@Spec('Loads the selected text file from the VFS and preserves unsaved recovery text when the backing file disappears.')
	private synchronizeEditorState(): void {
		const snapshot = this.platformContext?.filesystem.getSnapshot() ?? null
		const fileNodeId = this.platformContext?.window.openedNodeId ?? null
		if (snapshot === null || this.platformContext === null) {
			return
		}
		if (fileNodeId === null) {
			this.errorMessage = null
			this.emitTitleChange()
			return
		}
		const fileNode = snapshot.schema.nodesById[fileNodeId] ?? null
		if (fileNode !== null && this.isTextFile(fileNode)) {
			this.lastKnownFileName = fileNode.name
			if (this.loadedFileId !== fileNodeId || this.isDirty === false) {
				this.editorValue = this.platformContext.filesystem.readTextFile(fileNode.id) ?? this.editorValue
			}
			this.loadedFileId = fileNode.id
			this.errorMessage = null
			this.emitTitleChange()
			return
		}
		this.loadedFileId = fileNodeId
		this.errorMessage = fileNode === null
			? 'This file was deleted or is no longer available. You can use Save As to recover your current text.'
			: 'This file cannot be opened as text. Please choose a text document instead.'
		this.emitTitleChange()
	}

	@Spec('Updates the in-memory draft as the user types and marks the window title as dirty.')
	private onEditorInput(event: Event): void {
		const textarea = event.target
		if (!(textarea instanceof HTMLTextAreaElement)) {
			return
		}
		this.editorValue = textarea.value
		this.isDirty = true
		if (this.lastKnownFileName === null) {
			this.lastKnownFileName = 'Untitled.txt'
		}
		this.emitTitleChange()
	}

	@Spec('Saves the active document back into the selected VFS file or opens Save As when no writable target exists.')
	private saveCurrentDocument(): void {
		const snapshot = this.platformContext?.filesystem.getSnapshot() ?? null
		const fileNodeId = this.platformContext?.window.openedNodeId ?? null
		if (this.platformContext === null || fileNodeId === null || snapshot === null) {
			this.openSaveAsDialog()
			return
		}
		const fileNode = snapshot.schema.nodesById[fileNodeId] ?? null
		if (fileNode === null || this.isTextFile(fileNode) === false) {
			this.openSaveAsDialog()
			return
		}
		this.platformContext.filesystem.writeTextFile(fileNode.id, this.editorValue)
		this.isDirty = false
		this.lastKnownFileName = fileNode.name
		this.errorMessage = null
		this.emitTitleChange()
	}

	@Spec('Opens the Save As dialog with a default file name and destination folder derived from shell context.')
	private openSaveAsDialog(): void {
		this.saveAsName = this.lastKnownFileName ?? 'Untitled.txt'
		this.saveAsFolderId = this.resolveDefaultFolderId()
		this.isSaveAsOpen = true
	}

	@Spec('Closes the Save As dialog without creating a new VFS file.')
	private closeSaveAsDialog(): void {
		this.isSaveAsOpen = false
	}

	@Spec('Renders the Save As folder picker and file name form.')
	private renderSaveAsDialog(): TemplateResult {
		const folderChoices = this.getFolderChoices()
		return html`
			<div class="dialog-scrim">
				<div class="dialog" data-testid="text-editor-save-as-dialog">
					<h3>Save As</h3>
					<p>Choose a destination folder and file name for this text document.</p>
					<div class="form-row">
						<label for="text-editor-save-as-name">File name</label>
						<input id="text-editor-save-as-name" data-testid="text-editor-save-as-name" .value=${this.saveAsName} @input=${(event: Event) => this.onSaveAsNameInput(event)} />
					</div>
					<div class="form-row">
						<label for="text-editor-save-as-folder">Destination</label>
						<select id="text-editor-save-as-folder" data-testid="text-editor-save-as-folder" .value=${this.saveAsFolderId} @change=${(event: Event) => this.onSaveAsFolderChange(event)}>
							${folderChoices.map(folder => html`<option .value=${folder.id}>${folder.path}</option>`)}
						</select>
					</div>
					<div class="dialog-actions">
						<button data-testid="text-editor-save-as-cancel" @click=${() => this.closeSaveAsDialog()}>Cancel</button>
						<button data-testid="text-editor-save-as-confirm" @click=${() => this.confirmSaveAs()}>Save</button>
					</div>
				</div>
			</div>
		`
	}

	@Spec('Updates the Save As file name form value from user typing.')
	private onSaveAsNameInput(event: Event): void {
		const input = event.target
		if (input instanceof HTMLInputElement) {
			this.saveAsName = input.value
		}
	}

	@Spec('Updates the Save As destination folder from the visible picker selection.')
	private onSaveAsFolderChange(event: Event): void {
		const select = event.target
		if (select instanceof HTMLSelectElement) {
			this.saveAsFolderId = select.value
		}
	}

	@Spec('Creates a new VFS text file from the current draft and notifies the shell about the new active file target.')
	private confirmSaveAs(): void {
		if (this.platformContext === null || this.saveAsFolderId === '') {
			return
		}
		const createdFile = this.platformContext.filesystem.createTextFile(this.saveAsFolderId, this.saveAsName, this.editorValue)
		this.loadedFileId = createdFile.id
		this.lastKnownFileName = createdFile.name
		this.isDirty = false
		this.errorMessage = null
		this.isSaveAsOpen = false
		this.platformContext.window.setOpenedNodeId(createdFile.id)
		this.emitTitleChange()
	}

	@Spec('Returns the current VFS file node when the selected id still points to a text file.')
	private getActiveFileNode(): VirtualFileSystemContract['Node'] | null {
		const snapshot = this.platformContext?.filesystem.getSnapshot() ?? null
		const fileNodeId = this.platformContext?.window.openedNodeId ?? null
		if (snapshot === null || fileNodeId === null) {
			return null
		}
		const fileNode = snapshot.schema.nodesById[fileNodeId] ?? null
		if (fileNode === null || this.isTextFile(fileNode) === false) {
			return null
		}
		return fileNode
	}

	@Spec('Returns true when one VFS node stores editable UTF-8 text content for the editor.')
	private isTextFile(node: VirtualFileSystemContract['Node']): boolean {
		if (node.kind !== 'file') {
			return false
		}
		if (typeof node.mimeType === 'string' && node.mimeType.startsWith('text/')) {
			return true
		}
		return node.mimeType === 'application/json'
	}

	@Spec('Returns the default Save As destination folder, preferring the current File Manager folder and otherwise Documents.')
	private resolveDefaultFolderId(): string {
		const snapshot = this.platformContext?.filesystem.getSnapshot() ?? null
		const defaultFolderId = this.platformContext?.window.sourceFolderId ?? null
		if (snapshot === null) {
			return ''
		}
		const requestedFolder = defaultFolderId === null ? null : snapshot.schema.nodesById[defaultFolderId] ?? null
		if (requestedFolder?.kind === 'folder') {
			return requestedFolder.id
		}
		const documentsFolder = FileManagerSnapshot.resolvePath(snapshot, '/Documents')
		if (documentsFolder?.kind === 'folder') {
			return documentsFolder.id
		}
		return snapshot.schema.rootId
	}

	@Spec('Builds the visible Save As folder list from the current snapshot tree.')
	private getFolderChoices(): Array<{ id: string, path: string }> {
		const snapshot = this.platformContext?.filesystem.getSnapshot() ?? null
		if (snapshot === null) {
			return []
		}
		const folderChoices: Array<{ id: string, path: string }> = []
		this.collectFolderChoices(snapshot.schema.rootId, folderChoices)
		return folderChoices
	}

	@Spec('Walks the snapshot folder tree in display order to collect Save As destinations.')
	private collectFolderChoices(folderId: string, folderChoices: Array<{ id: string, path: string }>): void {
		const snapshot = this.platformContext?.filesystem.getSnapshot() ?? null
		if (snapshot === null) {
			return
		}
		const folderNode = snapshot.schema.nodesById[folderId]
		if (folderNode === undefined || folderNode.kind !== 'folder') {
			return
		}
		folderChoices.push({ id: folderNode.id, path: FileManagerSnapshot.describeNodePath(snapshot, folderNode.id) })
		for (const childId of snapshot.schema.childrenById[folderNode.id] ?? []) {
			const childNode = snapshot.schema.nodesById[childId]
			if (childNode?.kind === 'folder') {
				this.collectFolderChoices(childNode.id, folderChoices)
			}
		}
	}

	@Spec('Publishes the current title label so the outer shell window header reflects file name and dirty state changes.')
	private emitTitleChange(): void {
		if (this.platformContext === null) {
			return
		}
		const baseTitle = this.errorMessage !== null
			? `${this.lastKnownFileName ?? 'Text Editor'} (missing)`
			: this.lastKnownFileName ?? 'Text Editor'
		this.platformContext.window.setTitle(this.isDirty === true ? `${baseTitle} *` : baseTitle)
	}
}
