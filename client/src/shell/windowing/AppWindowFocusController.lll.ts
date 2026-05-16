import { Spec } from '@shared/lll.lll'
import type { App } from '../../App.lll'

@Spec("Manages shell window focus restoration and z-order updates against the live App state.")
export class AppWindowFocusController {
	public constructor(private readonly source: App) {
	}

	@Spec('Focuses a window and brings it to the front of the z-order.')
	public focusWindow(windowId: number): void {
			const currentFocusedWindowId = this.source.getFocusedWindowId()
			const targetWindow = this.source.windows.find(windowEntry => windowEntry.id === windowId) ?? null
			if (targetWindow === null) {
				return
			}
			if (currentFocusedWindowId === windowId && targetWindow.isMinimized === false) {
				return
			}
			const zIndex = this.source.getNextZIndex()
			this.source.windows = this.source.windows.map(windowEntry => {
				if (windowEntry.id !== windowId) {
					return windowEntry
				}
				return {
					...windowEntry,
					isMinimized: false,
					zIndex
				}
			})
			this.source.platformRuntimeService.recordEvent('internal', 'window', 'Focused window', `${targetWindow.title} moved to the front.`)
			this.source.persistWindowState()
		}


	@Spec('Restores a minimized window and focuses it.')
	public restoreAndFocusWindow(windowId: number): void {
			const targetWindow = this.source.windows.find(windowEntry => windowEntry.id === windowId) ?? null
			if (targetWindow === null) {
				return
			}
			if (targetWindow.isMinimized === false && this.source.getFocusedWindowId() === windowId) {
				return
			}
			const zIndex = this.source.getNextZIndex()
			this.source.windows = this.source.windows.map(windowEntry => {
				if (windowEntry.id !== windowId) {
					return windowEntry
				}
				return {
					...windowEntry,
					isMinimized: false,
					zIndex
				}
			})
			this.source.platformRuntimeService.recordEvent('incoming', 'window', 'Restored window', `${targetWindow.title} returned from the dock.`)
			this.source.persistWindowState()
		}

}
