import './FileManagerViewStyles.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { FileManagerViewStyles } from './FileManagerViewStyles.lll'

@Spec('Covers static style markers required by the File Manager view layout.')
export class FileManagerViewStylesTest {
	testType = 'unit'

	@Scenario('includes layout markers for sidebar, toolbar, grid, and list presentation')
	static async exposesExpectedStyleMarkers(scenario: ScenarioParameter): Promise<{ hasSidebar: boolean, hasToolbar: boolean, hasGrid: boolean, hasList: boolean }> {
		const assert: AssertFn = scenario.assert
		const cssText = String(FileManagerViewStyles.styles)
		const hasSidebar = cssText.includes('.sidebar')
		const hasToolbar = cssText.includes('.toolbar')
		const hasGrid = cssText.includes('.grid-view')
		const hasList = cssText.includes('.list-view')
		assert(hasSidebar, 'Expected File Manager styles to include sidebar rules')
		assert(hasToolbar, 'Expected File Manager styles to include toolbar rules')
		assert(hasGrid, 'Expected File Manager styles to include grid-view rules')
		assert(hasList, 'Expected File Manager styles to include list-view rules')
		return { hasSidebar, hasToolbar, hasGrid, hasList }
	}

	@Scenario('inherits theme-aware shell tokens and uses the shared density scale for layout sizing')
	static async exposesThemeAwareShellTokens(scenario: ScenarioParameter): Promise<{ hasShellText: boolean, hasMutedText: boolean, hasShellControl: boolean, hasShellError: boolean, hasDensityScaleUsage: boolean }> {
		const assert: AssertFn = scenario.assert
		const cssText = String(FileManagerViewStyles.styles)
		const hasShellText = cssText.includes('color: var(--shell-text')
		const hasMutedText = cssText.includes('var(--shell-muted-text')
		const hasShellControl = cssText.includes('var(--shell-control') && cssText.includes('var(--shell-control-border')
		const hasShellError = cssText.includes('var(--shell-error') && cssText.includes('var(--shell-error-text')
		const hasDensityScaleUsage = cssText.includes('var(--shell-density-scale, 1)')
			&& cssText.includes('grid-template-columns: calc(200px * var(--shell-density-scale, 1)) minmax(0, 1fr)')
			&& cssText.includes('padding: calc(9px * var(--shell-density-scale, 1)) calc(12px * var(--shell-density-scale, 1))')
		assert(hasShellText, 'Expected File Manager styles to inherit shell text color tokens for light and dark themes')
		assert(hasMutedText, 'Expected File Manager styles to inherit shell muted text color tokens for secondary labels')
		assert(hasShellControl, 'Expected File Manager styles to inherit shell control surface and border tokens')
		assert(hasShellError, 'Expected File Manager styles to inherit shell error surface and text tokens')
		assert(hasDensityScaleUsage, 'Expected File Manager styles to consume the shared shell density scale for layout and controls')
		return { hasShellText, hasMutedText, hasShellControl, hasShellError, hasDensityScaleUsage }
	}
}
