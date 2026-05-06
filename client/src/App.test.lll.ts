import './App.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { App } from './App.lll'

@Spec('Exercises the paired App host through visible UI interactions only.')
export class AppTest {
	testType = 'behavioral'

	@Scenario('shows the app copy, calculator toggle button, and LLL corner link')
	static async rendersAppShell(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ buttonLabel: string, cornerLinkLabel: string }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		const content = app.shadowRoot?.querySelector<HTMLElement>('#example-content')
		assert(content !== null && content !== undefined, 'Expected the app content shell to render')
		const cornerLink = app.shadowRoot?.querySelector<HTMLAnchorElement>('.lll-corner-link')
		assert(cornerLink !== null && cornerLink !== undefined, 'Expected the bottom-left LLL corner link to render')
		assert(cornerLink.href === 'https://lllts.dev/', 'Expected the corner badge to link to the LLL website')
		assert(cornerLink.textContent?.trim() === 'made with LLL', 'Expected the corner badge to show made with LLL text')
		const button = this.getToggleButton(app)
		assert(button.textContent?.trim() === 'Open calculator', 'Expected the default toggle button label to be Open calculator')
		return {
			buttonLabel: button.textContent?.trim() ?? '',
			cornerLinkLabel: cornerLink.textContent?.trim() ?? ''
		}
	}

	@Scenario('toggles calculator visibility from the paired host')
	static async togglesCalculatorPanel(subjectFactory: SubjectFactory<App>, scenario: ScenarioParameter): Promise<{ opened: boolean, closed: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const app = await subjectFactory()
		await this.waitForApp(app, waitFor)

		const button = this.getToggleButton(app)
		button.click()
		await app.updateComplete
		await waitFor(() => this.findCalculator(app) !== null, 'Expected calculator-panel to appear after opening the calculator')
		const opened = this.findCalculator(app) !== null

		this.getToggleButton(app).click()
		await app.updateComplete
		await waitFor(() => this.findCalculator(app) === null, 'Expected calculator-panel to disappear after closing the calculator')
		const closed = this.findCalculator(app) === null

		assert(opened, 'Expected calculator to become visible after the first click')
		assert(closed, 'Expected calculator to disappear after the second click')
		return { opened, closed }
	}

	@Spec('Waits until the paired App host has rendered its shadow UI.')
	private static async waitForApp(app: App, waitFor: WaitForFn): Promise<void> {
		await waitFor(() => app.shadowRoot !== null, 'Expected app-root shadow DOM to render')
		await app.updateComplete
	}

	@Spec('Returns the visible toggle button rendered by the paired App host.')
	private static getToggleButton(app: App): HTMLButtonElement {
		const button = app.shadowRoot?.querySelector<HTMLButtonElement>('button')
		if (button === null || button === undefined) {
			throw new Error('Expected the app calculator toggle button to exist')
		}
		return button
	}

	@Spec('Returns the currently rendered calculator panel when visible.')
	private static findCalculator(app: App): HTMLElement | null {
		return app.shadowRoot?.querySelector<HTMLElement>('calculator-panel') ?? null
	}
}
