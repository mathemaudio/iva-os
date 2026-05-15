import { LitElement, html, type PropertyValues, type TemplateResult } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { Spec } from '@shared/lll.lll'
import { TerminalCommandCatalog } from './terminal/TerminalCommandCatalog.lll'
import { TerminalViewStyles } from './terminal/TerminalViewStyles.lll'
import type { PlatformContract } from '../platform/PlatformContract.lll'
import type { VirtualFileSystemContract } from '../vfs/VirtualFileSystemContract.lll'

@Spec('Renders a limited Unix-like terminal over the shared virtual filesystem with a small supported filesystem command set.')
@customElement('iva-terminal-view')
export class TerminalView extends LitElement {
	static styles = TerminalViewStyles.styles
	@property({ attribute: false })
	platformContext: PlatformContract['ApplicationContext'] | null = null

	@state()
	private snapshot: VirtualFileSystemContract['Snapshot'] | null = null

	@state()
	private currentFolderId: string | null = null

	@state()
	private inputValue: string = ''

	@state()
	private outputLines: Array<{ kind: 'system' | 'command' | 'output' | 'error', text: string }> = []

	@query('[data-testid="terminal-output"]')
	private outputElement!: HTMLDivElement

	@query('[data-testid="terminal-input"]')
	private inputElement!: HTMLInputElement

	private unsubscribe: (() => void) | null = null
	private attachedFileSystem: PlatformContract['FileSystemService'] | null = null
	private hasPrintedStartupBanner: boolean = false

	@Spec('Attaches to the app-facing filesystem service after the Terminal view enters the DOM.')
	connectedCallback(): void {
		super.connectedCallback()
		this.attachToFileSystem()
	}

	@Spec('Releases the filesystem subscription when the Terminal view leaves the DOM.')
	disconnectedCallback(): void {
		if (this.unsubscribe !== null) {
			this.unsubscribe()
			this.unsubscribe = null
		}
		this.attachedFileSystem = null
		super.disconnectedCallback()
	}

	@Spec('Reattaches to the current platform filesystem service when the injected application context changes.')
	updated(changedProperties: PropertyValues<this>): void {
		if (changedProperties.has('platformContext')) {
			this.attachToFileSystem()
		}
		this.scrollOutputToBottom()
		if (this.inputElement !== undefined && this.shadowRoot?.activeElement !== this.inputElement) {
			this.inputElement.focus()
		}
	}

	@Spec('Renders the full Terminal output surface plus one interactive command prompt.')
	render(): TemplateResult {
		return html`
			<div class="terminal" data-testid="terminal-view" @click=${() => this.focusInput()}>
				<div class="output" data-testid="terminal-output">
					${this.outputLines.map((line, index) => html`<div class="output-line" data-kind=${line.kind} data-testid=${`terminal-line-${index}`}>${line.text}</div>`)}
				</div>
				<label class="prompt-row">
					<span class="prompt-label" data-testid="terminal-prompt">${this.getPromptLabel()}</span>
					<input
						class="input"
						data-testid="terminal-input"
						autocomplete="off"
						spellcheck="false"
						.value=${this.inputValue}
						@input=${(event: Event) => this.onInput(event)}
						@keydown=${(event: KeyboardEvent) => this.onInputKeyDown(event)}
					/>
					<span class="prompt-hint">Enter to run</span>
				</label>
			</div>
		`
	}

	@Spec('Attaches to the latest platform filesystem service and seeds the Terminal startup banner once.')
	private attachToFileSystem(): void {
		const filesystem = this.platformContext?.filesystem ?? null
		if (this.attachedFileSystem === filesystem) {
			this.snapshot = filesystem?.getSnapshot() ?? null
			this.ensureCurrentFolderIsValid()
			this.ensureStartupBanner()
			return
		}
		if (this.unsubscribe !== null) {
			this.unsubscribe()
			this.unsubscribe = null
		}
		this.attachedFileSystem = filesystem
		if (filesystem === null) {
			this.snapshot = null
			this.currentFolderId = null
			return
		}
		this.snapshot = filesystem.getSnapshot()
		this.ensureCurrentFolderIsValid()
		this.ensureStartupBanner()
		this.unsubscribe = filesystem.subscribe(snapshot => {
			this.snapshot = snapshot
			this.ensureCurrentFolderIsValid()
		})
	}

