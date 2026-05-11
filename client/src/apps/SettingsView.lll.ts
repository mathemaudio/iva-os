import { LitElement, css, html, type PropertyValues, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import type { PlatformContract } from '../platform/PlatformContract.lll'
import { EmojiIconRenderer } from '../EmojiIconRenderer.lll'

@Spec('Renders the platform-backed Settings app through the stable application context instead of direct shell callbacks.')
@customElement('iva-settings-view')
export class SettingsView extends LitElement {
	static styles = [
		EmojiIconRenderer.styles,
		css`
		:host {
			display: block;
			height: 100%;
			color: inherit;
		}

		.settings-grid {
			display: grid;
			gap: calc(14px * var(--shell-density-scale, 1));
		}

		.status-pill {
			display: inline-flex;
			align-items: center;
			gap: calc(8px * var(--shell-density-scale, 1));
			padding: calc(8px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			width: fit-content;
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.12);
		}

		.settings-panel {
			display: grid;
			gap: calc(12px * var(--shell-density-scale, 1));
			padding: calc(16px * var(--shell-density-scale, 1));
			border-radius: calc(16px * var(--shell-density-scale, 1));
			background: rgba(255, 255, 255, 0.08);
			border: 1px solid rgba(255, 255, 255, 0.12);
		}

		header,
		.settings-row {
			display: grid;
			gap: calc(8px * var(--shell-density-scale, 1));
		}

		.settings-note,
		label,
		strong,
		span {
			margin: 0;
		}

		.settings-note {
			color: rgba(226, 232, 240, 0.82);
		}

		.settings-select {
			font: inherit;
			padding: calc(10px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			border-radius: calc(12px * var(--shell-density-scale, 1));
			border: 1px solid rgba(255, 255, 255, 0.14);
			background: rgba(255, 255, 255, 0.08);
			color: inherit;
		}
	`
	]

	@property({ attribute: false })
	platformContext: PlatformContract['ApplicationContext'] | null = null

	@state()
	private settingsSnapshot: PlatformContract['SettingsSnapshot'] | null = null

	private unsubscribe: (() => void) | null = null
	private attachedSettingsService: PlatformContract['SettingsService'] | null = null

	@Spec('Attaches to the app-facing settings service after the settings app connects to the DOM.')
	connectedCallback(): void {
		super.connectedCallback()
		this.attachToSettingsService()
	}

	@Spec('Releases the settings subscription when the settings app disconnects from the DOM.')
	disconnectedCallback(): void {
		if (this.unsubscribe !== null) {
			this.unsubscribe()
			this.unsubscribe = null
		}
		this.attachedSettingsService = null
		super.disconnectedCallback()
	}

	@Spec('Reattaches to the current platform settings service when the injected application context changes.')
	updated(changedProperties: PropertyValues<this>): void {
		if (changedProperties.has('platformContext')) {
			this.attachToSettingsService()
		}
	}

	@Spec('Renders the settings app through platform-provided theme and wallpaper state.')
	render(): TemplateResult {
		if (this.settingsSnapshot === null) {
			return html`<div class="status-pill">Loading platform settings…</div>`
		}
		return html`
			<div class="settings-grid" data-testid="settings-view">
				<div class="status-pill">${EmojiIconRenderer.renderIcon('⚙️', 'Settings')}<span>Settings are saved locally in this browser</span></div>
				<section class="settings-panel">
					<header>
						<strong>Appearance mode</strong>
						<span class="settings-note">Theme changes the shell chrome only. Your wallpaper stays exactly as selected.</span>
					</header>
					<div class="settings-row">
						<label for="theme-select">Theme</label>
						<select id="theme-select" class="settings-select" data-testid="theme-select" .value=${this.settingsSnapshot.theme} @change=${(event: Event) => this.onThemeChange(event)}>
							<option value="dark">Dark</option>
							<option value="light">Light</option>
						</select>
					</div>
				</section>
				<section class="settings-panel">
					<header>
						<strong>Wallpaper</strong>
						<span class="settings-note">Choose from built-in gradients or images stored in /Pictures/Wallpapers.</span>
					</header>
					<div class="settings-row">
						<label for="wallpaper-select">Wallpaper</label>
						<select id="wallpaper-select" class="settings-select" data-testid="wallpaper-select" .value=${this.settingsSnapshot.wallpaper} @change=${(event: Event) => this.onWallpaperChange(event)}>
							${this.settingsSnapshot.wallpaperChoices.map(choice => html`<option .value=${choice.id}>${choice.label}</option>`)}
						</select>
					</div>
				</section>
			</div>
		`
	}

	@Spec('Attaches the view to the latest platform settings service and refreshes the visible snapshot.')
	private attachToSettingsService(): void {
		const settingsService = this.platformContext?.settings ?? null
		if (this.attachedSettingsService === settingsService) {
			this.settingsSnapshot = settingsService?.getSnapshot() ?? null
			return
		}
		if (this.unsubscribe !== null) {
			this.unsubscribe()
			this.unsubscribe = null
		}
		this.attachedSettingsService = settingsService
		if (settingsService === null) {
			this.settingsSnapshot = null
			return
		}
		this.settingsSnapshot = settingsService.getSnapshot()
		this.unsubscribe = settingsService.subscribe(snapshot => {
			this.settingsSnapshot = snapshot
		})
	}

	@Spec('Updates the active theme through the injected platform settings service.')
	private onThemeChange(event: Event): void {
		const select = event.target
		if (!(select instanceof HTMLSelectElement) || this.platformContext === null) {
			return
		}
		this.platformContext.settings.setTheme(select.value === 'light' ? 'light' : 'dark')
	}

	@Spec('Updates the active wallpaper through the injected platform settings service.')
	private onWallpaperChange(event: Event): void {
		const select = event.target
		if (!(select instanceof HTMLSelectElement) || this.platformContext === null) {
			return
		}
		this.platformContext.settings.setWallpaper(select.value)
	}
}
