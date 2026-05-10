import { LitElement, css, html, type PropertyValues, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import type { PlatformContract } from '../platform/PlatformContract.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Renders the VFS-backed Image Viewer for image files stored in the shared virtual filesystem.')
@customElement('iva-image-viewer-view')
export class ImageViewerView extends LitElement {
	static styles = css`
		:host {
			--image-viewer-scrollbar-track: var(--shell-scrollbar-track, rgba(255, 255, 255, 0.08));
			--image-viewer-scrollbar-thumb: var(--shell-scrollbar-thumb, rgba(226, 232, 240, 0.58));
			--image-viewer-scrollbar-thumb-hover: var(--shell-scrollbar-thumb-hover, rgba(241, 245, 249, 0.78));
			--image-viewer-scrollbar-corner: var(--shell-scrollbar-corner, rgba(255, 255, 255, 0.04));
			display: grid;
			height: 100%;
			min-height: 0;
			color-scheme: inherit;
		}

		.viewer {
			display: grid;
			grid-template-rows: auto 1fr;
			height: 100%;
			min-height: 0;
			background: linear-gradient(180deg, rgba(10, 14, 22, 0.98) 0%, rgba(5, 8, 14, 1) 100%);
		}

		:host-context(.shell[data-theme='light']) .viewer {
			background: linear-gradient(180deg, rgba(241, 245, 251, 0.98) 0%, rgba(225, 232, 242, 0.98) 100%);
		}

		.inspector {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			gap: calc(12px * var(--shell-density-scale, 1));
			align-items: center;
			padding: calc(14px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1));
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
			background: linear-gradient(180deg, rgba(30, 36, 50, 0.82) 0%, rgba(14, 19, 30, 0.84) 100%);
		}

		:host-context(.shell[data-theme='light']) .inspector {
			background: linear-gradient(180deg, rgba(249, 251, 255, 0.98) 0%, rgba(235, 240, 247, 0.98) 100%);
			border-bottom-color: rgba(123, 137, 168, 0.18);
		}

		.inspector-copy,
		.inspector-meta,
		.viewer-status,
		.preview-empty {
			display: grid;
			gap: calc(4px * var(--shell-density-scale, 1));
		}

		.inspector-copy {
			min-width: 0;
		}

		.inspector-copy strong {
			font-size: calc(14px * var(--shell-density-scale, 1));
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.inspector-subtitle,
		.inspector-meta,
		.viewer-status {
			color: var(--shell-muted-text, rgba(226, 232, 240, 0.82));
		}

		.inspector-meta {
			justify-items: end;
			text-align: right;
		}

		.preview {
			display: grid;
			place-items: center;
			min-height: calc(220px * var(--shell-density-scale, 1));
			overflow: auto;
			padding: calc(20px * var(--shell-density-scale, 1));
			scrollbar-color: var(--image-viewer-scrollbar-thumb) var(--image-viewer-scrollbar-track);
			scrollbar-width: thin;
			background:
				linear-gradient(45deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.02) 75%),
				linear-gradient(45deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.02) 75%);
			background-size: 24px 24px;
			background-position: 0 0, 12px 12px;
		}

		:host-context(.shell[data-theme='light']) .preview {
			background:
				linear-gradient(45deg, rgba(101, 116, 139, 0.04) 25%, transparent 25%, transparent 75%, rgba(101, 116, 139, 0.04) 75%),
				linear-gradient(45deg, rgba(101, 116, 139, 0.04) 25%, transparent 25%, transparent 75%, rgba(101, 116, 139, 0.04) 75%);
			background-size: 24px 24px;
			background-position: 0 0, 12px 12px;
		}

		.preview::-webkit-scrollbar {
			width: calc(12px * var(--shell-density-scale, 1));
			height: calc(12px * var(--shell-density-scale, 1));
		}

		.preview::-webkit-scrollbar-track {
			background: var(--image-viewer-scrollbar-track);
			border-radius: 999px;
		}

		.preview::-webkit-scrollbar-thumb {
			background-color: var(--image-viewer-scrollbar-thumb);
			border-radius: 999px;
			border: calc(3px * var(--shell-density-scale, 1)) solid transparent;
			background-clip: content-box;
		}

		.preview::-webkit-scrollbar-thumb:hover {
			background-color: var(--image-viewer-scrollbar-thumb-hover);
		}

		.preview::-webkit-scrollbar-corner {
			background: var(--image-viewer-scrollbar-corner);
		}

		img {
			max-width: 100%;
			max-height: 100%;
			border-radius: calc(10px * var(--shell-density-scale, 1));
			object-fit: contain;
			box-shadow: 0 calc(18px * var(--shell-density-scale, 1)) calc(48px * var(--shell-density-scale, 1)) rgba(0, 0, 0, 0.36);
		}

		.preview-empty {
			justify-items: center;
			text-align: center;
			padding: calc(28px * var(--shell-density-scale, 1));
			border-radius: calc(14px * var(--shell-density-scale, 1));
			background: color-mix(in srgb, var(--shell-control, rgba(255, 255, 255, 0.08)) 70%, transparent);
			border: 1px dashed rgba(255, 255, 255, 0.12);
			max-width: calc(360px * var(--shell-density-scale, 1));
		}

		.viewer-status[data-state='error'] {
			color: var(--shell-error-text, rgb(254, 226, 226));
		}

		strong,
		span,
		p {
			margin: 0;
		}
	`