	@Spec('Ensures the current working directory always points at one existing folder in the latest snapshot.')
	private ensureCurrentFolderIsValid(): void {
		if (this.snapshot === null) {
			this.currentFolderId = null
			return
		}
		if (this.currentFolderId === null) {
			this.currentFolderId = this.snapshot.schema.rootId
			return
		}
		const currentNode = this.snapshot.schema.nodesById[this.currentFolderId] ?? null
		if (currentNode?.kind !== 'folder') {
			this.currentFolderId = this.snapshot.schema.rootId
		}
	}

	@Spec('Prints the command banner once so Terminal startup declares the supported command set to the user.')
	private ensureStartupBanner(): void {
		if (this.hasPrintedStartupBanner) {
			return
		}
		this.pushOutput('system', TerminalCommandCatalog.buildStartupBanner())
		this.hasPrintedStartupBanner = true
	}

	@Spec('Updates the visible command line from user typing inside the input field.')
	private onInput(event: Event): void {
		const target = event.target
		if (!(target instanceof HTMLInputElement)) {
			return
		}
		this.inputValue = target.value
	}

	@Spec('Runs the current command line when the user presses Enter in the Terminal input.')
	private onInputKeyDown(event: KeyboardEvent): void {
		if (event.key !== 'Enter') {
			return
		}
		event.preventDefault()
		const commandLine = this.inputValue.trim()
		if (commandLine.length === 0) {
			return
		}
		this.pushOutput('command', `${this.getPromptLabel()} ${commandLine}`)
		this.inputValue = ''
		this.runCommandLine(commandLine)
	}

	@Spec('Runs one terminal command line against the shared virtual filesystem and appends the visible result.')
	private runCommandLine(commandLine: string): void {
		const tokens = this.tokenizeCommandLine(commandLine)
		if (tokens === null) {
			this.pushOutput('error', 'terminal: unmatched quote in command line')
			return
		}
		if (tokens.length === 0) {
			return
		}
		const commandName = tokens[0]
		const argumentsList = tokens.slice(1)
		if (TerminalCommandCatalog.hasCommand(commandName) === false) {
			this.pushOutput('error', `terminal: command not found: ${commandName}`)
			return
		}
		if (this.shouldShowHelp(argumentsList)) {
			this.showCommandHelp(commandName)
			return
		}
		try {
			if (commandName === 'help') {
				this.runHelp(argumentsList)
				return
			}
			if (commandName === 'pwd') {
				this.runPwd(argumentsList)
				return
			}
			if (commandName === 'ls') {
				this.runLs(argumentsList)
				return
			}
			if (commandName === 'cd') {
				this.runCd(argumentsList)
				return
			}
			if (commandName === 'mkdir') {
				this.runMkdir(argumentsList)
				return
			}
			if (commandName === 'touch') {
				this.runTouch(argumentsList)
				return
			}
			if (commandName === 'cat') {
				this.runCat(argumentsList)
				return
			}
			if (commandName === 'echo') {
				this.runEcho(argumentsList)
				return
			}
			if (commandName === 'mv') {
				this.runMv(argumentsList)
				return
			}
			if (commandName === 'rm') {
				this.runRm(argumentsList)
				return
			}
			this.pushOutput('error', `terminal: unsupported command: ${commandName}`)
		} catch (error: unknown) {
			this.pushOutput('error', this.readErrorMessage(error))
		}
	}

	@Spec('Returns true when the current command arguments request inline help output.')
	private shouldShowHelp(argumentsList: string[]): boolean {
		return argumentsList.includes('-h') || argumentsList.includes('--help')
	}

	@Spec('Prints the help text for one supported command.')
	private showCommandHelp(commandName: string): void {
		const helpText = TerminalCommandCatalog.getHelpText(commandName)
		this.pushOutput('output', helpText ?? `No help available for ${commandName}`)
	}

	@Spec('Lists supported commands or prints help for one named command.')
	private runHelp(argumentsList: string[]): void {
		if (argumentsList.length === 0) {
			this.pushOutput('output', TerminalCommandCatalog.buildStartupBanner())
			return
		}
		const requestedCommand = argumentsList[0]
		if (TerminalCommandCatalog.hasCommand(requestedCommand) === false) {
			this.pushOutput('error', `help: unknown command: ${requestedCommand}`)
			return
		}
		this.showCommandHelp(requestedCommand)
	}

