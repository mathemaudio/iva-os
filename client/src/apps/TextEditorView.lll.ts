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
			grid-template-rows: auto auto auto 1fr;
			height: 100%;
			min-height: 0;
			background: linear-gradient(180deg, rgba(16, 21, 33, 0.98) 0%, rgba(8, 11, 19, 1) 100%);
		}

		:host-context(.shell[data-theme='light']) .editor {
			background: linear-gradient(180deg, rgba(246, 249, 253, 0.98) 0%, rgba(232, 238, 246, 0.98) 100%);
		}

		.toolbar,
		.status,
		.dialog {
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		}

		.toolbar {
			display: flex;
			flex-wrap: wrap;
			gap: calc(10px * var(--shell-density-scale, 1));
			align-items: center;
			justify-content: space-between;
			padding: calc(12px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1));
			background: linear-gradient(180deg, rgba(35, 41, 58, 0.86) 0%, rgba(19, 24, 36, 0.9) 100%);
		}

		:host-context(.shell[data-theme='light']) .toolbar {
			background: linear-gradient(180deg, rgba(248, 251, 255, 0.98) 0%, rgba(236, 241, 248, 0.98) 100%);
			border-bottom-color: rgba(123, 137, 168, 0.18);
		}

		.toolbar-copy,
		.status-copy,
		.dialog,
		.form-row,
		.editor-surface,
		.footer-strip {
			display: grid;
			gap: calc(6px * var(--shell-density-scale, 1));
		}

		.toolbar-copy {
			min-width: 0;
		}

		.toolbar-copy strong {
			font-size: calc(17px * var(--shell-density-scale, 1));
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.toolbar-subtitle,
		.status span,
		.footer-strip,
		label,
		p {
			color: var(--shell-muted-text, rgba(226, 232, 240, 0.82));
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
			border-radius: calc(10px * var(--shell-density-scale, 1));
			border: 1px solid rgba(255, 255, 255, 0.14);
			background: color-mix(in srgb, var(--shell-control, rgba(255, 255, 255, 0.08)) 90%, transparent);
			color: inherit;
		}

		button {
			padding: calc(8px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			cursor: pointer;
			background: linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.06) 100%);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
		}

		:host-context(.shell[data-theme='light']) button {
			background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(234, 239, 247, 0.96) 100%);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
		}

		select,
		input {
			padding: calc(10px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
		}

		.status {
			display: grid;
			gap: calc(4px * var(--shell-density-scale, 1));
			padding: calc(10px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1));
			background: color-mix(in srgb, var(--shell-control, rgba(255, 255, 255, 0.08)) 74%, transparent);
		}

		.status[data-kind='error'] {
			background: var(--shell-error, rgba(248, 113, 113, 0.14));
			color: var(--shell-error-text, rgb(254, 226, 226));
		}

		.editor-surface {
			min-height: 0;
			padding: calc(16px * var(--shell-density-scale, 1));
		}

		textarea {
			width: 100%;
			height: 100%;
			min-height: calc(220px * var(--shell-density-scale, 1));
			padding: calc(18px * var(--shell-density-scale, 1)) calc(20px * var(--shell-density-scale, 1));
			border-radius: calc(14px * var(--shell-density-scale, 1));
			border: 1px solid rgba(255, 255, 255, 0.12);
			background: rgba(6, 10, 18, 0.92);
			color: rgb(233, 237, 244);
			resize: none;
			font-family: 'SFMono-Regular', 'Cascadia Code', 'Fira Code', 'Consolas', 'Menlo', monospace;
			font-size: calc(13.5px * var(--shell-density-scale, 1));
			line-height: 1.55;
			tab-size: 4;
			caret-color: rgb(112, 165, 255);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
			scrollbar-color: var(--text-editor-scrollbar-thumb) var(--text-editor-scrollbar-track);
			scrollbar-width: thin;
		}

		:host-context(.shell[data-theme='light']) textarea {
			background: rgba(255, 255, 255, 0.96);
			color: rgb(25, 30, 42);
			border-color: rgba(123, 137, 168, 0.2);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
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

		.footer-strip {
			grid-auto-flow: column;
			grid-auto-columns: max-content;
			justify-content: space-between;
			align-items: center;
			padding: calc(8px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1));
			border-top: 1px solid rgba(255, 255, 255, 0.06);
			font-size: calc(12px * var(--shell-density-scale, 1));
		}

		.dialog-scrim {
			position: absolute;
			inset: 0;
			display: grid;
			place-items: center;
			background: rgba(10, 15, 24, 0.58);
			backdrop-filter: blur(8px);
			padding: calc(18px * var(--shell-density-scale, 1));
		}

		.dialog {
			width: min(calc(440px * var(--shell-density-scale, 1)), calc(100% - calc(24px * var(--shell-density-scale, 1))));
			padding: calc(18px * var(--shell-density-scale, 1));
			border-radius: calc(14px * var(--shell-density-scale, 1));
			background: linear-gradient(180deg, rgba(34, 40, 56, 0.98) 0%, rgba(18, 23, 34, 0.98) 100%);
			border: 1px solid rgba(255, 255, 255, 0.14);
			box-shadow: 0 calc(22px * var(--shell-density-scale, 1)) calc(60px * var(--shell-density-scale, 1)) rgba(0, 0, 0, 0.34);
		}

		:host-context(.shell[data-theme='light']) .dialog {
			background: linear-gradient(180deg, rgba(255, 255, 255, 0.99) 0%, rgba(238, 243, 250, 0.99) 100%);
			border-color: rgba(123, 137, 168, 0.22);
		}

		.form-row {
			gap: calc(8px * var(--shell-density-scale, 1));
		}

		.dialog-actions {
			display: flex;
			justify-content: flex-end;
			gap: calc(10px * var(--shell-density-scale, 1));
		}

		.status strong,
		.status span,
		label,
		p,
		h3 {
			margin: 0;
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
					<div class="toolbar-copy">
						<strong data-testid="text-editor-file-label">${this.lastKnownFileName ?? 'Untitled.txt'}</strong>
						<span class="toolbar-subtitle">${activeFileNode?.mimeType ?? 'Plain text document'}</span>
					</div>
					<div class="toolbar-actions">
						<button data-testid="text-editor-save" @click=${() => this.saveCurrentDocument()}>Save</button>
						<button data-testid="text-editor-save-as" @click=${() => this.openSaveAsDialog()}>Save As…</button>
					</div>
				</div>
				<div class="status" data-kind=${this.errorMessage === null ? 'info' : 'error'}>
					<strong>${this.errorMessage === null ? (this.isDirty === true ? 'Edited locally' : activeFileNode === null ? 'Ready to save' : 'Saved to virtual filesystem') : 'Recoverable file issue'}</strong>
					${this.errorMessage === null
						? html`<span>${this.isDirty === true ? 'Unsaved changes are currently in memory.' : 'This document is synced with the shared virtual filesystem.'}</span>`
						: html`<span data-testid="text-editor-error">${this.errorMessage}</span>`}
				</div>
				<div class="editor-surface">
					<textarea data-testid="text-editor-textarea" .value=${this.editorValue} @input=${(event: Event) => this.onEditorInput(event)} spellcheck="false"></textarea>
				</div>
				<div class="footer-strip">
					<span>${this.isDirty === true ? 'Modified' : 'Clean'}</span>
					<span>${String(this.editorValue.length)} characters</span>
				</div>
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
