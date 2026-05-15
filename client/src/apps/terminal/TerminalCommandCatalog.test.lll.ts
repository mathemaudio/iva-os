import './TerminalCommandCatalog.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec } from '@shared/lll.lll'
import { TerminalCommandCatalog } from './TerminalCommandCatalog.lll'

@Spec('Covers the Terminal command catalog startup banner and per-command help metadata.')
export class TerminalCommandCatalogTest {
	testType = 'unit'

	@Scenario('lists the supported commands and exposes help text for each command')
	static async exposesCommandMetadata(scenario: ScenarioParameter): Promise<{ commandCount: number, hasLsHelp: boolean, bannerHasHelpHint: boolean }> {
		const assert: AssertFn = scenario.assert
		const commandNames = TerminalCommandCatalog.getCommandNames()
		const lsHelp = TerminalCommandCatalog.getHelpText('ls')
		const startupBanner = TerminalCommandCatalog.buildStartupBanner()
		assert(commandNames.length === 10, 'Expected the Terminal to expose exactly ten supported commands')
		assert(commandNames.includes('pwd') && commandNames.includes('rm') && commandNames.includes('help'), 'Expected the Terminal catalog to expose the requested filesystem command set')
		assert(lsHelp !== null && lsHelp.includes('Usage: ls [path]'), 'Expected the ls help text to describe supported usage')
		assert(startupBanner.includes('--help') && startupBanner.includes('Supported Unix-like commands:'), 'Expected the startup banner to tell users how to discover command help')
		return {
			commandCount: commandNames.length,
			hasLsHelp: lsHelp?.includes('Usage: ls [path]') ?? false,
			bannerHasHelpHint: startupBanner.includes('--help')
		}
	}
}
