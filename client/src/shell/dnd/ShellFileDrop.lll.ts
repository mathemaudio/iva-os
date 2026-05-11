import { LitElement, css, html, type CSSResultGroup, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import type { PlatformContract } from '../../platform/PlatformContract.lll'
import { ShellFileDropTarget } from './ShellFileDropTarget.lll'

@Spec('Provides browser-window drag-and-drop image uploads with shell-styled validation and best-effort in-app folder targeting.')
@customElement('iva-shell-file-drop')
export class ShellFileDrop extends LitElement {
	static styles: CSSResultGroup = css`
		:host {
			position: absolute;
			inset: 0;
			display: block;
			pointer-events: none;
			z-index: 4;
		}

		* {
			box-sizing: border-box;
		}

		.drop-overlay {
			position: absolute;
			inset: 0;
			z-index: 1;
			display: grid;
			place-items: center;
			padding: calc(24px * var(--shell-density-scale, 1));
			background: color-mix(in srgb, var(--shell-overlay, rgba(6, 10, 20, 0.48)) 78%, transparent);
			pointer-events: none;
		}

		.drop-panel,
		.drop-message {
			border: 1px solid var(--shell-window-border, rgba(255, 255, 255, 0.12));
			background: color-mix(in srgb, var(--shell-panel-strong, rgba(13, 18, 30, 0.92)) 96%, transparent);
			backdrop-filter: blur(18px) saturate(1.14);
			box-shadow: 0 calc(18px * var(--shell-density-scale, 1)) calc(44px * var(--shell-density-scale, 1)) var(--shell-shadow, rgba(4, 8, 18, 0.56));
		}

		.drop-panel {
			display: grid;
			gap: calc(8px * var(--shell-density-scale, 1));
			max-width: calc(460px * var(--shell-density-scale, 1));
			padding: calc(18px * var(--shell-density-scale, 1)) calc(20px * var(--shell-density-scale, 1));
			border-radius: calc(18px * var(--shell-density-scale, 1));
			text-align: center;
			color: var(--shell-text, rgb(235, 239, 247));
		}

		.drop-panel span {
			color: var(--shell-muted-strong, rgba(228, 234, 245, 0.9));
		}

		.drop-message {
			position: absolute;
			right: calc(20px * var(--shell-density-scale, 1));
			top: calc(54px * var(--shell-density-scale, 1));
			z-index: 2;
			display: grid;
			grid-template-columns: 1fr auto;
			gap: calc(12px * var(--shell-density-scale, 1));
			align-items: start;
			max-width: min(calc(480px * var(--shell-density-scale, 1)), calc(100vw - 40px));
			padding: calc(14px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1));
			border-radius: calc(16px * var(--shell-density-scale, 1));
			color: var(--shell-error-text, rgb(255, 220, 220));
			pointer-events: auto;
		}

		.drop-message > div {
			display: grid;
			gap: calc(4px * var(--shell-density-scale, 1));
		}

		.drop-message button {
			border-radius: calc(10px * var(--shell-density-scale, 1));
			padding: calc(8px * var(--shell-density-scale, 1)) calc(10px * var(--shell-density-scale, 1));
			border: 1px solid var(--shell-control-border, rgba(255, 255, 255, 0.14));
			background: var(--shell-control, rgba(255, 255, 255, 0.07));
			color: inherit;
			cursor: pointer;
		}
	`
	@property({ attribute: false })
	public filesystem: PlatformContract['FileSystemService'] | null = null

	@state()
	private isDropActive: boolean = false

	@state()
	private message: string | null = null

	private readonly onWindowDragEnterListener = (event: DragEvent): void => this.handleWindowDragEnter(event)
	private readonly onWindowDragOverListener = (event: DragEvent): void => this.handleWindowDragOver(event)
	private readonly onWindowDragLeaveListener = (event: DragEvent): void => this.handleWindowDragLeave(event)
	private readonly onWindowDropListener = (event: DragEvent): void => {
		void this.handleWindowDrop(event)
	}

	@Spec('Renders one overlay for active browser file drags plus one shell-styled alert message when the latest drop needs user feedback.')
	public render(): TemplateResult {
		return html`
			${this.isDropActive === true
				? html`
					<div class="drop-overlay" data-testid="shell-file-drop-overlay">
						<div class="drop-panel">
							<strong>Drop image to upload</strong>
							<span>The browser can place it on Desktop or into the currently visible File Manager folder when that target is visible in the app.</span>
						</div>
					</div>
				`
				: null}
			${this.message === null
				? null
				: html`
					<div class="drop-message" data-testid="shell-file-drop-message" role="alert">
						<div>
							<strong>Upload notice</strong>
							<span>${this.message}</span>
						</div>
						<button data-testid="shell-file-drop-dismiss" @click=${() => this.dismissMessage()}>Dismiss</button>
					</div>
				`}
		`
	}

	@Spec('Attaches browser drag listeners to the window so file drags can be intercepted anywhere over the app shell.')
	public connectedCallback(): void {
		super.connectedCallback()
		window.addEventListener('dragenter', this.onWindowDragEnterListener)
		window.addEventListener('dragover', this.onWindowDragOverListener)
		window.addEventListener('dragleave', this.onWindowDragLeaveListener)
		window.addEventListener('drop', this.onWindowDropListener)
	}

	@Spec('Releases browser drag listeners when the shell drop surface leaves the page.')
	public disconnectedCallback(): void {
		window.removeEventListener('dragenter', this.onWindowDragEnterListener)
		window.removeEventListener('dragover', this.onWindowDragOverListener)
		window.removeEventListener('dragleave', this.onWindowDragLeaveListener)
		window.removeEventListener('drop', this.onWindowDropListener)
		super.disconnectedCallback()
	}

	@Spec('Shows the upload overlay when one browser file drag first enters the application window.')
	private handleWindowDragEnter(event: DragEvent): void {
		if (ShellFileDropTarget.hasFilePayload(event) === false) {
			return
		}
		event.preventDefault()
		this.isDropActive = true
	}

	@Spec('Keeps the browser from navigating away when dragged files move across the application window.')
	private handleWindowDragOver(event: DragEvent): void {
		if (ShellFileDropTarget.hasFilePayload(event) === false) {
			return
		}
		event.preventDefault()
		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = 'copy'
		}
		this.isDropActive = true
	}

	@Spec('Clears the overlay after the browser file drag fully leaves the application window.')
	private handleWindowDragLeave(event: DragEvent): void {
		if (ShellFileDropTarget.hasFilePayload(event) === false) {
			return
		}
		const nextTarget = event.relatedTarget
		if (nextTarget instanceof Node) {
			return
		}
		this.isDropActive = false
	}

	@Spec('Imports one dropped image payload into the best available browser-visible folder target and shows shell-styled validation feedback when needed.')
	private async handleWindowDrop(event: DragEvent): Promise<void> {
		if (ShellFileDropTarget.hasFilePayload(event) === false) {
			return
		}
		event.preventDefault()
		this.isDropActive = false
		if (this.filesystem === null) {
			return
		}
		this.message = await ShellFileDropTarget.importDroppedImages(event, this.filesystem)
	}

	@Spec('Dismisses the current shell-styled upload message.')
	private dismissMessage(): void {
		this.message = null
	}
}
