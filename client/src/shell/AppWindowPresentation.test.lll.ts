import './AppWindowPresentation.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { AppWindowPresentation } from './AppWindowPresentation.lll'
import { VirtualFileSystemService } from '../vfs/VirtualFileSystemService.lll'

@Spec('Covers shell window titles and app-window body rendering helpers.')
export class AppWindowPresentationTest {
	testType = 'unit'

	@Scenario('builds window titles from app metadata and opened VFS nodes')
	static async buildsWindowTitles(scenario: ScenarioParameter): Promise<{ fileManagerTitle: string, textEditorTitle: string, fallbackTitle: string }> {
		const assert: AssertFn = scenario.assert
		const service = new VirtualFileSystemService(null)
		const snapshot = service.load()
		const availableApps = [
			{ id: 'file-manager', name: 'File Manager' },
			{ id: 'text-editor', name: 'Text Editor' },
			{ id: 'image-viewer', name: 'Image Viewer' }
		]
		const documentsFolder = service.resolvePath('/Documents')
		const readmeFile = service.resolvePath('/Documents/README.txt')
		assert(documentsFolder !== null && documentsFolder.kind === 'folder', 'Expected Documents to exist before title rendering tests')
		assert(readmeFile !== null && readmeFile.kind === 'file', 'Expected README.txt to exist before title rendering tests')
		const fileManagerTitle = AppWindowPresentation.buildWindowTitle(availableApps, snapshot, 'file-manager', documentsFolder.id)
		const textEditorTitle = AppWindowPresentation.buildWindowTitle(availableApps, snapshot, 'text-editor', readmeFile.id)
		const fallbackTitle = AppWindowPresentation.buildWindowTitle(availableApps, snapshot, 'image-viewer', null)
		assert(fileManagerTitle === 'Documents — File Manager', 'Expected folder-backed File Manager windows to use the folder name in their title')
		assert(textEditorTitle === 'README.txt', 'Expected file-backed Text Editor windows to use the file name in their title')
		assert(fallbackTitle === 'Image Viewer', 'Expected windows without an opened file to fall back to the app name')
		return { fileManagerTitle, textEditorTitle, fallbackTitle }
	}

	@Scenario('renders the settings app body with theme and wallpaper controls')
	static async rendersSettingsWindowContent(scenario: ScenarioParameter): Promise<{ hasThemeSelect: boolean, hasWallpaperSelect: boolean }> {
		const assert: AssertFn = scenario.assert
		const service = new VirtualFileSystemService(null)
		const snapshot = service.load()
		const content = AppWindowPresentation.renderWindowContent(
			{ id: 1, appId: 'settings', openedNodeId: null, sourceFolderId: null },
			'dark',
			'aurora',
			snapshot,
			service,
			() => undefined,
			() => undefined,
			() => undefined,
			() => undefined,
			() => undefined
		)
		const contentText = String(content.strings.join(' '))
		const hasThemeSelect = contentText.includes('theme-select')
		const hasWallpaperSelect = contentText.includes('wallpaper-select')
		assert(hasThemeSelect, 'Expected the settings window body to include the theme select marker')
		assert(hasWallpaperSelect, 'Expected the settings window body to include the wallpaper select marker')
		return { hasThemeSelect, hasWallpaperSelect }
	}
}