	@Spec('Prints the absolute path of the current working directory.')
	private runPwd(argumentsList: string[]): void {
		if (argumentsList.length > 0) {
			this.pushOutput('error', 'pwd: this Terminal does not support extra arguments')
			return
		}
		this.pushOutput('output', this.getCurrentFolderPath())
	}

	@Spec('Lists one folder or file path in a compact Unix-like format.')
	private runLs(argumentsList: string[]): void {
		if (argumentsList.length > 1) {
			this.pushOutput('error', 'ls: expected zero or one path argument')
			return
		}
		const targetNode = argumentsList.length === 0 ? this.getCurrentFolderNode() : this.requireResolvedPath(argumentsList[0])
		if (targetNode.kind === 'file') {
			this.pushOutput('output', targetNode.name)
			return
		}
		const childIds = this.snapshot?.schema.childrenById[targetNode.id] ?? []
		const childNodes = childIds
			.map(childId => this.snapshot?.schema.nodesById[childId] ?? null)
			.filter((childNode): childNode is VirtualFileSystemContract['Node'] => childNode !== null)
		const output = childNodes.length === 0
			? '(empty)'
			: childNodes.map(childNode => childNode.kind === 'folder' ? `${childNode.name}/` : childNode.name).join('  ')
		this.pushOutput('output', output)
	}

	@Spec('Changes the current working directory to one resolved folder path.')
	private runCd(argumentsList: string[]): void {
		if (argumentsList.length !== 1) {
			this.pushOutput('error', 'cd: expected exactly one path argument')
			return
		}
		const targetNode = this.requireResolvedPath(argumentsList[0])
		if (targetNode.kind !== 'folder') {
			this.pushOutput('error', `cd: not a directory: ${argumentsList[0]}`)
			return
		}
		this.currentFolderId = targetNode.id
		this.pushOutput('output', this.getCurrentFolderPath())
	}

	@Spec('Creates one folder beneath an existing parent directory from the requested path.')
	private runMkdir(argumentsList: string[]): void {
		if (argumentsList.length !== 1) {
			this.pushOutput('error', 'mkdir: expected exactly one path argument')
			return
		}
		const targetPath = argumentsList[0]
		const pathParts = this.splitPathSegments(targetPath)
		if (pathParts.length === 0) {
			this.pushOutput('error', 'mkdir: expected a folder name')
			return
		}
		const newFolderName = pathParts[pathParts.length - 1]
		const parentPath = this.readParentPath(targetPath)
		const parentNode = parentPath === null ? this.getCurrentFolderNode() : this.requireResolvedPath(parentPath)
		if (parentNode.kind !== 'folder') {
			this.pushOutput('error', `mkdir: parent is not a directory: ${parentPath}`)
			return
		}
		const createdNode = this.platformContext?.filesystem.createFolder(parentNode.id, newFolderName) ?? null
		if (createdNode === null) {
			this.pushOutput('error', 'mkdir: filesystem service unavailable')
			return
		}
		this.pushOutput('output', `created ${this.buildNodePath(createdNode.id)}`)
	}

	@Spec('Creates one empty text file or refreshes one existing text file at the requested path.')
	private runTouch(argumentsList: string[]): void {
		if (argumentsList.length !== 1) {
			this.pushOutput('error', 'touch: expected exactly one path argument')
			return
		}
		const targetPath = argumentsList[0]
		const existingNode = this.resolvePath(targetPath)
		if (existingNode !== null) {
			if (existingNode.kind !== 'file') {
				this.pushOutput('error', `touch: cannot write directory: ${targetPath}`)
				return
			}
			const filesystem = this.platformContext?.filesystem ?? null
			const existingContent = filesystem?.readTextFile(existingNode.id) ?? null
			if (existingContent === null || filesystem === null) {
				this.pushOutput('error', `touch: only text files are supported: ${targetPath}`)
				return
			}
			filesystem.writeTextFile(existingNode.id, existingContent)
			this.pushOutput('output', `updated ${this.buildNodePath(existingNode.id)}`)
			return
		}
		const fileName = this.readLeafName(targetPath)
		if (fileName === null) {
			this.pushOutput('error', 'touch: expected a file name')
			return
		}
		const parentPath = this.readParentPath(targetPath)
		const parentNode = parentPath === null ? this.getCurrentFolderNode() : this.requireResolvedPath(parentPath)
		if (parentNode.kind !== 'folder') {
			this.pushOutput('error', `touch: parent is not a directory: ${parentPath}`)
			return
		}
		const createdNode = this.platformContext?.filesystem.createTextFile(parentNode.id, fileName, '') ?? null
		if (createdNode === null) {
			this.pushOutput('error', 'touch: filesystem service unavailable')
			return
		}
		this.pushOutput('output', `created ${this.buildNodePath(createdNode.id)}`)
	}

