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
			grid-template-columns: calc(200px * var(--shell-density-scale, 1)) minmax(0, 1fr);
			height: 100%;
			min-height: 0;
			background: var(--shell-overlay, rgba(8, 15, 33, 0.28));
		}

		.sidebar {
			display: grid;
			align-content: start;
			gap: calc(10px * var(--shell-density-scale, 1));
			padding: calc(16px * var(--shell-density-scale, 1));
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
			gap: calc(8px * var(--shell-density-scale, 1));
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
			border-radius: calc(12px * var(--shell-density-scale, 1));
		}

		.sidebar-button {
			padding: calc(10px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
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
			gap: calc(10px * var(--shell-density-scale, 1));
			padding: calc(16px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			border-bottom: 1px solid var(--shell-control-border, rgba(255, 255, 255, 0.14));
		}

		.toolbar button {
			padding: calc(9px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
		}

		.toolbar button:disabled {
			opacity: 0.55;
			cursor: not-allowed;
		}

		.location-bar {
			display: grid;
			gap: calc(10px * var(--shell-density-scale, 1));
			padding: calc(14px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1)) 0;
		}

		.current-folder {
			font-size: calc(16px * var(--shell-density-scale, 1));
			font-weight: 700;
		}

		.breadcrumbs {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: calc(8px * var(--shell-density-scale, 1));
		}

		.breadcrumb-button {
			padding: calc(6px * var(--shell-density-scale, 1)) calc(10px * var(--shell-density-scale, 1));
		}

		.status-stack {
			display: grid;
			gap: calc(10px * var(--shell-density-scale, 1));
			padding: calc(12px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1)) 0;
		}

		.status-pill,
		.error-pill {
			padding: calc(10px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			border-radius: calc(14px * var(--shell-density-scale, 1));
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
			padding: calc(16px * var(--shell-density-scale, 1));
			min-height: 0;
			overflow: auto;
			scrollbar-color: var(--file-manager-scrollbar-thumb) var(--file-manager-scrollbar-track);
			scrollbar-width: thin;
		}

		.content-region::-webkit-scrollbar {
			width: calc(12px * var(--shell-density-scale, 1));
			height: calc(12px * var(--shell-density-scale, 1));
		}

		.content-region::-webkit-scrollbar-track {
			background: var(--file-manager-scrollbar-track);
			border-radius: 999px;
		}

		.content-region::-webkit-scrollbar-thumb {
			background-color: var(--file-manager-scrollbar-thumb);
			border-radius: 999px;
			border: calc(3px * var(--shell-density-scale, 1)) solid transparent;
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
			gap: calc(8px * var(--shell-density-scale, 1));
			padding: calc(24px * var(--shell-density-scale, 1));
			border-radius: calc(18px * var(--shell-density-scale, 1));
			background: color-mix(in srgb, var(--shell-control, rgba(255, 255, 255, 0.08)) 78%, transparent);
			border: 1px dashed var(--shell-control-border, rgba(255, 255, 255, 0.14));
		}

		.grid-view {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(calc(140px * var(--shell-density-scale, 1)), 1fr));
			gap: calc(14px * var(--shell-density-scale, 1));
		}

		.node-card,
		.node-row {
			display: grid;
			gap: calc(10px * var(--shell-density-scale, 1));
			text-align: left;
		}

		.node-card {
			padding: calc(14px * var(--shell-density-scale, 1));
			border-radius: calc(16px * var(--shell-density-scale, 1));
			min-height: calc(148px * var(--shell-density-scale, 1));
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
			min-height: calc(68px * var(--shell-density-scale, 1));
			border-radius: calc(14px * var(--shell-density-scale, 1));
			background: color-mix(in srgb, var(--shell-panel-strong, rgba(15, 23, 42, 0.82)) 34%, transparent);
			font-size: calc(32px * var(--shell-density-scale, 1));
			overflow: hidden;
		}

		.node-preview img {
			width: 100%;
			height: calc(68px * var(--shell-density-scale, 1));
			object-fit: cover;
			display: block;
		}

		.node-title {
			font-weight: 700;
			word-break: break-word;
		}

		.node-meta {
			font-size: calc(12.48px * var(--shell-density-scale, 1));
			color: var(--shell-muted-text, rgba(226, 232, 240, 0.82));
			word-break: break-word;
		}

		.list-view {
			display: grid;
			gap: calc(8px * var(--shell-density-scale, 1));
		}

		.list-header,
		.node-row {
			grid-template-columns: minmax(0, 1.6fr) minmax(calc(110px * var(--shell-density-scale, 1)), 0.9fr) minmax(calc(130px * var(--shell-density-scale, 1)), 0.9fr) minmax(calc(70px * var(--shell-density-scale, 1)), 0.55fr);
			align-items: center;
		}

		.list-header {
			display: grid;
			gap: calc(10px * var(--shell-density-scale, 1));
			padding: 0 calc(14px * var(--shell-density-scale, 1)) calc(8px * var(--shell-density-scale, 1));
			font-size: calc(12.48px * var(--shell-density-scale, 1));
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--shell-muted-text, rgba(226, 232, 240, 0.82));
		}

		.node-row {
			padding: calc(12px * var(--shell-density-scale, 1)) calc(14px * var(--shell-density-scale, 1));
			border-radius: calc(14px * var(--shell-density-scale, 1));
		}

		.node-row-name {
			display: flex;
			align-items: center;
			gap: calc(10px * var(--shell-density-scale, 1));
			min-width: 0;
		}

		.node-row-name span:last-child {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.row-thumbnail {
			width: calc(28px * var(--shell-density-scale, 1));
			height: calc(28px * var(--shell-density-scale, 1));
			border-radius: calc(8px * var(--shell-density-scale, 1));
			object-fit: cover;
			background: color-mix(in srgb, var(--shell-panel-strong, rgba(15, 23, 42, 0.82)) 34%, transparent);
		}

		.dialog-scrim {
			position: absolute;
			inset: 0;
			display: grid;
			place-items: center;
			padding: calc(20px * var(--shell-density-scale, 1));
			background: color-mix(in srgb, var(--shell-panel-strong, rgba(15, 23, 42, 0.82)) 52%, transparent);
			backdrop-filter: blur(8px);
		}

		.dialog {
			width: min(calc(420px * var(--shell-density-scale, 1)), 100%);
			display: grid;
			gap: calc(14px * var(--shell-density-scale, 1));
			padding: calc(18px * var(--shell-density-scale, 1));
			border-radius: calc(18px * var(--shell-density-scale, 1));
			background: color-mix(in srgb, var(--shell-panel-strong, rgba(15, 23, 42, 0.82)) 96%, white 4%);
			border: 1px solid var(--shell-control-border, rgba(255, 255, 255, 0.14));
			box-shadow: 0 calc(22px * var(--shell-density-scale, 1)) calc(60px * var(--shell-density-scale, 1)) var(--shell-shadow, rgba(15, 23, 42, 0.42));
		}

		.dialog p,
		.dialog h3 {
			margin: 0;
		}

		.dialog input,
		.dialog select {
			width: 100%;
			padding: calc(10px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
		}

		.dialog-actions {
			display: flex;
			justify-content: end;
			gap: calc(10px * var(--shell-density-scale, 1));
		}

		.dialog-actions button {
			padding: calc(9px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
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