	@property({ attribute: false })
	platformContext: PlatformContract['ApplicationContext'] | null = null

	@state()
	private imageSource: string | null = null

	@state()
	private errorMessage: string | null = null

	@state()
	private lastKnownFileName: string | null = null

	@state()
	private dimensionsLabel: string = 'Unknown'

	@Spec('Synchronizes the current image payload and recoverable error state when the selected VFS file changes.')
	updated(changedProperties: PropertyValues<this>): void {
		if (changedProperties.has('platformContext')) {
			this.synchronizeViewerState()
		}
	}

	@Spec('Renders the image preview plus file metadata or a recoverable missing-file state.')
	render(): TemplateResult {
		const activeFileNode = this.getActiveImageNode()
		return html`
			<div class="viewer" data-testid="image-viewer-view">
				<div class="inspector" data-testid="image-viewer-metadata">
					<div class="inspector-copy">
						<strong>${this.lastKnownFileName ?? 'Image Viewer'}</strong>
						<span class="inspector-subtitle">${activeFileNode?.mimeType ?? 'No image selected'}</span>
						${this.errorMessage === null
							? html`<span class="viewer-status">Ready to preview</span>`
							: html`<p class="viewer-status" data-state="error" data-testid="image-viewer-error">${this.errorMessage}</p>`}
					</div>
					<div class="inspector-meta">
						<span>${activeFileNode === null ? '—' : `${String(activeFileNode.size)} bytes`}</span>
						<span>Dimensions: ${this.dimensionsLabel}</span>
					</div>
				</div>
				<div class="preview">
					${this.imageSource === null
						? html`
							<div class="preview-empty" data-testid="image-viewer-empty-state">
								<strong>No image open</strong>
								<p>Choose an image file from File Manager to preview it here.</p>
							</div>
						`
						: html`<img data-testid="image-viewer-image" src=${this.imageSource} alt=${this.lastKnownFileName ?? 'Image preview'} @load=${(event: Event) => this.onImageLoad(event)} />`}
				</div>
			</div>
		`
	}

	@Spec('Reads the selected image payload from the VFS and preserves a non-crashing state when the backing file disappears.')
	private synchronizeViewerState(): void {
		this.dimensionsLabel = 'Unknown'
		const snapshot = this.platformContext?.filesystem.getSnapshot() ?? null
		const fileNodeId = this.platformContext?.window.openedNodeId ?? null
		if (snapshot === null || this.platformContext === null || fileNodeId === null) {
			this.imageSource = null
			this.errorMessage = null
			this.emitTitleChange()
			return
		}
		const fileNode = snapshot.schema.nodesById[fileNodeId] ?? null
		if (fileNode !== null && this.isImageFile(fileNode)) {
			this.lastKnownFileName = fileNode.name
			this.imageSource = this.platformContext.filesystem.readBinaryFile(fileNode.id)
			this.errorMessage = this.imageSource === null ? 'This image payload is no longer available.' : null
			this.emitTitleChange()
			return
		}
		this.imageSource = null
		this.errorMessage = fileNode === null
			? 'This image was deleted or is no longer available.'
			: 'This file cannot be opened as an image.'
		this.emitTitleChange()
	}

	@Spec('Reads natural image dimensions after the preview loads so the metadata panel can display them when available.')
	private onImageLoad(event: Event): void {
		const image = event.target
		if (!(image instanceof HTMLImageElement)) {
			return
		}
		if (image.naturalWidth > 0 && image.naturalHeight > 0) {
			this.dimensionsLabel = `${String(image.naturalWidth)} × ${String(image.naturalHeight)}`
		}
	}

	@Spec('Returns the active image node when the selected file id still points to a readable image file.')
	private getActiveImageNode(): VirtualFileSystemContract['Node'] | null {
		const snapshot = this.platformContext?.filesystem.getSnapshot() ?? null
		const fileNodeId = this.platformContext?.window.openedNodeId ?? null
		if (snapshot === null || fileNodeId === null) {
			return null
		}
		const fileNode = snapshot.schema.nodesById[fileNodeId] ?? null
		if (fileNode === null || this.isImageFile(fileNode) === false) {
			return null
		}
		return fileNode
	}

	@Spec('Returns true when one VFS node stores an image payload that the viewer can display.')
	private isImageFile(node: VirtualFileSystemContract['Node']): boolean {
		return node.kind === 'file' && typeof node.mimeType === 'string' && node.mimeType.startsWith('image/')
	}

	@Spec('Publishes the current file title to the outer shell window header so rename and delete changes stay visible.')
	private emitTitleChange(): void {
		if (this.platformContext === null) {
			return
		}
		const title = this.errorMessage === null
			? this.lastKnownFileName ?? 'Image Viewer'
			: `${this.lastKnownFileName ?? 'Image Viewer'} (missing)`
		this.platformContext.window.setTitle(title)
	}
}
