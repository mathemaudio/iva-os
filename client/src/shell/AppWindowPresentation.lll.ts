import { html, type TemplateResult } from 'lit'
import { Spec } from '@shared/lll.lll'
import type { PlatformContract } from '../platform/PlatformContract.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Encapsulates shell window title and window-body rendering logic for the App host.')
export class AppWindowPresentation {
	@Spec('Builds the current shell window title from app identity and any opened VFS node when available.')
	static buildWindowTitle(
		availableApps: Array<{ id: string, name: string }>,
		vfsSnapshot: VirtualFileSystemContract['Snapshot'],
		appId: string,
		openedNodeId: string | null
	): string {
		const appDefinition = availableApps.find(candidate => candidate.id === appId)
		if (appDefinition === undefined) {
			return 'IvaOS'
		}
		if (appId === 'file-manager') {
			const folderNode = openedNodeId === null ? null : vfsSnapshot.schema.nodesById[openedNodeId] ?? null
			if (folderNode?.kind === 'folder') {
				return `${folderNode.name === '' ? 'Home' : folderNode.name} — File Manager`
			}
			return 'Home — File Manager'
		}
		if ((appId === 'text-editor' || appId === 'image-viewer') && openedNodeId !== null) {
			const fileNode = vfsSnapshot.schema.nodesById[openedNodeId] ?? null
			return fileNode?.kind === 'file' ? fileNode.name : appDefinition.name
		}
		if (appId === 'activity-monitor') {
			return 'Activity Monitor'
		}
		if (appId === 'terminal') {
			return 'Terminal'
		}
		return appDefinition.name
	}

	@Spec('Renders one app window body based on the current shell window state and platform application context.')
	static renderWindowContent(
		windowEntry: {
			id: number
			appId: string
			openedNodeId: string | null
			sourceFolderId: string | null
		},
		platformContext: PlatformContract['ApplicationContext']
	): TemplateResult {
		if (windowEntry.appId === 'settings') {
			return html`<iva-settings-view .platformContext=${platformContext}></iva-settings-view>`
		}
		if (windowEntry.appId === 'file-manager') {
			return html`<iva-file-manager-view .platformContext=${platformContext}></iva-file-manager-view>`
		}
		if (windowEntry.appId === 'text-editor') {
			return html`<iva-text-editor-view .platformContext=${platformContext}></iva-text-editor-view>`
		}
		if (windowEntry.appId === 'image-viewer') {
			return html`<iva-image-viewer-view .platformContext=${platformContext}></iva-image-viewer-view>`
		}
		if (windowEntry.appId === 'activity-monitor') {
			return html`<iva-activity-monitor-view .platformContext=${platformContext}></iva-activity-monitor-view>`
		}
		if (windowEntry.appId === 'terminal') {
			return html`<iva-terminal-view .platformContext=${platformContext}></iva-terminal-view>`
		}
		return html`
			<div class="settings-grid">
				<section class="settings-panel">
					<strong>Build surface</strong>
					<p>App Studio now targets the platform application context.</p>
					<p>Future tooling can use the same stable contracts for files, settings, and app launching.</p>
				</section>
			</div>
		`
	}
}