	@Spec('Prints the UTF-8 contents of one text file to the Terminal output.')
	private runCat(argumentsList: string[]): void {
		if (argumentsList.length !== 1) {
			this.pushOutput('error', 'cat: expected exactly one file path argument')
			return
		}
		const targetNode = this.requireResolvedPath(argumentsList[0])
		if (targetNode.kind !== 'file') {
			this.pushOutput('error', `cat: not a file: ${argumentsList[0]}`)
			return
		}
		const filesystem = this.platformContext?.filesystem ?? null
		const fileContent = filesystem?.readTextFile(targetNode.id) ?? null
		if (fileContent === null) {
			this.pushOutput('error', `cat: binary files are not supported: ${argumentsList[0]}`)
			return
		}
		this.pushOutput('output', fileContent.length === 0 ? '(empty file)' : fileContent)
	}

	@Spec('Prints one text string or overwrites one target text file when > redirection is used.')
	private runEcho(argumentsList: string[]): void {
		if (argumentsList.length === 0) {
			this.pushOutput('output', '')
			return
		}
		const redirectIndex = argumentsList.indexOf('>')
		if (redirectIndex === -1) {
			this.pushOutput('output', argumentsList.join(' '))
			return
		}
		if (redirectIndex === 0 || redirectIndex !== argumentsList.length - 2) {
			this.pushOutput('error', 'echo: expected the form echo <text> > <path>')
			return
		}
		const content = argumentsList.slice(0, redirectIndex).join(' ')
		const targetPath = argumentsList[redirectIndex + 1]
		this.writeTextToPath(targetPath, content)
		this.pushOutput('output', `wrote ${targetPath}`)
	}

	@Spec('Moves or renames one node according to a destination folder or destination path.')
	private runMv(argumentsList: string[]): void {
		if (argumentsList.length !== 2) {
			this.pushOutput('error', 'mv: expected a source path and a destination path')
			return
		}
		const sourceNode = this.requireResolvedPath(argumentsList[0])
		const destinationPath = argumentsList[1]
		const destinationNode = this.resolvePath(destinationPath)
		if (destinationNode !== null) {
			if (destinationNode.kind !== 'folder') {
				this.pushOutput('error', `mv: destination file already exists: ${destinationPath}`)
				return
			}
			this.platformContext?.filesystem.moveNode(sourceNode.id, destinationNode.id)
			this.pushOutput('output', `moved ${argumentsList[0]} -> ${this.buildNodePath(sourceNode.id)}`)
			return
		}
		const nextName = this.readLeafName(destinationPath)
		if (nextName === null) {
			this.pushOutput('error', 'mv: expected a destination path')
			return
		}
		const destinationParentPath = this.readParentPath(destinationPath)
		const destinationParentNode = destinationParentPath === null ? this.getCurrentFolderNode() : this.requireResolvedPath(destinationParentPath)
		if (destinationParentNode.kind !== 'folder') {
			this.pushOutput('error', `mv: destination parent is not a directory: ${destinationParentPath}`)
			return
		}
		if (sourceNode.parentId !== destinationParentNode.id) {
			this.platformContext?.filesystem.moveNode(sourceNode.id, destinationParentNode.id)
		}
		const renamedNode = this.platformContext?.filesystem.renameNode(sourceNode.id, nextName) ?? null
		if (renamedNode === null) {
			this.pushOutput('error', 'mv: filesystem service unavailable')
			return
		}
		this.pushOutput('output', `moved ${argumentsList[0]} -> ${this.buildNodePath(renamedNode.id)}`)
	}

