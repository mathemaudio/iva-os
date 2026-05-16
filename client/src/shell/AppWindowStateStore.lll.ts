import { Spec } from '@shared/lll.lll'

@Spec('Persists and restores shell window layout state through one dedicated localStorage record.')
export class AppWindowStateStore {
	private static readonly storageKey = 'iva.window-state.v1'

	@Spec('Reads one persisted shell window-state snapshot when it is well-formed enough to restore.')
	public static readWindowState(): {
		isLauncherOpen: boolean
		nextWindowId: number
		windows: Array<{
			id: number
			appId: string
			left: number
			top: number
			width: number
			height: number
			isMinimized: boolean
			isMaximized: boolean
			zIndex: number
			openedNodeId: string | null
			sourceFolderId: string | null
			startedAt: string
		}>
	} | null {
		const storedValue = window.localStorage.getItem(this.storageKey)
		if (storedValue === null) {
			return null
		}
		try {
			const parsedValue: unknown = JSON.parse(storedValue)
			if (typeof parsedValue !== 'object' || parsedValue === null) {
				return null
			}
			const snapshot = parsedValue as Record<string, unknown>
			if (typeof snapshot.isLauncherOpen !== 'boolean' || typeof snapshot.nextWindowId !== 'number' || Array.isArray(snapshot.windows) === false) {
				return null
			}
			const windows = snapshot.windows.flatMap(windowEntry => {
				const normalizedWindow = this.readWindowEntry(windowEntry)
				return normalizedWindow === null ? [] : [normalizedWindow]
			})
			return {
				isLauncherOpen: snapshot.isLauncherOpen,
				nextWindowId: Number.isFinite(snapshot.nextWindowId) && snapshot.nextWindowId >= 1 ? snapshot.nextWindowId : 1,
				windows
			}
		} catch {
			return null
		}
	}

	@Spec('Persists one shell window-state snapshot into the dedicated localStorage record.')
	public static persistWindowState(snapshot: {
		isLauncherOpen: boolean
		nextWindowId: number
		windows: Array<{
			id: number
			appId: string
			title: string
			icon: string
			description: string
			left: number
			top: number
			width: number
			height: number
			isMinimized: boolean
			isMaximized: boolean
			zIndex: number
			openedNodeId: string | null
			sourceFolderId: string | null
			startedAt: string
		}>
	}): void {
		window.localStorage.setItem(this.storageKey, JSON.stringify({
			isLauncherOpen: snapshot.isLauncherOpen,
			nextWindowId: snapshot.nextWindowId,
			windows: snapshot.windows.map(windowEntry => ({
				id: windowEntry.id,
				appId: windowEntry.appId,
				left: windowEntry.left,
				top: windowEntry.top,
				width: windowEntry.width,
				height: windowEntry.height,
				isMinimized: windowEntry.isMinimized,
				isMaximized: windowEntry.isMaximized,
				zIndex: windowEntry.zIndex,
				openedNodeId: windowEntry.openedNodeId,
				sourceFolderId: windowEntry.sourceFolderId,
				startedAt: windowEntry.startedAt
			}))
		}))
	}

	@Spec('Reads one stored window entry when every persisted field has a restorable primitive shape.')
	private static readWindowEntry(candidate: unknown): {
		id: number
		appId: string
		left: number
		top: number
		width: number
		height: number
		isMinimized: boolean
		isMaximized: boolean
		zIndex: number
		openedNodeId: string | null
		sourceFolderId: string | null
		startedAt: string
	} | null {
		if (typeof candidate !== 'object' || candidate === null) {
			return null
		}
		const windowEntry = candidate as Record<string, unknown>
		if (
			typeof windowEntry.id !== 'number'
			|| typeof windowEntry.appId !== 'string'
			|| typeof windowEntry.left !== 'number'
			|| typeof windowEntry.top !== 'number'
			|| typeof windowEntry.width !== 'number'
			|| typeof windowEntry.height !== 'number'
			|| typeof windowEntry.isMinimized !== 'boolean'
			|| typeof windowEntry.isMaximized !== 'boolean'
			|| typeof windowEntry.zIndex !== 'number'
			|| (typeof windowEntry.openedNodeId !== 'string' && windowEntry.openedNodeId !== null)
			|| (typeof windowEntry.sourceFolderId !== 'string' && windowEntry.sourceFolderId !== null)
			|| typeof windowEntry.startedAt !== 'string'
		) {
			return null
		}
		return {
			id: windowEntry.id,
			appId: windowEntry.appId,
			left: windowEntry.left,
			top: windowEntry.top,
			width: windowEntry.width,
			height: windowEntry.height,
			isMinimized: windowEntry.isMinimized,
			isMaximized: windowEntry.isMaximized,
			zIndex: windowEntry.zIndex,
			openedNodeId: windowEntry.openedNodeId,
			sourceFolderId: windowEntry.sourceFolderId,
			startedAt: windowEntry.startedAt
		}
	}
}
