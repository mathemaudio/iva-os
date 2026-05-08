import { Spec } from '@shared/lll.lll'
import type { PlatformContract } from '../PlatformContract.lll'
import type { VirtualFileSystemContract } from '../../vfs/VirtualFileSystemContract.lll'

@Spec('Provides app-facing runtime monitoring snapshots and a capped event stream for the Activity Monitor app.')
export class PlatformRuntimeService {
	private readonly listeners = new Set<(snapshot: PlatformContract['RuntimeSnapshot']) => void>()
	private readonly sessionStartedAt: string = new Date().toISOString()
	private readonly events: PlatformContract['RuntimeEvent'][] = []
	private nextEventId: number = 1

	public constructor(
		private readonly readRuntimeState: () => {
			runningApps: PlatformContract['RuntimeRunningApp'][]
			vfsSnapshot: VirtualFileSystemContract['Snapshot']
		}
	) {
		Spec('Wraps shell-managed runtime state behind a stable snapshot and subscription interface for monitor-style apps.')
	}

	@Spec('Returns one fresh runtime-monitor snapshot including running apps, recent events, and browser-visible runtime stats.')
	public getSnapshot(): PlatformContract['RuntimeSnapshot'] {
		const runtimeState = this.readRuntimeState()
		const memoryStats = this.readMemoryStats()
		const nowMs = Date.now()
		const runningApps = runtimeState.runningApps.map(app => ({
			...app,
			runningForMs: Math.max(nowMs - new Date(app.startedAt).getTime(), 0)
		}))
		return {
			sessionStartedAt: this.sessionStartedAt,
			runningApps,
			events: [...this.events],
			stats: this.buildRuntimeStats(runtimeState.vfsSnapshot, runningApps, memoryStats.usedBytes, memoryStats.limitBytes)
		}
	}

	@Spec('Subscribes one listener to future runtime-monitor snapshot changes and returns an unsubscribe callback.')
	public subscribe(listener: (snapshot: PlatformContract['RuntimeSnapshot']) => void): () => void {
		this.listeners.add(listener)
		return () => {
			this.listeners.delete(listener)
		}
	}

	@Spec('Records one runtime event with a capped history and notifies monitor subscribers about the updated snapshot.')
	public recordEvent(
		direction: PlatformContract['RuntimeEvent']['direction'],
		category: PlatformContract['RuntimeEvent']['category'],
		title: string,
		detail: string
	): void {
		this.events.unshift({
			id: this.nextEventId,
			timestamp: new Date().toISOString(),
			direction,
			category,
			title,
			detail
		})
		this.nextEventId += 1
		if (this.events.length > 80) {
			this.events.length = 80
		}
		this.emitChange()
	}

	@Spec('Notifies all runtime-monitor subscribers that one shell state change should refresh their current snapshot.')
	public emitChange(): void {
		const snapshot = this.getSnapshot()
		for (const listener of this.listeners) {
			listener(snapshot)
		}
	}

	@Spec('Returns this wrapper as the stable app-facing runtime-service contract shape.')
	public toContract(): PlatformContract['RuntimeService'] {
		return this
	}

	@Spec('Builds one runtime-stats record from the current shell state, browser memory visibility, and persisted VFS footprint.')
	private buildRuntimeStats(
		vfsSnapshot: VirtualFileSystemContract['Snapshot'],
		runningApps: PlatformContract['RuntimeRunningApp'][],
		memoryUsedBytes: number | null,
		memoryLimitBytes: number | null
	): PlatformContract['RuntimeStats'] {
		const nodes = Object.values(vfsSnapshot.schema.nodesById)
		const fileNodes = nodes.filter(node => node.kind === 'file')
		const folderNodes = nodes.filter(node => node.kind === 'folder')
		const visibleWindowCount = runningApps.filter(app => app.isMinimized === false).length
		return {
			memoryUsedBytes,
			memoryLimitBytes,
			windowCount: runningApps.length,
			runningAppCount: runningApps.length,
			visibleWindowCount,
			minimizedWindowCount: runningApps.length - visibleWindowCount,
			vfsNodeCount: nodes.length,
			vfsFileCount: fileNodes.length,
			vfsFolderCount: folderNodes.length,
			vfsStoredBytes: fileNodes.reduce((total, node) => total + node.size, 0),
			localStorageBytes: this.readLocalStorageBytes(),
			uptimeMs: Math.max(Date.now() - new Date(this.sessionStartedAt).getTime(), 0)
		}
	}

	@Spec('Reads browser memory figures when the current engine exposes them and otherwise reports them as unavailable.')
	private readMemoryStats(): { usedBytes: number | null, limitBytes: number | null } {
		const performanceCandidate = globalThis.performance as Performance & {
			memory?: {
				usedJSHeapSize?: number
				jsHeapSizeLimit?: number
			}
		}
		const memory = performanceCandidate.memory
		if (typeof memory?.usedJSHeapSize !== 'number') {
			return { usedBytes: null, limitBytes: null }
		}
		return {
			usedBytes: memory.usedJSHeapSize,
			limitBytes: typeof memory.jsHeapSizeLimit === 'number' ? memory.jsHeapSizeLimit : null
		}
	}

	@Spec('Estimates the total localStorage key-plus-value footprint when that browser API is available to the current runtime.')
	private readLocalStorageBytes(): number | null {
		if ('localStorage' in globalThis === false) {
			return null
		}
		try {
			let totalBytes = 0
			for (let index = 0; index < globalThis.localStorage.length; index += 1) {
				const key = globalThis.localStorage.key(index)
				if (typeof key !== 'string') {
					continue
				}
				const value = globalThis.localStorage.getItem(key) ?? ''
				totalBytes += this.measureTextBytes(key)
				totalBytes += this.measureTextBytes(value)
			}
			return totalBytes
		} catch {
			return null
		}
	}

	@Spec('Measures one UTF-8 string approximately enough for user-facing runtime-footprint reporting in the browser shell.')
	private measureTextBytes(value: string): number {
		if ('TextEncoder' in globalThis) {
			return new TextEncoder().encode(value).length
		}
		return value.length * 2
	}
}