	@Spec('Deletes one file or recursively removes one folder when the user passes -r.')
	private runRm(argumentsList: string[]): void {
		if (argumentsList.length === 0 || argumentsList.length > 2) {
			this.pushOutput('error', 'rm: expected rm <path> or rm -r <path>')
			return
		}
		const isRecursive = argumentsList[0] === '-r'
		const targetPath = isRecursive ? argumentsList[1] ?? '' : argumentsList[0]
		if (targetPath.length === 0) {
			this.pushOutput('error', 'rm: expected a path argument')
			return
		}
		const targetNode = this.requireResolvedPath(targetPath)
		if (targetNode.id === this.snapshot?.schema.rootId) {
			this.pushOutput('error', 'rm: refusing to remove the root directory')
			return
		}
		if (targetNode.kind === 'folder' && isRecursive === false) {
			this.pushOutput('error', `rm: cannot remove directory without -r: ${targetPath}`)
			return
		}
		this.platformContext?.filesystem.deleteNode(targetNode.id)
		this.pushOutput('output', `removed ${targetPath}`)
	}

	@Spec('Writes one text payload into one existing or newly created text file path.')
	private writeTextToPath(targetPath: string, content: string): void {
		const existingNode = this.resolvePath(targetPath)
		if (existingNode !== null) {
			if (existingNode.kind !== 'file') {
				throw new Error(`echo: cannot overwrite directory: ${targetPath}`)
			}
			const currentContent = this.platformContext?.filesystem.readTextFile(existingNode.id)
			if (currentContent === null) {
				throw new Error(`echo: only text files are supported: ${targetPath}`)
			}
			this.platformContext?.filesystem.writeTextFile(existingNode.id, content)
			return
		}
		const fileName = this.readLeafName(targetPath)
		if (fileName === null) {
			throw new Error('echo: expected a target file path')
		}
		const parentPath = this.readParentPath(targetPath)
		const parentNode = parentPath === null ? this.getCurrentFolderNode() : this.requireResolvedPath(parentPath)
		if (parentNode.kind !== 'folder') {
			throw new Error(`echo: parent is not a directory: ${parentPath}`)
		}
		this.platformContext?.filesystem.createTextFile(parentNode.id, fileName, content)
	}

	@Spec('Returns the current working directory path for the visible prompt and pwd output.')
	private getCurrentFolderPath(): string {
		if (this.snapshot === null) {
			return '/'
		}
		const currentFolder = this.getCurrentFolderNode()
		return this.buildNodePath(currentFolder.id)
	}

	@Spec('Returns the current working directory node, which is always normalized to one folder.')
	private getCurrentFolderNode(): VirtualFileSystemContract['Node'] {
		const snapshot = this.requireSnapshot()
		const currentFolderId = this.currentFolderId ?? snapshot.schema.rootId
		const currentNode = snapshot.schema.nodesById[currentFolderId] ?? null
		if (currentNode?.kind !== 'folder') {
			return snapshot.schema.nodesById[snapshot.schema.rootId]
		}
		return currentNode
	}

	@Spec('Returns the shell-like prompt label that shows the current working directory.')
	private getPromptLabel(): string {
		return `${this.getCurrentFolderPath()} $`
	}

	@Spec('Resolves one path string from the current working directory when needed and returns the matching node when present.')
	private resolvePath(path: string): VirtualFileSystemContract['Node'] | null {
		const snapshot = this.snapshot
		if (snapshot === null) {
			return null
		}
		const startNode = path.startsWith('/')
			? snapshot.schema.nodesById[snapshot.schema.rootId] ?? null
			: this.getCurrentFolderNode()
		if (startNode === null) {
			return null
		}
		const pathParts = this.splitPathSegments(path)
		let currentNode: VirtualFileSystemContract['Node'] | null = startNode
		for (const pathPart of pathParts) {
			if (currentNode === null) {
				return null
			}
			if (pathPart === '.') {
				continue
			}
			if (pathPart === '..') {
				const parentId: string | null = currentNode.parentId
				currentNode = parentId === null ? currentNode : snapshot.schema.nodesById[parentId] ?? null
				continue
			}
			if (currentNode.kind !== 'folder') {
				return null
			}
			const childIds: string[] = snapshot.schema.childrenById[currentNode.id] ?? []
			const nextNode: VirtualFileSystemContract['Node'] | null = childIds
				.map((childId: string) => snapshot.schema.nodesById[childId] ?? null)
				.find((candidate: VirtualFileSystemContract['Node'] | null) => candidate?.name === pathPart) ?? null
			currentNode = nextNode
		}
		return currentNode
	}

