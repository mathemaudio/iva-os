import { css, type CSSResultGroup } from 'lit'
import { Spec } from '@shared/lll.lll'

@Spec('Provides shared styles for the File Manager browsing experience.')
export class FileManagerViewStyles {
	static readonly styles: CSSResultGroup = css`
		:host {
			--file-manager-scrollbar-track: var(--shell-scrollbar-track, rgba(255, 255, 255, 0.08));
			--file-manager-scrollbar-thumb: var(--shell-scrollbar-thumb, rgba(226, 232, 240, 0.58));
			--file-manager-scrollbar-thumb-hover: var(--shell-scrollbar-thumb-hover, rgba(241, 245, 249, 0.78));
			--file-manager-scrollbar-corner: var(--shell-scrollbar-corner, rgba(255, 255, 255, 0.04));
			display: block;
			height: 100%;
			color: var(--shell-text, rgb(241, 245, 249));
			color-scheme: inherit;
		}

		* {
			box-sizing: border-box;
		}

		button,
		input,
		select {
			font: inherit;
		}

		button {
			cursor: pointer;
		}

		.file-manager {
			display: grid;
			grid-template-columns: 200px minmax(0, 1fr);
			height: 100%;
			min-height: 0;
			background: var(--shell-overlay, rgba(8, 15, 33, 0.28));
		}

		.sidebar {
			display: grid;
			align-content: start;
			gap: 10px;
			padding: 16px;
			background: color-mix(in srgb, var(--shell-panel, rgba(15, 23, 42, 0.68)) 72%, transparent);
			border-right: 1px solid var(--shell-control-border, rgba(255, 255, 255, 0.14));
		}

		.sidebar h3,
		.main h3,
		.main p {
			margin: 0;
		}

		.sidebar-list {
			display: grid;
			gap: 8px;
		}

		.sidebar-button,
		.toolbar button,
		.breadcrumb-button,
		.node-card,
		.node-row,
		.dialog button,
		.dialog select,
		.dialog input {
			border: 1px solid var(--shell-control-border, rgba(255, 255, 255, 0.14));
			background: var(--shell-control, rgba(255, 255, 255, 0.08));
			color: inherit;
		}

		.sidebar-button,
		.toolbar button,
		.breadcrumb-button,
		.dialog button,
		.dialog select,
		.dialog input {
			border-radius: 12px;
		}

		.sidebar-button {
			padding: 10px 12px;
			text-align: left;
		}

		.sidebar-button[data-active='true'] {
			background: rgba(56, 189, 248, 0.2);
			border-color: rgba(56, 189, 248, 0.45);
		}

		.main {
			display: grid;
			grid-template-rows: auto auto auto minmax(0, 1fr);
			min-width: 0;
			min-height: 0;
		}

		.toolbar {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
			padding: 16px 16px 12px;
			border-bottom: 1px solid var(--shell-control-border, rgba(255, 255, 255, 0.14));
		}

		.toolbar button {
			padding: 9px 12px;
		}

		.toolbar button:disabled {
			opacity: 0.55;
			cursor: not-allowed;
		}

		.location-bar {
			display: grid;
			gap: 10px;
			padding: 14px 16px 0;
		}

		.current-folder {
			font-size: 1rem;
			font-weight: 700;
		}

		.breadcrumbs {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 8px;
		}

		.breadcrumb-button {
			padding: 6px 10px;
		}

		.status-stack {
			display: grid;
			gap: 10px;
			padding: 12px 16px 0;
		}

		.status-pill,
		.error-pill {
			padding: 10px 12px;
			border-radius: 14px;
			border: 1px solid var(--shell-control-border, rgba(255, 255, 255, 0.14));
		}

		.status-pill {
			background: var(--shell-status, rgba(34, 197, 94, 0.14));
			border-color: var(--shell-status-border, rgba(34, 197, 94, 0.24));
			color: var(--shell-status-text, rgb(220, 252, 231));
		}

		.error-pill {
			background: var(--shell-error, rgba(248, 113, 113, 0.14));
			border-color: var(--shell-error-border, rgba(248, 113, 113, 0.24));
			color: var(--shell-error-text, rgb(254, 226, 226));
		}

		.content-region {
			padding: 16px;
			min-height: 0;
			overflow: auto;
			scrollbar-color: var(--file-manager-scrollbar-thumb) var(--file-manager-scrollbar-track);
			scrollbar-width: thin;
		}

		.content-region::-webkit-scrollbar {
			width: 12px;
			height: 12px;
		}

		.content-region::-webkit-scrollbar-track {
			background: var(--file-manager-scrollbar-track);
			border-radius: 999px;
		}

		.content-region::-webkit-scrollbar-thumb {
			background-color: var(--file-manager-scrollbar-thumb);
			border-radius: 999px;
			border: 3px solid transparent;
			background-clip: content-box;
		}

		.content-region::-webkit-scrollbar-thumb:hover {
			background-color: var(--file-manager-scrollbar-thumb-hover);
		}

		.content-region::-webkit-scrollbar-corner {
			background: var(--file-manager-scrollbar-corner);
		}

		.empty-state {
			display: grid;
			justify-items: start;
			gap: 8px;
			padding: 24px;
			border-radius: 18px;
			background: color-mix(in srgb, var(--shell-control, rgba(255, 255, 255, 0.08)) 78%, transparent);
			border: 1px dashed var(--shell-control-border, rgba(255, 255, 255, 0.14));
		}

		.grid-view {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: 14px;
		}

		.node-card,
		.node-row {
			display: grid;
			gap: 10px;
			text-align: left;
		}

		.node-card {
			padding: 14px;
			border-radius: 16px;
			min-height: 148px;
			align-content: start;
		}

		.node-card[data-selected='true'],
		.node-row[data-selected='true'] {
			background: rgba(56, 189, 248, 0.18);
			border-color: rgba(56, 189, 248, 0.4);
		}

		.node-card[data-focused='true'],
		.node-row[data-focused='true'] {
			outline: 2px solid rgba(125, 211, 252, 0.65);
			outline-offset: 1px;
		}

		.node-preview {
			display: grid;
			place-items: center;
			min-height: 68px;
			border-radius: 14px;
			background: color-mix(in srgb, var(--shell-panel-strong, rgba(15, 23, 42, 0.82)) 34%, transparent);
			font-size: 2rem;
			overflow: hidden;
		}

		.node-preview img {
			width: 100%;
			height: 68px;
			object-fit: cover;
			display: block;
		}

		.node-title {
			font-weight: 700;
			word-break: break-word;
		}

		.node-meta {
			font-size: 0.78rem;
			color: var(--shell-muted-text, rgba(226, 232, 240, 0.82));
			word-break: break-word;
		}

		.list-view {
			display: grid;
			gap: 8px;
		}

		.list-header,
		.node-row {
			grid-template-columns: minmax(0, 1.6fr) minmax(110px, 0.9fr) minmax(130px, 0.9fr) minmax(70px, 0.55fr);
			align-items: center;
		}

		.list-header {
			display: grid;
			gap: 10px;
			padding: 0 14px 8px;
			font-size: 0.78rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--shell-muted-text, rgba(226, 232, 240, 0.82));
		}

		.node-row {
			padding: 12px 14px;
			border-radius: 14px;
		}

		.node-row-name {
			display: flex;
			align-items: center;
			gap: 10px;
			min-width: 0;
		}

		.node-row-name span:last-child {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.row-thumbnail {
			width: 28px;
			height: 28px;
			border-radius: 8px;
			object-fit: cover;
			background: color-mix(in srgb, var(--shell-panel-strong, rgba(15, 23, 42, 0.82)) 34%, transparent);
		}

		.dialog-scrim {
			position: absolute;
			inset: 0;
			display: grid;
			place-items: center;
			padding: 20px;
			background: color-mix(in srgb, var(--shell-panel-strong, rgba(15, 23, 42, 0.82)) 52%, transparent);
			backdrop-filter: blur(8px);
		}

		.dialog {
			width: min(420px, 100%);
			display: grid;
			gap: 14px;
			padding: 18px;
			border-radius: 18px;
			background: color-mix(in srgb, var(--shell-panel-strong, rgba(15, 23, 42, 0.82)) 96%, white 4%);
			border: 1px solid var(--shell-control-border, rgba(255, 255, 255, 0.14));
			box-shadow: 0 22px 60px var(--shell-shadow, rgba(15, 23, 42, 0.42));
		}

		.dialog p,
		.dialog h3 {
			margin: 0;
		}

		.dialog input,
		.dialog select {
			width: 100%;
			padding: 10px 12px;
		}

		.dialog-actions {
			display: flex;
			justify-content: end;
			gap: 10px;
		}

		.dialog-actions button {
			padding: 9px 12px;
		}

		.sr-only {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}
	`
}
