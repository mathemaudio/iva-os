import './AppWindowCatalog.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory } from '@shared/lll.lll'
import { AppWindowCatalog } from './AppWindowCatalog.lll'

@Spec('Covers shell app metadata and default window sizing rules.')
export class AppWindowCatalogTest {
	testType = 'unit'

	@Scenario('exposes seeded shell apps and default window sizes for known app ids')
	static async exposesAppMetadataAndSizes(subjectFactory: SubjectFactory<AppWindowCatalog>, scenario: ScenarioParameter): Promise<{ appCount: number, fileManagerWidth: number, settingsHeight: number, terminalPinned: boolean }> {
		const scenarioParameter = this.resolveScenarioParameter(subjectFactory, scenario)
		const assert: AssertFn = scenarioParameter.assert
		const catalog = new AppWindowCatalog()
		const appCount = catalog.availableApps.length
		const fileManagerWidth = catalog.getWindowWidth('file-manager')
		const settingsHeight = catalog.getWindowHeight('settings')
		const terminalPinned = catalog.availableApps.some(appEntry => appEntry.id === 'terminal' && appEntry.isPinnedToDock)
		assert(appCount >= 6, 'Expected the shell catalog to expose the seeded core apps including Terminal')
		assert(fileManagerWidth === 760, 'Expected File Manager to keep its default width')
		assert(settingsHeight === 430, 'Expected Settings to keep its default height')
		assert(terminalPinned, 'Expected Terminal to be pinned to the dock')
		return { appCount, fileManagerWidth, settingsHeight, terminalPinned }
	}

	@Spec('Resolves the actual scenario parameter when the runner forwards either one or two callback arguments.')
	private static resolveScenarioParameter(subjectFactory: SubjectFactory<AppWindowCatalog>, scenario: ScenarioParameter): ScenarioParameter {
		const maybeScenario = scenario as unknown as ScenarioParameter | undefined
		if (maybeScenario !== undefined) {
			return maybeScenario
		}
		return subjectFactory as unknown as ScenarioParameter
	}
}