	@Spec('Returns one resolved node or throws a readable terminal error when the path does not exist.')
	private requireResolvedPath(path: string): VirtualFileSystemContract['Node'] {
		const targetNode = this.resolvePath(path)
		if (targetNode === null) {
			throw new Error(`path not found: ${path}`)
		}
		return targetNode
	}

	@Spec('Returns the current snapshot or throws when the filesystem service has not been attached yet.')
	private requireSnapshot(): VirtualFileSystemContract['Snapshot'] {
		if (this.snapshot === null) {
			throw new Error('filesystem snapshot unavailable')
		}
		return this.snapshot
	}

	@Spec('Builds the absolute visible path for one existing filesystem node identifier.')
	private buildNodePath(nodeId: string): string {
		const snapshot = this.requireSnapshot()
		const segments: string[] = []
		let currentNode = snapshot.schema.nodesById[nodeId] ?? null
		while (currentNode !== null && currentNode.parentId !== null) {
			segments.unshift(currentNode.name)
			currentNode = snapshot.schema.nodesById[currentNode.parentId] ?? null
		}
		return segments.length === 0 ? '/' : `/${segments.join('/')}`
	}

	@Spec('Splits one user-provided path into normalized path segments while preserving . and ...')
	private splitPathSegments(path: string): string[] {
		return path.split('/').map(segment => segment.trim()).filter(segment => segment.length > 0)
	}

	@Spec('Returns the final non-empty path segment from one user-provided path when present.')
	private readLeafName(path: string): string | null {
		const pathParts = this.splitPathSegments(path)
		if (pathParts.length === 0) {
			return null
		}
		const leafName = pathParts[pathParts.length - 1]
		if (leafName === '.' || leafName === '..') {
			return null
		}
		return leafName
	}

	@Spec('Returns the parent path string for one user-provided path, or null when the current directory is the parent.')
	private readParentPath(path: string): string | null {
		const normalizedPath = path.trim()
		const pathParts = this.splitPathSegments(normalizedPath)
		if (pathParts.length <= 1) {
			return null
		}
		const parentParts = pathParts.slice(0, pathParts.length - 1)
		const prefix = normalizedPath.startsWith('/') ? '/' : ''
		return `${prefix}${parentParts.join('/')}`
	}

	@Spec('Tokenizes one terminal command line with lightweight support for single and double quoted arguments.')
	private tokenizeCommandLine(commandLine: string): string[] | null {
		const tokens: string[] = []
		let currentToken = ''
		let activeQuote: 'single' | 'double' | null = null
		for (const character of commandLine) {
			if (character === '\'' && activeQuote !== 'double') {
				activeQuote = activeQuote === 'single' ? null : 'single'
				continue
			}
			if (character === '"' && activeQuote !== 'single') {
				activeQuote = activeQuote === 'double' ? null : 'double'
				continue
			}
			if (character === ' ' && activeQuote === null) {
				if (currentToken.length > 0) {
					tokens.push(currentToken)
					currentToken = ''
				}
				continue
			}
			currentToken += character
		}
		if (activeQuote !== null) {
			return null
		}
		if (currentToken.length > 0) {
			tokens.push(currentToken)
		}
		return tokens
	}

	@Spec('Appends one visible terminal output line with the requested presentation kind.')
	private pushOutput(kind: 'system' | 'command' | 'output' | 'error', text: string): void {
		this.outputLines = [...this.outputLines, { kind, text }]
	}

	@Spec('Normalizes unknown thrown values into readable terminal error messages.')
	private readErrorMessage(error: unknown): string {
		if (error instanceof Error) {
			return error.message
		}
		return 'unexpected terminal error'
	}

	@Spec('Keeps the latest terminal output visible after command execution and subscription-driven updates.')
	private scrollOutputToBottom(): void {
		if (this.outputElement === undefined) {
			return
		}
		this.outputElement.scrollTop = this.outputElement.scrollHeight
	}

	@Spec('Focuses the terminal input so clicks anywhere inside the terminal keep keyboard entry ready.')
	private focusInput(): void {
		if (this.inputElement === undefined) {
			return
		}
		this.inputElement.focus()
	}
}
