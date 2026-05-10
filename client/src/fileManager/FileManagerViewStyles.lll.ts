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
			background: linear-gradient(180deg, rgba(14, 19, 30, 0.88) 0%, rgba(9, 14, 23, 0.96) 100%);
		}

		:host-context(.shell[data-theme='light']) .file-manager {
			background: linear-gradient(180deg, rgba(247, 250, 255, 0.96) 0%, rgba(233, 239, 248, 0.98) 100%);
		}

		.sidebar {
			display: grid;
			grid-template-rows: auto minmax(0, 1fr);
			gap: calc(12px * var(--shell-density-scale, 1));
			padding: calc(18px * var(--shell-density-scale, 1)) calc(14px * var(--shell-density-scale, 1));
			background: linear-gradient(180deg, rgba(22, 29, 42, 0.9) 0%, rgba(15, 20, 31, 0.92) 100%);
			border-right: 1px solid rgba(255, 255, 255, 0.08);
		}

		:host-context(.shell[data-theme='light']) .sidebar {
			background: linear-gradient(180deg, rgba(234, 239, 247, 0.98) 0%, rgba(225, 231, 241, 0.98) 100%);
			border-right-color: rgba(126, 141, 172, 0.18);
		}

		.sidebar h3,
		.main h3,
		.main p {
			margin: 0;
		}

		.sidebar h3 {
			font-size: calc(12px * var(--shell-density-scale, 1));
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: var(--shell-muted-text, rgba(226, 232, 240, 0.82));
			padding: 0 calc(10px * var(--shell-density-scale, 1));
		}

		.sidebar-list {
			display: grid;
			align-content: start;
			gap: calc(4px * var(--shell-density-scale, 1));
			overflow: auto;
			padding-right: calc(2px * var(--shell-density-scale, 1));
		}

		.sidebar-list,
		.content-region {
			scrollbar-color: var(--file-manager-scrollbar-thumb) var(--file-manager-scrollbar-track);
			scrollbar-width: thin;
		}

		.sidebar-list::-webkit-scrollbar,
		.content-region::-webkit-scrollbar {
			width: calc(12px * var(--shell-density-scale, 1));
			height: calc(12px * var(--shell-density-scale, 1));
		}

		.sidebar-list::-webkit-scrollbar-track,
		.content-region::-webkit-scrollbar-track {
			background: var(--file-manager-scrollbar-track);
			border-radius: 999px;
		}

		.sidebar-list::-webkit-scrollbar-thumb,
		.content-region::-webkit-scrollbar-thumb {
			background-color: var(--file-manager-scrollbar-thumb);
			border-radius: 999px;
			border: calc(3px * var(--shell-density-scale, 1)) solid transparent;
			background-clip: content-box;
		}

		.sidebar-list::-webkit-scrollbar-thumb:hover,
		.content-region::-webkit-scrollbar-thumb:hover {
			background-color: var(--file-manager-scrollbar-thumb-hover);
		}

		.sidebar-list::-webkit-scrollbar-corner,
		.content-region::-webkit-scrollbar-corner {
			background: var(--file-manager-scrollbar-corner);
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
			border-radius: calc(10px * var(--shell-density-scale, 1));
		}

		.sidebar-button {
			display: flex;
			align-items: center;
			gap: calc(10px * var(--shell-density-scale, 1));
			padding: calc(9px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			text-align: left;
			background: transparent;
			border-color: transparent;
		}

		.sidebar-button::before {
			content: '•';
			font-size: calc(18px * var(--shell-density-scale, 1));
			line-height: 1;
			color: rgba(255, 255, 255, 0.24);
		}

		:host-context(.shell[data-theme='light']) .sidebar-button::before {
			color: rgba(58, 71, 97, 0.26);
		}

		.sidebar-button[data-active='true'] {
			background: linear-gradient(180deg, rgba(95, 143, 248, 0.22) 0%, rgba(67, 111, 213, 0.28) 100%);
			border-color: rgba(120, 160, 255, 0.44);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
		}

		.sidebar-button[data-active='true']::before {
			color: rgba(214, 228, 255, 0.92);
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
			gap: calc(8px * var(--shell-density-scale, 1));
			padding: calc(12px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1));
			background: linear-gradient(180deg, rgba(35, 41, 58, 0.86) 0%, rgba(19, 24, 36, 0.9) 100%);
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		}

		:host-context(.shell[data-theme='light']) .toolbar {
			background: linear-gradient(180deg, rgba(241, 245, 252, 0.98) 0%, rgba(230, 236, 246, 0.96) 100%);
			border-bottom-color: rgba(125, 139, 170, 0.18);
		}

		.toolbar button {
			padding: calc(8px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			background: linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.06) 100%);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
		}

		:host-context(.shell[data-theme='light']) .toolbar button {
			background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(233, 238, 246, 0.96) 100%);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
		}

		.toolbar button:disabled {
			opacity: 0.55;
			cursor: not-allowed;
		}

		.location-bar {
			display: grid;
			gap: calc(8px * var(--shell-density-scale, 1));
			padding: calc(14px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1)) 0;
		}

		.current-folder {
			font-size: calc(22px * var(--shell-density-scale, 1));
			font-weight: 700;
			letter-spacing: -0.02em;
		}

		.breadcrumbs {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: calc(6px * var(--shell-density-scale, 1));
		}

		.breadcrumb-button {
			padding: calc(5px * var(--shell-density-scale, 1)) calc(10px * var(--shell-density-scale, 1));
			background: color-mix(in srgb, var(--shell-control) 84%, transparent);
		}

		.status-stack {
			display: grid;
			gap: calc(10px * var(--shell-density-scale, 1));
			padding: calc(12px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1)) 0;
		}

		.status-pill,
		.error-pill {
			padding: calc(10px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			border-radius: calc(10px * var(--shell-density-scale, 1));
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
			padding: calc(14px * var(--shell-density-scale, 1)) calc(16px * var(--shell-density-scale, 1)) calc(18px * var(--shell-density-scale, 1));
			min-height: 0;
			overflow: auto;
		}

		.empty-state {
			display: grid;
			justify-items: start;
			gap: calc(8px * var(--shell-density-scale, 1));
			padding: calc(28px * var(--shell-density-scale, 1));
			border-radius: calc(14px * var(--shell-density-scale, 1));
			background: color-mix(in srgb, var(--shell-control) 74%, transparent);
			border: 1px dashed var(--shell-control-border, rgba(255, 255, 255, 0.14));
		}

		.grid-view {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(calc(160px * var(--shell-density-scale, 1)), 1fr));
			gap: calc(16px * var(--shell-density-scale, 1));
		}

		.node-card,
		.node-row {
			display: grid;
			gap: calc(10px * var(--shell-density-scale, 1));
			text-align: left;
		}

		.node-card {
			padding: calc(12px * var(--shell-density-scale, 1));
			border-radius: calc(14px * var(--shell-density-scale, 1));
			min-height: calc(164px * var(--shell-density-scale, 1));
			align-content: start;
			background: linear-gradient(180deg, rgba(37, 45, 60, 0.54) 0%, rgba(20, 27, 40, 0.68) 100%);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
		}

		:host-context(.shell[data-theme='light']) .node-card {
			background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(239, 244, 250, 0.96) 100%);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
		}

		.node-card[data-selected='true'],
		.node-row[data-selected='true'] {
			background: color-mix(in srgb, var(--shell-selection) 88%, var(--shell-control));
			border-color: var(--shell-selection-border, rgba(56, 189, 248, 0.4));
		}

		.node-card[data-focused='true'],
		.node-row[data-focused='true'] {
			outline: 2px solid rgba(125, 211, 252, 0.65);
			outline-offset: 1px;
		}

		.node-preview {
			display: grid;
			place-items: center;
			min-height: calc(84px * var(--shell-density-scale, 1));
			border-radius: calc(12px * var(--shell-density-scale, 1));
			background: linear-gradient(180deg, rgba(12, 18, 29, 0.72) 0%, rgba(26, 34, 47, 0.62) 100%);
			font-size: calc(34px * var(--shell-density-scale, 1));
			overflow: hidden;
		}

		:host-context(.shell[data-theme='light']) .node-preview {
			background: linear-gradient(180deg, rgba(228, 235, 246, 0.98) 0%, rgba(212, 221, 236, 0.98) 100%);
		}

		.node-preview img {
			width: 100%;
			height: calc(84px * var(--shell-density-scale, 1));
			object-fit: cover;
			display: block;
		}

		.node-title {
			font-weight: 700;
			font-size: calc(14px * var(--shell-density-scale, 1));
			line-height: 1.2;
			word-break: break-word;
		}

		.node-meta {
			font-size: calc(12px * var(--shell-density-scale, 1));
			color: var(--shell-muted-text, rgba(226, 232, 240, 0.82));
			word-break: break-word;
		}

		.list-view {
			display: grid;
			gap: calc(4px * var(--shell-density-scale, 1));
			padding: calc(6px * var(--shell-density-scale, 1));
			border-radius: calc(12px * var(--shell-density-scale, 1));
			background: color-mix(in srgb, var(--shell-control) 52%, transparent);
			border: 1px solid rgba(255, 255, 255, 0.08);
		}

		.list-header,
		.node-row {
			grid-template-columns: minmax(0, 1.7fr) minmax(calc(110px * var(--shell-density-scale, 1)), 0.9fr) minmax(calc(130px * var(--shell-density-scale, 1)), 0.9fr) minmax(calc(80px * var(--shell-density-scale, 1)), 0.55fr);
			align-items: center;
		}

		.list-header {
			display: grid;
			gap: calc(10px * var(--shell-density-scale, 1));
			padding: calc(8px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			font-size: calc(11px * var(--shell-density-scale, 1));
			text-transform: uppercase;
			letter-spacing: 0.08em;
			color: var(--shell-muted-text, rgba(226, 232, 240, 0.82));
		}

		.node-row {
			padding: calc(10px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
			border-radius: calc(10px * var(--shell-density-scale, 1));
			background: transparent;
			border-color: transparent;
		}

		.node-row:hover {
			background: color-mix(in srgb, var(--shell-control) 64%, transparent);
			border-color: rgba(255, 255, 255, 0.06);
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
			width: calc(30px * var(--shell-density-scale, 1));
			height: calc(30px * var(--shell-density-scale, 1));
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
			background: color-mix(in srgb, var(--shell-panel-strong, rgba(15, 23, 42, 0.82)) 58%, transparent);
			backdrop-filter: blur(8px);
		}

		.dialog {
			width: min(calc(420px * var(--shell-density-scale, 1)), 100%);
			display: grid;
			gap: calc(14px * var(--shell-density-scale, 1));
			padding: calc(18px * var(--shell-density-scale, 1));
			border-radius: calc(14px * var(--shell-density-scale, 1));
			background: linear-gradient(180deg, rgba(35, 41, 58, 0.96) 0%, rgba(17, 22, 33, 0.98) 100%);
			border: 1px solid var(--shell-control-border, rgba(255, 255, 255, 0.14));
			box-shadow: 0 calc(22px * var(--shell-density-scale, 1)) calc(60px * var(--shell-density-scale, 1)) var(--shell-shadow, rgba(15, 23, 42, 0.42));
		}

		:host-context(.shell[data-theme='light']) .dialog {
			background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(238, 243, 250, 0.98) 100%);
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
