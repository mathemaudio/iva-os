import { Spec } from '@shared/lll.lll'

@Spec('Encapsulates shell app metadata and default window sizing rules for the App host.')
export class AppWindowCatalog {

	public readonly availableApps: Array<{
			id: string
			name: string
			icon: string
			description: string
			isPinnedToDock: boolean
		}> = [
			{ id: 'file-manager', name: 'File Manager', icon: '🗂️', description: 'Browse the shared virtual filesystem.', isPinnedToDock: true },
			{ id: 'text-editor', name: 'Text Editor', icon: '📝', description: 'Create and edit text files from the shared VFS.', isPinnedToDock: true },
			{ id: 'image-viewer', name: 'Image Viewer', icon: '🖼️', description: 'Open image files from the shared VFS.', isPinnedToDock: false },
			{ id: 'activity-monitor', name: 'Activity Monitor', icon: '📈', description: 'Inspect running apps, signals, and runtime memory usage.', isPinnedToDock: true },
			{ id: 'settings', name: 'Settings', icon: '⚙️', description: 'Adjust theme and wallpaper preferences.', isPinnedToDock: true },
			{ id: 'app-studio', name: 'App Studio', icon: '🧪', description: 'Build apps soon.', isPinnedToDock: false }
		]


	@Spec('Returns the default height for one app window type.')
	public getWindowHeight(appId: string): number {
			if (appId === 'settings') {
				return 430
			}
			if (appId === 'activity-monitor') {
				return 540
			}
			if (appId === 'file-manager') {
				return 520
			}
			if (appId === 'text-editor' || appId === 'image-viewer') {
				return 520
			}
			return 320
		}


	@Spec('Returns the default width for one app window type.')
	public getWindowWidth(appId: string): number {
			if (appId === 'settings') {
				return 520
			}
			if (appId === 'activity-monitor') {
				return 760
			}
			if (appId === 'file-manager') {
				return 760
			}
			if (appId === 'text-editor') {
				return 720
			}
			if (appId === 'image-viewer') {
				return 700
			}
			return 400
		}

}
