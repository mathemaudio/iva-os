import { css, html, type CSSResultGroup, type TemplateResult } from 'lit'
import { Spec } from '@shared/lll.lll'

@Spec('Provides shared view rendering and styles for the Web OS shell.')
export class AppShellView {
	static readonly styles: CSSResultGroup = css`
		:host {
			display: block;
			height: 100vh;
			margin: 0;
			color: rgb(241, 245, 249);
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
			height: 100%;
			display: grid;
			grid-template-rows: auto 1fr auto;
			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
		}

		.shell[data-theme='midnight'] {
			background-image:
				linear-gradient(180deg, rgba(8, 15, 33, 0.42), rgba(7, 10, 20, 0.72)),
				linear-gradient(135deg, rgb(32, 78, 151), rgb(15, 23, 42) 55%, rgb(56, 189, 248));
		}

		.shell[data-theme='sunset'] {
			background-image:
				linear-gradient(180deg, rgba(67, 20, 7, 0.2), rgba(33, 11, 28, 0.55)),
				linear-gradient(135deg, rgb(249, 115, 22), rgb(236, 72, 153) 52%, rgb(99, 102, 241));
		}

		.shell[data-wallpaper='aurora'] {
			background-blend-mode: overlay, normal;
		}

		.shell[data-wallpaper='dunes'] {
			background-image:
				linear-gradient(180deg, rgba(41, 24, 12, 0.2), rgba(19, 14, 26, 0.62)),
				linear-gradient(160deg, rgb(245, 158, 11), rgb(234, 88, 12) 48%, rgb(120, 53, 15));
		}

		.shell[data-wallpaper='grid'] {
			background-image:
				linear-gradient(180deg, rgba(4, 13, 24, 0.3), rgba(3, 7, 18, 0.74)),
				radial-gradient(circle at top left, rgba(34, 197, 94, 0.28), transparent 35%),
				linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
				linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
				linear-gradient(135deg, rgb(15, 23, 42), rgb(17, 94, 89));
			background-size: auto, auto, 32px 32px, 32px 32px, auto;
		}

		.top-bar {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 16px;
			padding: 12px 18px;
			background: rgba(15, 23, 42, 0.48);
			backdrop-filter: blur(18px);
			border-bottom: 1px solid rgba(255, 255, 255, 0.14);
		}

		.brand {
			display: grid;
			gap: 2px;
		}

		.brand strong {
			font-size: 0.95rem;
			letter-spacing: 0.02em;
		}

		.brand span,
		.top-bar-clock {
			font-size: 0.8rem;
			color: rgba(226, 232, 240, 0.82);
		}

		.desktop {
			position: relative;
			overflow: hidden;
			padding: 22px;
		}

		.desktop-empty-state {
			position: absolute;
			left: 24px;
			top: 24px;
			padding: 14px 16px;
			border-radius: 14px;
			background: rgba(15, 23, 42, 0.28);
			border: 1px solid rgba(255, 255, 255, 0.12);
			max-width: 320px;
		}

		.desktop-empty-state strong {
			display: block;
			margin-bottom: 6px;
		}

		.windows {
			position: absolute;
			inset: 22px 22px 22px 22px;
		}

		.window-shell {
			position: absolute;
			width: min(420px, calc(100vw - 88px));
			min-height: 220px;
			border-radius: 18px;
			overflow: hidden;
			border: 1px solid rgba(255, 255, 255, 0.14);
			background: rgba(15, 23, 42, 0.78);
			backdrop-filter: blur(18px);
			box-shadow: 0 22px 65px rgba(15, 23, 42, 0.42);
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
			gap: 12px;
			padding: 14px 16px;
			background: rgba(15, 23, 42, 0.58);
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
			cursor: grab;
			user-select: none;
		}

		.window-header:active {
			cursor: grabbing;
		}

		.window-title {
			display: flex;
			align-items: center;
			gap: 10px;
			font-weight: 700;
		}

		.window-controls {
			display: flex;
			gap: 8px;
		}

		.window-controls button,
		.launcher-toggle,
		.launcher-card,
		.dock button,
		.settings-row select {
			border: 1px solid rgba(255, 255, 255, 0.12);
			background: rgba(255, 255, 255, 0.08);
			color: inherit;
		}

		.window-controls button,
		.launcher-toggle,
		.dock button {
			border-radius: 12px;
			padding: 8px 10px;
			cursor: pointer;
		}

		.window-body {
			padding: 18px;
			display: grid;
			gap: 14px;
		}

		.window-body h2,
		.window-body h3,
		.window-body p {
			margin: 0;
		}

		.placeholder-grid {
			display: grid;
			gap: 12px;
		}

		.placeholder-panel {
			padding: 14px;
			border-radius: 14px;
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.1);
		}

		.settings-row {
			display: grid;
			gap: 8px;
		}

		.settings-row select {
			padding: 10px 12px;
			border-radius: 12px;
		}

		.dock-region {
			display: flex;
			justify-content: center;
			padding: 0 0 18px;
		}

		.dock {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 12px;
			border-radius: 22px;
			background: rgba(15, 23, 42, 0.5);
			backdrop-filter: blur(18px);
			border: 1px solid rgba(255, 255, 255, 0.14);
			max-width: calc(100vw - 24px);
		}

		.dock button {
			min-width: 88px;
			display: grid;
			gap: 4px;
			justify-items: center;
		}

		.dock button[data-running='true'] {
			background: rgba(56, 189, 248, 0.22);
		}

		.launcher-panel {
			position: absolute;
			left: 22px;
			bottom: 100px;
			width: min(460px, calc(100vw - 44px));
			padding: 18px;
			border-radius: 20px;
			background: rgba(15, 23, 42, 0.72);
			border: 1px solid rgba(255, 255, 255, 0.14);
			backdrop-filter: blur(18px);
			box-shadow: 0 22px 65px rgba(15, 23, 42, 0.45);
		}

		.launcher-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
			gap: 12px;
			margin-top: 14px;
		}

		.launcher-card {
			display: grid;
			gap: 8px;
			padding: 14px;
			border-radius: 16px;
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
			color: rgba(226, 232, 240, 0.8);
		}

		.icon-tile {
			font-size: 1.6rem;
		}

		.status-pill {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 8px 12px;
			width: fit-content;
			border-radius: 999px;
			background: rgba(34, 197, 94, 0.14);
			border: 1px solid rgba(34, 197, 94, 0.24);
			color: rgb(220, 252, 231);
		}
	`

