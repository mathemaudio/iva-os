import { html, type TemplateResult } from 'lit'
import { Spec } from '@shared/lll.lll'
import { AppShellView } from '../AppShellView.lll'
import { ShellWallpaperCatalog } from './ShellWallpaperCatalog.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'
import type { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

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
		return appDefinition.name
	}

	@Spec('Renders one app window body based on the current shell window state and shared VFS snapshot.')
	static renderWindowContent(
		windowEntry: {
			id: number
			appId: string
			openedNodeId: string | null
			sourceFolderId: string | null
		},
		activeTheme: string,
		activeWallpaper: string,
		vfsSnapshot: VirtualFileSystemContract['Snapshot'],
		virtualFileSystemService: VirtualFileSystemService,
		onThemeChange: (event: Event) => void,
		onWallpaperChange: (event: Event) => void,
		onOpenNode: (nodeId: string, currentFolderId: string) => void,
		onTitleChange: (windowId: number, title: string) => void,
		onFileNodeChange: (windowId: number, nodeId: string | null) => void
	): TemplateResult {
		if (windowEntry.appId === 'settings') {
			return AppShellView.renderSettingsContent(
				activeTheme,
				activeWallpaper,
				ShellWallpaperCatalog.getChoices(vfsSnapshot),
				onThemeChange,
				onWallpaperChange
			)
		}
		if (windowEntry.appId === 'file-manager') {
			return html`
				<iva-file-manager-view
					.virtualFileSystemService=${virtualFileSystemService}
					.requestedFolderId=${windowEntry.openedNodeId}
					.onOpenNode=${onOpenNode}
				></iva-file-manager-view>
			`
		}
		if (windowEntry.appId === 'text-editor') {
			return html`
				<iva-text-editor-view
					.virtualFileSystemService=${virtualFileSystemService}
					.snapshot=${vfsSnapshot}
					.fileNodeId=${windowEntry.openedNodeId}
					.defaultFolderId=${windowEntry.sourceFolderId}
					.onTitleChange=${(title: string) => onTitleChange(windowEntry.id, title)}
					.onFileNodeChange=${(nodeId: string | null) => onFileNodeChange(windowEntry.id, nodeId)}
				></iva-text-editor-view>
			`
		}
		if (windowEntry.appId === 'image-viewer') {
			return html`
				<iva-image-viewer-view
					.virtualFileSystemService=${virtualFileSystemService}
					.snapshot=${vfsSnapshot}
					.fileNodeId=${windowEntry.openedNodeId}
					.onTitleChange=${(title: string) => onTitleChange(windowEntry.id, title)}
				></iva-image-viewer-view>
			`
		}
		return html`
			<div class="settings-grid">
				<section class="settings-panel">
					<strong>Build surface</strong>
					<p>App Studio will grow into platform tooling in chunk 3.</p>
				</section>
			</div>
		`
	}
}
