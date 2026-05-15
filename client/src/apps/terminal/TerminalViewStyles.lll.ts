import { Spec } from '@shared/lll.lll'
import { css } from 'lit';


@Spec("Provides shared styles for the browser-hosted Terminal app.")
export class TerminalViewStyles {
	public static styles = css`
			:host {
				display: block;
				height: 100%;
				color: rgb(225, 248, 231);
				background: radial-gradient(circle at top, rgba(21, 45, 33, 0.96) 0%, rgba(7, 13, 10, 1) 72%);
				font-family: 'SFMono-Regular', 'Cascadia Code', 'Fira Code', 'Consolas', 'Menlo', monospace;
			}
	
			:host-context(.shell[data-theme='light']) {
				color: rgb(25, 58, 36);
				background: linear-gradient(180deg, rgba(244, 251, 246, 0.99) 0%, rgba(227, 238, 230, 0.98) 100%);
			}
	
			.terminal {
				display: grid;
				grid-template-rows: 1fr auto;
				height: 100%;
				min-height: 0;
			}
	
			.output {
				overflow: auto;
				padding: calc(18px * var(--shell-density-scale, 1));
				white-space: pre-wrap;
				word-break: break-word;
				line-height: 1.55;
				font-size: calc(13.5px * var(--shell-density-scale, 1));
			}
	
			.output-line {
				margin: 0 0 calc(10px * var(--shell-density-scale, 1));
			}
	
			.output-line[data-kind='command'] {
				color: rgb(159, 251, 181);
			}
	
			:host-context(.shell[data-theme='light']) .output-line[data-kind='command'] {
				color: rgb(30, 120, 58);
			}
	
			.output-line[data-kind='error'] {
				color: rgb(252, 167, 167);
			}
	
			.prompt-row {
				display: grid;
				grid-template-columns: auto 1fr auto;
				align-items: center;
				gap: calc(12px * var(--shell-density-scale, 1));
				padding: calc(14px * var(--shell-density-scale, 1)) calc(18px * var(--shell-density-scale, 1));
				border-top: 1px solid rgba(255, 255, 255, 0.12);
				background: rgba(0, 0, 0, 0.18);
			}
	
			:host-context(.shell[data-theme='light']) .prompt-row {
				background: rgba(255, 255, 255, 0.54);
				border-top-color: rgba(85, 111, 94, 0.18);
			}
	
			.prompt-label,
			.prompt-hint {
				font-size: calc(12.5px * var(--shell-density-scale, 1));
			}
	
			.input {
				width: 100%;
				min-width: 0;
				padding: calc(10px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1));
				border-radius: calc(10px * var(--shell-density-scale, 1));
				border: 1px solid rgba(255, 255, 255, 0.14);
				background: rgba(0, 0, 0, 0.24);
				color: inherit;
				font: inherit;
			}
	
			:host-context(.shell[data-theme='light']) .input {
				background: rgba(255, 255, 255, 0.82);
				border-color: rgba(85, 111, 94, 0.2);
			}
		`

}