	@Spec('Renders the inside of a single application window.')
	static renderWindowContent(appId: string, activeTheme: string, activeWallpaper: string, onThemeChange: (event: Event) => void, onWallpaperChange: (event: Event) => void): TemplateResult {
		if (appId === 'settings') {
			return html`
				<div class="placeholder-grid">
					<div class="status-pill">⚙️ Shell preferences are saved in this browser</div>
					<div class="settings-row">
						<label for="theme-select">Theme</label>
						<select id="theme-select" data-testid="theme-select" .value=${activeTheme} @change=${onThemeChange}>
							<option value="midnight">Midnight</option>
							<option value="sunset">Sunset</option>
						</select>
					</div>
					<div class="settings-row">
						<label for="wallpaper-select">Wallpaper</label>
						<select id="wallpaper-select" data-testid="wallpaper-select" .value=${activeWallpaper} @change=${onWallpaperChange}>
							<option value="aurora">Aurora</option>
							<option value="dunes">Dunes</option>
							<option value="grid">Grid</option>
						</select>
					</div>
				</div>
			`
		}

		if (appId === 'file-manager') {
			return html`
				<div class="placeholder-grid">
					<div class="placeholder-panel">
						<h3>Home</h3>
						<p>Virtual filesystem arrives in chunk 2. This placeholder reserves the browsing surface.</p>
					</div>
					<div class="placeholder-panel">
						<h3>Quick actions</h3>
						<p>Create, rename, move, and upload flows will connect here later.</p>
					</div>
				</div>
			`
		}

		if (appId === 'text-editor') {
			return html`
				<div class="placeholder-grid">
					<div class="placeholder-panel">
						<h3>Draft buffer</h3>
						<p>Text editing will connect to the virtual filesystem in chunk 2.</p>
					</div>
					<div class="placeholder-panel">
						<h3>Formatting</h3>
						<p>Keyboard and save flows will appear once files exist.</p>
					</div>
				</div>
			`
		}

		if (appId === 'image-viewer') {
			return html`
				<div class="placeholder-grid">
					<div class="placeholder-panel">
						<h3>Preview area</h3>
						<p>Image open and zoom behaviors will appear when file associations land.</p>
					</div>
				</div>
			`
		}

		return html`
			<div class="placeholder-grid">
				<div class="placeholder-panel">
					<h3>Build surface</h3>
					<p>App Studio will grow into platform tooling in chunk 3.</p>
				</div>
			</div>
		`
	}
}
