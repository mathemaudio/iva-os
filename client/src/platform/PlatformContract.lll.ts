import { Spec } from '@shared/lll.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

Spec('Defines stable client-side platform contracts for app-facing filesystem, settings, launcher, window session, and runtime monitoring capabilities.')
export type PlatformContract = {
	FileSystemService: {
		getSnapshot: () => VirtualFileSystemContract['Snapshot']
		subscribe: (listener: (snapshot: VirtualFileSystemContract['Snapshot']) => void) => () => void
		getNode: (nodeId: string) => VirtualFileSystemContract['Node'] | null
		resolvePath: (path: string) => VirtualFileSystemContract['Node'] | null
		createFolder: (parentId: string, name: string) => VirtualFileSystemContract['Node']
		createTextFile: (parentId: string, name: string, initialContent: string) => VirtualFileSystemContract['Node']
		createBinaryFile: (parentId: string, name: string, mimeType: string, dataUrl: string, thumbnailDataUrl?: string) => VirtualFileSystemContract['Node']
		writeTextFile: (fileId: string, content: string) => VirtualFileSystemContract['Node']
		readTextFile: (fileId: string) => string | null
		readBinaryFile: (fileId: string) => string | null
		renameNode: (nodeId: string, newName: string) => VirtualFileSystemContract['Node']
		moveNode: (nodeId: string, nextParentId: string) => VirtualFileSystemContract['Node']
		deleteNode: (nodeId: string) => void
	}
	SettingsSnapshot: {
		theme: string
		wallpaper: string
		wallpaperChoices: Array<{ id: string, label: string }>
	}
	SettingsService: {
		getSnapshot: () => PlatformContract['SettingsSnapshot']
		subscribe: (listener: (snapshot: PlatformContract['SettingsSnapshot']) => void) => () => void
		setTheme: (theme: string) => void
		setWallpaper: (wallpaperId: string) => void
	}
	WindowSession: {
		openedNodeId: string | null
		sourceFolderId: string | null
		setTitle: (title: string) => void
		setOpenedNodeId: (nodeId: string | null) => void
	}
	LauncherService: {
		openNode: (nodeId: string, currentFolderId: string | null) => void
		openApp: (appId: string, openedNodeId: string | null, sourceFolderId: string | null) => void
	}
	RuntimeRunningApp: {
		windowId: number
		appId: string
		appName: string
		title: string
		icon: string
		isFocused: boolean
		isMinimized: boolean
		startedAt: string
		runningForMs: number
	}
	RuntimeEvent: {
		id: number
		timestamp: string
		direction: 'incoming' | 'outgoing' | 'internal'
		category: 'launcher' | 'window' | 'filesystem' | 'settings' | 'runtime'
		title: string
		detail: string
	}
	RuntimeStats: {
		memoryUsedBytes: number | null
		memoryLimitBytes: number | null
		windowCount: number
		runningAppCount: number
		visibleWindowCount: number
		minimizedWindowCount: number
		vfsNodeCount: number
		vfsFileCount: number
		vfsFolderCount: number
		vfsStoredBytes: number
		localStorageBytes: number | null
		uptimeMs: number
	}
	RuntimeSnapshot: {
		sessionStartedAt: string
		runningApps: PlatformContract['RuntimeRunningApp'][]
		events: PlatformContract['RuntimeEvent'][]
		stats: PlatformContract['RuntimeStats']
	}
	RuntimeService: {
		getSnapshot: () => PlatformContract['RuntimeSnapshot']
		subscribe: (listener: (snapshot: PlatformContract['RuntimeSnapshot']) => void) => () => void
	}
	ApplicationContext: {
		appId: string
		filesystem: PlatformContract['FileSystemService']
		settings: PlatformContract['SettingsService']
		launcher: PlatformContract['LauncherService']
		runtime: PlatformContract['RuntimeService']
		window: PlatformContract['WindowSession']
	}
}
