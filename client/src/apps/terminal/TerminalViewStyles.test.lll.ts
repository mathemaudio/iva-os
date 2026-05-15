import './TerminalViewStyles.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { TerminalViewStyles } from './TerminalViewStyles.lll'

@Spec('Covers the shared Terminal style helper that supplies the browser-hosted terminal chrome.')
export class TerminalViewStylesTest {
	testType = 'unit'

	@Scenario('provides terminal layout and prompt styling selectors in the shared stylesheet')
	static async exposesTerminalStyleSelectors(scenario: ScenarioParameter): Promise<{ hasTerminalSelector: boolean, hasPromptSelector: boolean, hasOutputSelector: boolean }> {
		const assert: AssertFn = scenario.assert
		const styleText = String(TerminalViewStyles.styles.cssText)
		const hasTerminalSelector = styleText.includes('.terminal')
		const hasPromptSelector = styleText.includes('.prompt-row')
		const hasOutputSelector = styleText.includes('.output')
		assert(hasTerminalSelector, 'Expected the Terminal stylesheet to define the outer terminal layout selector')
		assert(hasPromptSelector, 'Expected the Terminal stylesheet to define prompt-row styling')
		assert(hasOutputSelector, 'Expected the Terminal stylesheet to define scrollable output styling')
		return { hasTerminalSelector, hasPromptSelector, hasOutputSelector }
	}
}
