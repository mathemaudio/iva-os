import './TerminalView.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from '@shared/lll.lll'
import { TerminalView } from './TerminalView.lll'
import { PlatformTestContextFactory } from '../platform/PlatformTestContextFactory.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Exercises the limited Unix-like Terminal app through visible command output and filesystem mutations.')
export class TerminalViewTest {
	testType = 'behavioral'

	@Scenario('shows the supported command banner on startup and supports per-command help flags')
	static async showsStartupBannerAndCommandHelp(subjectFactory: SubjectFactory<TerminalView>, scenario: ScenarioParameter): Promise<{ bannerHasLs: boolean, bannerHasTerminal: boolean, helpIncludesUsage: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const terminal = await subjectFactory()
		terminal.platformContext = PlatformTestContextFactory.createApplicationContext('terminal', this.createMemoryStorage(), null, null).context
		await waitFor(() => terminal.shadowRoot !== null, 'Expected TerminalView shadow DOM to render')
		await terminal.updateComplete
		const startupText = this.readOutputText(terminal)
		assert(startupText.includes('IvaOS Terminal'), 'Expected the startup banner to identify the Terminal app')
		assert(startupText.includes('ls') && startupText.includes('mkdir') && startupText.includes('rm'), 'Expected the startup banner to list the supported filesystem commands')
		await this.runCommand(terminal, 'ls --help')
		const helpText = this.readOutputText(terminal)
		assert(helpText.includes('Usage: ls [path]'), 'Expected ls --help to show command usage')
		return {
			bannerHasLs: startupText.includes('ls'),
			bannerHasTerminal: startupText.includes('IvaOS Terminal'),
			helpIncludesUsage: helpText.includes('Usage: ls [path]')
		}
	}

	@Scenario('creates, reads, moves, and removes text files through visible terminal commands')
	static async mutatesFilesThroughCommands(subjectFactory: SubjectFactory<TerminalView>, scenario: ScenarioParameter): Promise<{ createdText: boolean, movedText: boolean, removedText: boolean }> {
		const assert: AssertFn = scenario.assert
		const waitFor: WaitForFn = scenario.waitFor
		const storage = this.createMemoryStorage()
		const context = PlatformTestContextFactory.createApplicationContext('terminal', storage, null, null)
		const terminal = await subjectFactory()
		terminal.platformContext = context.context
		await waitFor(() => terminal.shadowRoot !== null, 'Expected TerminalView shadow DOM to render for command testing')
		await terminal.updateComplete
		await this.runCommand(terminal, 'mkdir Notes')
		await this.runCommand(terminal, 'cd Notes')
		await this.runCommand(terminal, 'echo "hello from terminal" > diary.txt')
		await this.runCommand(terminal, 'cat diary.txt')
		await this.runCommand(terminal, 'mv diary.txt journal.txt')
		await this.runCommand(terminal, 'ls')
		await this.runCommand(terminal, 'rm journal.txt')
		await this.runCommand(terminal, 'ls')
		const outputText = this.readOutputText(terminal)
		assert(outputText.includes('hello from terminal'), 'Expected cat to print the written file content')
		assert(outputText.includes('journal.txt'), 'Expected ls to show the renamed file after mv')
		const notesFolder = context.virtualFileSystemService.resolvePath('/Notes')
		assert(notesFolder !== null && notesFolder.kind === 'folder', 'Expected mkdir to create the Notes folder in the shared VFS')
		const removedFile = context.virtualFileSystemService.resolvePath('/Notes/journal.txt')
		assert(removedFile === null, 'Expected rm to remove the renamed file from the shared VFS')
		const outputLines = this.readOutputLines(terminal)
		const removedText = outputLines[outputLines.length - 1] ?? ''
		return {
			createdText: outputText.includes('hello from terminal'),
			movedText: outputText.includes('journal.txt'),
			removedText: removedText.includes('(empty)')
		}
	}

	@Spec('Runs one command line through the visible terminal input and waits for the next render cycle.')
	private static async runCommand(terminal: TerminalView, commandLine: string): Promise<void> {
		const input = terminal.shadowRoot?.querySelector<HTMLInputElement>('[data-testid="terminal-input"]') ?? null
		if (input === null) {
			throw new Error('Expected terminal input to exist before running a command')
		}
		input.value = commandLine
		input.dispatchEvent(new Event('input', { bubbles: true }))
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
		await terminal.updateComplete
	}

	@Spec('Reads the full visible terminal output region text.')
	private static readOutputText(terminal: TerminalView): string {
		const output = terminal.shadowRoot?.querySelector<HTMLElement>('[data-testid="terminal-output"]') ?? null
		if (output === null) {
			throw new Error('Expected terminal output to exist')
		}
		return output.textContent ?? ''
	}

	@Spec('Reads the individual terminal output lines in visible order.')
	private static readOutputLines(terminal: TerminalView): string[] {
		return Array.from(terminal.shadowRoot?.querySelectorAll<HTMLElement>('[data-testid^="terminal-line-"]') ?? []).map(line => line.textContent?.trim() ?? '')
	}

	@Spec('Builds one isolated in-memory storage adapter for deterministic Terminal behavior tests.')
	private static createMemoryStorage(): VirtualFileSystemContract['StorageLike'] {
		const valuesByKey: Record<string, string> = {}
		return {
			getItem(key: string): string | null {
				return key in valuesByKey ? valuesByKey[key] : null
			},
			setItem(key: string, value: string): void {
				valuesByKey[key] = value
			},
			removeItem(key: string): void {
				delete valuesByKey[key]
			}
		}
	}
}
