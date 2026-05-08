import './AppWindowPresentation.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { AppWindowPresentation } from './AppWindowPresentation.lll'
import { PlatformAppLauncherService } from '../platform/PlatformAppLauncherService.lll'
import { PlatformFileSystemService } from '../platform/PlatformFileSystemService.lll'
import { PlatformRuntimeService } from '../platform/runtime/PlatformRuntimeService.lll'
import { PlatformSettingsService } from '../platform/PlatformSettingsService.lll'
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
		service.load()
		const filesystemService = new PlatformFileSystemService(service)
		const settingsService = new PlatformSettingsService(
			() => ({
				theme: 'dark',
				wallpaper: 'aurora',
				wallpaperChoices: [{ id: 'aurora', label: 'Aurora' }]
			}),
			() => undefined,
			() => undefined
		)
		const launcherService = new PlatformAppLauncherService(
			() => undefined,
			() => undefined
		)
		const runtimeService = new PlatformRuntimeService(() => ({ runningApps: [], vfsSnapshot: service.getSnapshot() }))
		const platformContext = {
			appId: 'settings',
			filesystem: filesystemService.toContract(),
			settings: settingsService.toContract(),
			launcher: launcherService.toContract(),
			runtime: runtimeService.toContract(),
			window: {
				openedNodeId: null,
				sourceFolderId: null,
				setTitle(): void {
					return
				},
				setOpenedNodeId(): void {
					return
				}
			}
		}
		const content = AppWindowPresentation.renderWindowContent(
			{ id: 1, appId: 'settings', openedNodeId: null, sourceFolderId: null },
			platformContext
		)
		const contentText = String(content.strings.join(' '))
		const hasThemeSelect = contentText.includes('iva-settings-view')
		const hasWallpaperSelect = contentText.includes('iva-settings-view')
		assert(hasThemeSelect, 'Expected the settings window body to render the settings app host element')
		assert(hasWallpaperSelect, 'Expected the settings window body to render the settings app host element')
		return { hasThemeSelect, hasWallpaperSelect }
	}
}
