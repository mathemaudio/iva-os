import './AppShellView.lll'
import './vfs/VirtualFileSystemService.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { AppShellView } from './AppShellView.lll'
import { ShellWallpaperCatalog } from './shell/ShellWallpaperCatalog.lll'
import { VirtualFileSystemService } from './vfs/VirtualFileSystemService.lll'

@Spec('Covers static rendering helpers on AppShellView.')
export class AppShellViewTest {
	testType = 'unit'

	@Scenario('renders settings content with theme and wallpaper controls')
	static async rendersSettingsContent(scenario: ScenarioParameter): Promise<{ hasThemeSelect: boolean, hasWallpaperSelect: boolean }> {
		const assert: AssertFn = scenario.assert
		const snapshot = new VirtualFileSystemService(null).load()
		const content = AppShellView.renderSettingsContent('dark', 'aurora', ShellWallpaperCatalog.getChoices(snapshot), () => undefined, () => undefined)
		const contentText = String(content.strings.join(' '))
		const hasThemeSelect = contentText.includes('theme-select')
		const hasWallpaperSelect = contentText.includes('wallpaper-select')
		assert(hasThemeSelect, 'Expected settings content to include the theme select marker')
		assert(hasWallpaperSelect, 'Expected settings content to include the wallpaper select marker')
		return { hasThemeSelect, hasWallpaperSelect }
	}

	@Scenario('includes scrollable window body, resize handle, theme-aware scrollbars, and a shared density token')
	static async includesResizeAndScrollShellStyles(scenario: ScenarioParameter): Promise<{ hasWindowBodyOverflow: boolean, hasResizeHandle: boolean, hasThemeAwareScrollbarStyles: boolean, hasDensityScale: boolean }> {
		const assert: AssertFn = scenario.assert
		const cssText = String(AppShellView.styles)
		const hasWindowBodyOverflow = cssText.includes('.window-body') && cssText.includes('overflow: auto')
		const hasResizeHandle = cssText.includes('.window-resize-handle') && cssText.includes('cursor: nwse-resize')
		const hasThemeAwareScrollbarStyles = cssText.includes('--shell-scrollbar-thumb')
			&& cssText.includes(".shell[data-theme='light']")
			&& cssText.includes('scrollbar-color: var(--shell-scrollbar-thumb) var(--shell-scrollbar-track)')
		const hasDensityScale = cssText.includes('--shell-density-scale: 0.88')
			&& cssText.includes('font-size: calc(16px * var(--shell-density-scale))')
			&& cssText.includes('padding: calc(8px * var(--shell-density-scale)) calc(10px * var(--shell-density-scale))')
		assert(hasWindowBodyOverflow, 'Expected shell styles to make window bodies scrollable')
		assert(hasResizeHandle, 'Expected shell styles to include the resize handle rules')
		assert(hasThemeAwareScrollbarStyles, 'Expected shell styles to include theme-aware scrollbar colors for dark and light modes')
		assert(hasDensityScale, 'Expected shell styles to expose and apply a shared density scale token')
		return { hasWindowBodyOverflow, hasResizeHandle, hasThemeAwareScrollbarStyles, hasDensityScale }
	}
}
