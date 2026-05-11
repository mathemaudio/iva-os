import { css, html, type CSSResultGroup, type TemplateResult } from 'lit'
import { Spec } from '@shared/lll.lll'
import { EmojiIconRenderer } from './EmojiIconRenderer.lll'

@Spec('Provides shared shell styles plus settings-window rendering helpers for IvaOS.')
export class AppShellView {
	static readonly styles: CSSResultGroup = [
		EmojiIconRenderer.styles,
		css`
		:host {
			display: block;
			height: 100vh;
			margin: 0;
			font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
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
			--shell-text: rgb(235, 239, 247);
			--shell-muted-text: rgba(212, 220, 235, 0.78);
			--shell-muted-strong: rgba(228, 234, 245, 0.9);
			--shell-panel: rgba(16, 21, 34, 0.78);
			--shell-panel-strong: rgba(13, 18, 30, 0.92);
			--shell-panel-solid: rgb(18, 24, 38);
			--shell-window-fill: linear-gradient(180deg, rgba(24, 30, 46, 0.94) 0%, rgba(12, 17, 28, 0.97) 100%);
			--shell-window-header: linear-gradient(180deg, rgba(42, 48, 66, 0.94) 0%, rgba(22, 27, 40, 0.98) 100%);
			--shell-window-border: rgba(255, 255, 255, 0.12);
			--shell-window-inner-border: rgba(255, 255, 255, 0.05);
			--shell-control: rgba(255, 255, 255, 0.07);
			--shell-control-strong: rgba(255, 255, 255, 0.1);
			--shell-control-border: rgba(255, 255, 255, 0.14);
			--shell-selection: rgba(89, 144, 255, 0.26);
			--shell-selection-border: rgba(122, 168, 255, 0.56);
			--shell-status: rgba(60, 160, 84, 0.16);
			--shell-status-border: rgba(98, 202, 123, 0.34);
			--shell-status-text: rgb(214, 248, 220);
			--shell-error: rgba(187, 78, 78, 0.2);
			--shell-error-border: rgba(255, 126, 126, 0.34);
			--shell-error-text: rgb(255, 220, 220);
			--shell-shadow: rgba(4, 8, 18, 0.56);
			--shell-overlay: rgba(6, 10, 20, 0.48);
			--shell-scrollbar-track: rgba(255, 255, 255, 0.06);
			--shell-scrollbar-thumb: rgba(210, 220, 236, 0.38);
			--shell-scrollbar-thumb-hover: rgba(233, 239, 250, 0.56);
			--shell-scrollbar-corner: rgba(255, 255, 255, 0.04);
			height: 100%;
			position: relative;
			isolation: isolate;
			display: grid;
			grid-template-rows: auto 1fr auto;
			background-color: rgb(8, 13, 24);
			background-size: cover;
			background-position: center;
			background-repeat: no-repeat;
			color: var(--shell-text);
			color-scheme: dark;
			font-size: calc(16px * var(--shell-density-scale));
		}

		.shell::before {
			content: '';
			position: absolute;
			inset: 0;
			pointer-events: none;
			background:
				linear-gradient(180deg, rgba(7, 11, 19, 0.4) 0%, rgba(7, 11, 19, 0.05) 24%, rgba(7, 11, 19, 0.18) 100%),
				radial-gradient(circle at 20% 0%, rgba(151, 174, 255, 0.18) 0%, transparent 32%),
				radial-gradient(circle at 100% 100%, rgba(69, 129, 255, 0.12) 0%, transparent 28%);
		}

		.shell[data-theme='light'] {
			--shell-text: rgb(28, 34, 48);
			--shell-muted-text: rgba(40, 48, 66, 0.72);
			--shell-muted-strong: rgba(40, 48, 66, 0.86);
			--shell-panel: rgba(248, 250, 255, 0.74);
			--shell-panel-strong: rgba(247, 249, 255, 0.9);
			--shell-panel-solid: rgb(235, 240, 250);
			--shell-window-fill: linear-gradient(180deg, rgba(252, 254, 255, 0.98) 0%, rgba(236, 242, 251, 0.97) 100%);
			--shell-window-header: linear-gradient(180deg, rgba(240, 244, 252, 0.98) 0%, rgba(224, 232, 245, 0.98) 100%);
			--shell-window-border: rgba(121, 138, 171, 0.36);
			--shell-window-inner-border: rgba(255, 255, 255, 0.72);
			--shell-control: rgba(255, 255, 255, 0.76);
			--shell-control-strong: rgba(255, 255, 255, 0.94);
			--shell-control-border: rgba(127, 143, 175, 0.34);
			--shell-selection: rgba(85, 137, 249, 0.16);
			--shell-selection-border: rgba(85, 137, 249, 0.44);
			--shell-status: rgba(58, 164, 87, 0.12);
			--shell-status-border: rgba(58, 164, 87, 0.24);
			--shell-status-text: rgb(30, 112, 56);
			--shell-error: rgba(225, 93, 93, 0.14);
			--shell-error-border: rgba(218, 83, 83, 0.24);
			--shell-error-text: rgb(163, 35, 35);
			--shell-shadow: rgba(93, 111, 145, 0.22);
			--shell-overlay: rgba(255, 255, 255, 0.28);
			--shell-scrollbar-track: rgba(131, 145, 170, 0.14);
			--shell-scrollbar-thumb: rgba(90, 106, 134, 0.34);
			--shell-scrollbar-thumb-hover: rgba(70, 85, 110, 0.48);
			--shell-scrollbar-corner: rgba(131, 145, 170, 0.06);
			background-color: rgb(214, 223, 236);
			color-scheme: light;
		}

		.top-bar {
			position: relative;
			z-index: 2;
			display: grid;
			grid-template-columns: 1fr auto 1fr;
			align-items: center;
			gap: calc(16px * var(--shell-density-scale));
			padding: calc(8px * var(--shell-density-scale)) calc(16px * var(--shell-density-scale));
			min-height: calc(34px * var(--shell-density-scale));
			background: linear-gradient(180deg, rgba(22, 28, 42, 0.84) 0%, rgba(12, 17, 28, 0.68) 100%);
			backdrop-filter: blur(18px) saturate(1.18);
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
			box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.04);
		}

		.shell[data-theme='light'] .top-bar {
			background: linear-gradient(180deg, rgba(249, 251, 255, 0.9) 0%, rgba(228, 235, 247, 0.82) 100%);
			border-bottom-color: rgba(121, 138, 171, 0.18);
			box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.7);
		}

		.brand {
			display: inline-flex;
			align-items: baseline;
			gap: calc(10px * var(--shell-density-scale));
			min-width: 0;
		}

		.brand strong {
			font-size: calc(15px * var(--shell-density-scale));
			font-weight: 700;
			letter-spacing: 0.01em;
		}

		.brand span,
		.top-bar-clock {
			font-size: calc(12.6px * var(--shell-density-scale));
			color: var(--shell-muted-text);
		}

		.top-bar-clock {
			justify-self: end;
			font-variant-numeric: tabular-nums;
		}

		.desktop {
			position: relative;
			overflow: visible;
			padding: calc(18px * var(--shell-density-scale)) calc(18px * var(--shell-density-scale)) calc(10px * var(--shell-density-scale));
		}

		.desktop-empty-state {
			position: absolute;
			left: calc(24px * var(--shell-density-scale));
			top: calc(24px * var(--shell-density-scale));
			padding: calc(14px * var(--shell-density-scale)) calc(16px * var(--shell-density-scale));
			border-radius: calc(12px * var(--shell-density-scale));
			background: color-mix(in srgb, var(--shell-panel-solid) 84%, transparent);
			border: 1px solid var(--shell-window-border);
			box-shadow: 0 calc(14px * var(--shell-density-scale)) calc(36px * var(--shell-density-scale)) rgba(0, 0, 0, 0.18);
			max-width: calc(320px * var(--shell-density-scale));
		}

		.desktop-empty-state strong {
			display: block;
			margin-bottom: calc(6px * var(--shell-density-scale));
		}

		.windows {
			position: absolute;
			inset: calc(18px * var(--shell-density-scale));
			overflow: visible;
		}

		.window-shell {
			position: absolute;
			width: min(480px, calc(100vw - 88px));
			min-height: calc(240px * var(--shell-density-scale));
			border-radius: calc(18px * var(--shell-density-scale));
			overflow: hidden;
			border: 1px solid var(--shell-window-border);
			background: var(--shell-window-fill);
			box-shadow:
				0 calc(18px * var(--shell-density-scale)) calc(44px * var(--shell-density-scale)) var(--shell-shadow),
				0 calc(4px * var(--shell-density-scale)) calc(10px * var(--shell-density-scale)) rgba(0, 0, 0, 0.22),
				inset 0 1px 0 var(--shell-window-inner-border);
		}

		.window-shell::after {
			content: '';
			position: absolute;
			inset: 0;
			pointer-events: none;
			border-radius: inherit;
			box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
		}

		.window-shell[data-maximized='true'] {
			left: 0 !important;
			top: 0 !important;
			width: 100% !important;
			height: calc(100% - 10px) !important;
			border-radius: calc(14px * var(--shell-density-scale));
		}

		.window-shell[data-focused='false'] {
			opacity: 0.93;
			filter: saturate(0.86) brightness(0.94);
		}

		.window-shell[data-focused='true'] {
			border-color: color-mix(in srgb, var(--shell-selection-border) 58%, var(--shell-window-border));
		}

		.window-header {
			display: grid;
			grid-template-columns: auto 1fr auto;
			align-items: center;
			gap: calc(12px * var(--shell-density-scale));
			padding: calc(12px * var(--shell-density-scale)) calc(16px * var(--shell-density-scale));
			background: var(--shell-window-header);
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
			gap: calc(10px * var(--shell-density-scale));
			font-weight: 700;
			min-width: 0;
		}

		.window-title > .emoji-icon {
			font-size: calc(15px * var(--shell-density-scale));
		}

		.window-title > div {
			display: grid;
			gap: calc(2px * var(--shell-density-scale));
			min-width: 0;
		}

		.window-title > div > div:first-child {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.window-controls {
			display: flex;
			gap: calc(8px * var(--shell-density-scale));
		}

		.window-controls-leading,
		.window-controls-trailing {
			min-width: calc(66px * var(--shell-density-scale));
		}

		.window-controls-trailing {
			justify-content: flex-end;
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

		.window-controls button {
			width: calc(14px * var(--shell-density-scale));
			height: calc(14px * var(--shell-density-scale));
			padding: 0;
			border-radius: 999px;
			cursor: pointer;
			font-size: 0;
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
		}

		.window-controls button[data-role='minimize'] {
			background: linear-gradient(180deg, rgb(246, 205, 83) 0%, rgb(222, 164, 50) 100%);
			border-color: rgba(154, 99, 24, 0.68);
		}

		.window-controls button[data-role='maximize'] {
			background: linear-gradient(180deg, rgb(88, 206, 109) 0%, rgb(44, 165, 80) 100%);
			border-color: rgba(22, 109, 49, 0.66);
		}

		.window-controls button[data-role='close'] {
			background: linear-gradient(180deg, rgb(255, 116, 110) 0%, rgb(223, 79, 70) 100%);
			border-color: rgba(136, 41, 35, 0.68);
		}

		.window-controls button:hover {
			filter: brightness(1.05);
		}

		.window-controls button:focus-visible {
			outline: 2px solid var(--shell-selection-border);
			outline-offset: 2px;
		}

		.window-subtitle,
		.launcher-card small,
		.dock-label {
			color: var(--shell-muted-text);
		}

		.window-body {
			padding: 0;
			display: block;
			height: calc(100% - calc(58px * var(--shell-density-scale)));
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
				linear-gradient(135deg, transparent 0 42%, rgba(255, 255, 255, 0.24) 42% 48%, transparent 48% 62%, rgba(255, 255, 255, 0.22) 62% 68%, transparent 68% 100%);
			cursor: nwse-resize;
			opacity: 0.74;
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
			padding: calc(20px * var(--shell-density-scale));
		}

		.settings-panel {
			padding: calc(14px * var(--shell-density-scale));
			border-radius: calc(12px * var(--shell-density-scale));
			background: color-mix(in srgb, var(--shell-control-strong) 86%, transparent);
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
			border-radius: calc(10px * var(--shell-density-scale));
		}

		.settings-note {
			font-size: calc(13.12px * var(--shell-density-scale));
			color: var(--shell-muted-text);
		}

		.dock-region {
			position: relative;
			z-index: 2;
			display: flex;
			justify-content: center;
			padding: 0 0 calc(16px * var(--shell-density-scale));
		}

		.dock {
			display: flex;
			align-items: end;
			gap: calc(10px * var(--shell-density-scale));
			padding: calc(10px * var(--shell-density-scale));
			border-radius: calc(18px * var(--shell-density-scale));
			background: linear-gradient(180deg, rgba(40, 47, 65, 0.74) 0%, rgba(16, 22, 34, 0.82) 100%);
			backdrop-filter: blur(18px) saturate(1.16);
			border: 1px solid rgba(255, 255, 255, 0.12);
			box-shadow:
				0 calc(14px * var(--shell-density-scale)) calc(36px * var(--shell-density-scale)) rgba(0, 0, 0, 0.28),
				inset 0 1px 0 rgba(255, 255, 255, 0.08);
			max-width: calc(100vw - 24px);
		}

		.shell[data-theme='light'] .dock {
			background: linear-gradient(180deg, rgba(247, 250, 255, 0.84) 0%, rgba(225, 233, 246, 0.84) 100%);
		}

		.launcher-toggle,
		.dock button {
			border-radius: calc(14px * var(--shell-density-scale));
			padding: calc(8px * var(--shell-density-scale)) calc(10px * var(--shell-density-scale));
			cursor: pointer;
		}

		.dock button {
			min-width: calc(82px * var(--shell-density-scale));
			display: grid;
			gap: calc(4px * var(--shell-density-scale));
			justify-items: center;
			padding-top: calc(10px * var(--shell-density-scale));
			padding-bottom: calc(10px * var(--shell-density-scale));
		}

		.dock button > .emoji-icon {
			font-size: calc(24px * var(--shell-density-scale));
		}

		.dock button[data-running='true'] {
			background: color-mix(in srgb, var(--shell-selection) 84%, var(--shell-control));
			border-color: color-mix(in srgb, var(--shell-selection-border) 60%, var(--shell-control-border));
		}

		.launcher-panel {
			position: absolute;
			left: calc(22px * var(--shell-density-scale));
			bottom: calc(94px * var(--shell-density-scale));
			width: min(540px, calc(100vw - 44px));
			padding: calc(18px * var(--shell-density-scale));
			border-radius: calc(18px * var(--shell-density-scale));
			background: color-mix(in srgb, var(--shell-panel-strong) 96%, transparent);
			border: 1px solid var(--shell-window-border);
			backdrop-filter: blur(18px) saturate(1.14);
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
			border-radius: calc(14px * var(--shell-density-scale));
			cursor: pointer;
			text-align: left;
		}

		.launcher-card strong,
		.dock-label,
		.icon-tile {
			display: block;
		}

		.icon-tile {
			font-size: calc(25.6px * var(--shell-density-scale));
		}

		.launcher-card > .emoji-icon {
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
	]

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
				<div class="status-pill">${EmojiIconRenderer.renderIcon('⚙️', 'Settings')}<span>Settings are saved locally in this browser</span></div>
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
