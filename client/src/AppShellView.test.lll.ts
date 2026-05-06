import './AppShellView.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { AppShellView } from './AppShellView.lll'

@Spec('Covers static rendering helpers on AppShellView.')
export class AppShellViewTest {
	testType = 'unit'

	@Scenario('renders settings content with theme and wallpaper controls')
	static async rendersSettingsContent(scenario: ScenarioParameter): Promise<{ hasThemeSelect: boolean, hasWallpaperSelect: boolean }> {
		const assert: AssertFn = scenario.assert
		const content = AppShellView.renderWindowContent('settings', 'midnight', 'aurora', () => undefined, () => undefined)
		const contentText = String(content.strings.join(' '))
		const hasThemeSelect = contentText.includes('theme-select')
		const hasWallpaperSelect = contentText.includes('wallpaper-select')
		assert(hasThemeSelect, 'Expected settings content to include the theme select marker')
		assert(hasWallpaperSelect, 'Expected settings content to include the wallpaper select marker')
		return { hasThemeSelect, hasWallpaperSelect }
	}
}
