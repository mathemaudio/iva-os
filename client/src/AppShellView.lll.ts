import { css, html, type CSSResultGroup, type TemplateResult } from 'lit'
import { Spec } from '@shared/lll.lll'

@Spec('Provides shared shell styles plus settings-window rendering helpers for IvaOS.')
export class AppShellView {
	static readonly styles: CSSResultGroup = css`
		:host {
			display: block;
			height: 100vh;
			margin: 0;
			font-family: 'Manrope', 'Segoe UI', system-ui, -apple-system, sans-serif;
		}

		* {
			box-sizing: border-box;
		}

		button,
		select {
			font: inherit;
		}

		.shell {
			--shell-density-scale: 0.88;
			--shell-text: rgb(241, 245, 249);
			--shell-muted-text: rgba(226, 232, 240, 0.82);
			--shell-panel: rgba(15, 23, 42, 0.68);
			--shell-panel-strong: rgba(15, 23, 42, 0.82);
			--shell-control: rgba(255, 255, 255, 0.08);
			--shell-control-border: rgba(255, 255, 255, 0.14);
			--shell-status: rgba(34, 197, 94, 0.14);
			--shell-status-border: rgba(34, 197, 94, 0.24);
			--shell-status-text: rgb(220, 252, 231);
			--shell-error: rgba(248, 113, 113, 0.14);
			--shell-error-border: rgba(248, 113, 113, 0.24);
			--shell-error-text: rgb(254, 226, 226);
			--shell-shadow: rgba(15, 23, 42, 0.42);
			--shell-overlay: rgba(8, 15, 33, 0.28);
			--shell-scrollbar-track: rgba(255, 255, 255, 0.08);
			--shell-scrollbar-thumb: rgba(226, 232, 240, 0.58);
			--shell-scrollbar-thumb-hover: rgba(241, 245, 249, 0.78);
			--shell-scrollbar-corner: rgba(255, 255, 255, 0.04);
			height: 100%;
			display: grid;
			grid-template-rows: auto 1fr auto;
			background-color: rgb(8, 15, 33);
			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
			color: var(--shell-text);
			color-scheme: dark;
			font-size: calc(16px * var(--shell-density-scale));
		}

		.shell[data-theme='light'] {
			--shell-text: rgb(15, 23, 42);
			--shell-muted-text: rgba(15, 23, 42, 0.74);
			--shell-panel: rgba(255, 255, 255, 0.68);
			--shell-panel-strong: rgba(255, 255, 255, 0.84);
			--shell-control: rgba(255, 255, 255, 0.46);
			--shell-control-border: rgba(148, 163, 184, 0.34);
			--shell-status: rgba(34, 197, 94, 0.12);
			--shell-status-border: rgba(34, 197, 94, 0.2);
			--shell-status-text: rgb(21, 128, 61);
			--shell-error: rgba(248, 113, 113, 0.12);
			--shell-error-border: rgba(239, 68, 68, 0.22);
			--shell-error-text: rgb(185, 28, 28);
			--shell-shadow: rgba(148, 163, 184, 0.28);
			--shell-overlay: rgba(255, 255, 255, 0.16);
			--shell-scrollbar-track: rgba(148, 163, 184, 0.18);
			--shell-scrollbar-thumb: rgba(100, 116, 139, 0.58);
			--shell-scrollbar-thumb-hover: rgba(71, 85, 105, 0.76);
			--shell-scrollbar-corner: rgba(148, 163, 184, 0.08);
			background-color: rgb(226, 232, 240);
			color-scheme: light;
		}

		.top-bar {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: calc(16px * var(--shell-density-scale));
			padding: calc(12px * var(--shell-density-scale)) calc(18px * var(--shell-density-scale));
			background: var(--shell-panel);
			backdrop-filter: blur(18px);
			border-bottom: 1px solid var(--shell-control-border);
		}

		.brand {
			display: grid;
			gap: calc(2px * var(--shell-density-scale));
		}

		.brand strong {
			font-size: calc(15.2px * var(--shell-density-scale));
			letter-spacing: 0.02em;
		}

		.brand span,
		.top-bar-clock {
			font-size: calc(12.8px * var(--shell-density-scale));
			color: var(--shell-muted-text);
		}

		.desktop {
			position: relative;
			overflow: hidden;
			padding: calc(22px * var(--shell-density-scale));
		}

		.desktop-empty-state {
			position: absolute;
			left: calc(24px * var(--shell-density-scale));
			top: calc(24px * var(--shell-density-scale));
			padding: calc(14px * var(--shell-density-scale)) calc(16px * var(--shell-density-scale));
			border-radius: calc(14px * var(--shell-density-scale));
			background: var(--shell-overlay);
			border: 1px solid var(--shell-control-border);
			max-width: calc(320px * var(--shell-density-scale));
		}

		.desktop-empty-state strong {
			display: block;
			margin-bottom: calc(6px * var(--shell-density-scale));
		}

		.windows {
			position: absolute;
			inset: calc(22px * var(--shell-density-scale));
		}

		.window-shell {
			position: absolute;
			width: min(420px, calc(100vw - 88px));
			min-height: calc(220px * var(--shell-density-scale));
			border-radius: calc(18px * var(--shell-density-scale));
			overflow: hidden;
			border: 1px solid var(--shell-control-border);
			background: var(--shell-panel-strong);
			backdrop-filter: blur(18px);
			box-shadow: 0 calc(22px * var(--shell-density-scale)) calc(65px * var(--shell-density-scale)) var(--shell-shadow);
		}

		.window-shell[data-maximized='true'] {
			left: 0 !important;
			top: 0 !important;
			width: 100% !important;
			height: calc(100% - 10px) !important;
		}

		.window-shell[data-focused='false'] {
			opacity: 0.88;
		}

		.window-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: calc(12px * var(--shell-density-scale));
			padding: calc(14px * var(--shell-density-scale)) calc(16px * var(--shell-density-scale));
			background: var(--shell-panel);
			border-bottom: 1px solid var(--shell-control-border);
			cursor: grab;
			user-select: none;
		}

		.window-header:active {
			cursor: grabbing;
		}

		.window-title {
			display: flex;
			align-items: center;
			gap: calc(10px * var(--shell-density-scale));
			font-weight: 700;
		}

		.window-controls {
			display: flex;
			gap: calc(8px * var(--shell-density-scale));
		}

		.window-controls button,
		.launcher-toggle,
		.launcher-card,
		.dock button,
		.settings-select {
			border: 1px solid var(--shell-control-border);
			background: var(--shell-control);
			color: inherit;
		}

		.window-controls button,
		.launcher-toggle,
		.dock button {
			border-radius: calc(12px * var(--shell-density-scale));
			padding: calc(8px * var(--shell-density-scale)) calc(10px * var(--shell-density-scale));
			cursor: pointer;
		}

		.window-body {
			padding: calc(18px * var(--shell-density-scale));
			display: grid;
			gap: calc(14px * var(--shell-density-scale));
			height: calc(100% - calc(61px * var(--shell-density-scale)));
			min-height: 0;
			overflow: auto;
			scrollbar-gutter: stable both-edges;
			scrollbar-color: var(--shell-scrollbar-thumb) var(--shell-scrollbar-track);
			scrollbar-width: thin;
		}

		.window-body::-webkit-scrollbar {
			width: calc(12px * var(--shell-density-scale));
			height: calc(12px * var(--shell-density-scale));
		}

		.window-body::-webkit-scrollbar-track {
			background: var(--shell-scrollbar-track);
			border-radius: 999px;
		}

		.window-body::-webkit-scrollbar-thumb {
			background-color: var(--shell-scrollbar-thumb);
			border-radius: 999px;
			border: calc(3px * var(--shell-density-scale)) solid transparent;
			background-clip: content-box;
		}

		.window-body::-webkit-scrollbar-thumb:hover {
			background-color: var(--shell-scrollbar-thumb-hover);
		}

		.window-body::-webkit-scrollbar-corner {
			background: var(--shell-scrollbar-corner);
		}

		.window-resize-handle {
			position: absolute;
			right: 0;
			bottom: 0;
			width: calc(20px * var(--shell-density-scale));
			height: calc(20px * var(--shell-density-scale));
			border: 0;
			padding: 0;
			background:
				linear-gradient(135deg, transparent 0 42%, rgba(255, 255, 255, 0.18) 42% 50%, transparent 50% 64%, rgba(255, 255, 255, 0.18) 64% 72%, transparent 72% 100%);
			cursor: nwse-resize;
			opacity: 0.85;
		}

		.window-resize-handle:hover,
		.window-resize-handle:focus-visible {
			opacity: 1;
			outline: none;
		}

		.window-shell[data-maximized='true'] .window-resize-handle {
			display: none;
		}

		.window-body h2,
		.window-body h3,
		.window-body p {
			margin: 0;
		}

		.settings-grid {
			display: grid;
			gap: calc(14px * var(--shell-density-scale));
		}

		.settings-panel {
			padding: calc(14px * var(--shell-density-scale));
			border-radius: calc(14px * var(--shell-density-scale));
			background: var(--shell-control);
			border: 1px solid var(--shell-control-border);
			display: grid;
			gap: calc(10px * var(--shell-density-scale));
		}

		.settings-panel header {
			display: grid;
			gap: calc(4px * var(--shell-density-scale));
		}

		.settings-row {
			display: grid;
			gap: calc(8px * var(--shell-density-scale));
		}

		.settings-select {
			padding: calc(10px * var(--shell-density-scale)) calc(12px * var(--shell-density-scale));
			border-radius: calc(12px * var(--shell-density-scale));
		}

		.settings-note {
			font-size: calc(13.12px * var(--shell-density-scale));
			color: var(--shell-muted-text);
		}

		.dock-region {
			display: flex;
			justify-content: center;
			padding: 0 0 calc(18px * var(--shell-density-scale));
		}

		.dock {
			display: flex;
			align-items: center;
			gap: calc(10px * var(--shell-density-scale));
			padding: calc(12px * var(--shell-density-scale));
			border-radius: calc(22px * var(--shell-density-scale));
			background: var(--shell-panel);
			backdrop-filter: blur(18px);
			border: 1px solid var(--shell-control-border);
			max-width: calc(100vw - 24px);
		}

		.dock button {
			min-width: calc(88px * var(--shell-density-scale));
			display: grid;
			gap: calc(4px * var(--shell-density-scale));
			justify-items: center;
		}

		.dock button[data-running='true'] {
			background: rgba(56, 189, 248, 0.22);
		}

		.launcher-panel {
			position: absolute;
			left: calc(22px * var(--shell-density-scale));
			bottom: calc(100px * var(--shell-density-scale));
			width: min(460px, calc(100vw - 44px));
			padding: calc(18px * var(--shell-density-scale));
			border-radius: calc(20px * var(--shell-density-scale));
			background: var(--shell-panel-strong);
			border: 1px solid var(--shell-control-border);
			backdrop-filter: blur(18px);
			box-shadow: 0 calc(22px * var(--shell-density-scale)) calc(65px * var(--shell-density-scale)) var(--shell-shadow);
		}

		.launcher-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(calc(130px * var(--shell-density-scale)), 1fr));
			gap: calc(12px * var(--shell-density-scale));
			margin-top: calc(14px * var(--shell-density-scale));
		}

		.launcher-card {
			display: grid;
			gap: calc(8px * var(--shell-density-scale));
			padding: calc(14px * var(--shell-density-scale));
			border-radius: calc(16px * var(--shell-density-scale));
			cursor: pointer;
			text-align: left;
		}

		.launcher-card strong,
		.dock-label,
		.icon-tile {
			display: block;
		}

		.launcher-card small,
		.dock-label,
		.window-subtitle {
			color: var(--shell-muted-text);
		}

		.icon-tile {
			font-size: calc(25.6px * var(--shell-density-scale));
		}

		.status-pill {
			display: inline-flex;
			align-items: center;
			gap: calc(8px * var(--shell-density-scale));
			padding: calc(8px * var(--shell-density-scale)) calc(12px * var(--shell-density-scale));
			width: fit-content;
			border-radius: 999px;
			background: var(--shell-status);
			border: 1px solid var(--shell-status-border);
			color: var(--shell-status-text);
		}
	`

	@Spec('Renders the shell settings content with independent theme and wallpaper selection controls.')
	static renderSettingsContent(
		activeTheme: string,
		activeWallpaper: string,
		wallpaperChoices: Array<{ id: string, label: string }>,
		onThemeChange: (event: Event) => void,
		onWallpaperChange: (event: Event) => void
	): TemplateResult {
		return html`
			<div class="settings-grid">
				<div class="status-pill">⚙️ Settings are saved locally in this browser</div>
				<section class="settings-panel">
					<header>
						<strong>Appearance mode</strong>
						<span class="settings-note">Theme changes the shell chrome only. Your wallpaper stays exactly as selected.</span>
					</header>
					<div class="settings-row">
						<label for="theme-select">Theme</label>
						<select id="theme-select" class="settings-select" data-testid="theme-select" .value=${activeTheme} @change=${onThemeChange}>
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
						<select id="wallpaper-select" class="settings-select" data-testid="wallpaper-select" .value=${activeWallpaper} @change=${onWallpaperChange}>
							${wallpaperChoices.map(choice => html`<option .value=${choice.id}>${choice.label}</option>`)}
						</select>
					</div>
				</section>
			</div>
		`
	}
}
