import { Spec } from '@shared/lll.lll'

@Spec('Provides the supported Unix-like terminal command list, summaries, and per-command help text for the browser-hosted Terminal app.')
export class TerminalCommandCatalog {
	private static readonly commands: Array<{
		name: string
		summary: string
		help: string
	}> = [
		{
			name: 'pwd',
			summary: 'Print the current working directory.',
			help: 'Usage: pwd\n\nPrints the absolute path of the current working directory.\n\nOptions:\n  -h, --help   Show this help text.'
		},
		{
			name: 'ls',
			summary: 'List files and folders in the current or given directory.',
			help: 'Usage: ls [path]\n\nLists the visible entries inside the current directory or the given path. If the path resolves to a file, ls prints that file name.\n\nOptions:\n  -h, --help   Show this help text.'
		},
		{
			name: 'cd',
			summary: 'Change the current working directory.',
			help: 'Usage: cd <path>\n\nChanges the current working directory to one existing folder. Supports absolute paths, relative paths, . and ...\n\nOptions:\n  -h, --help   Show this help text.'
		},
		{
			name: 'mkdir',
			summary: 'Create one folder in an existing parent directory.',
			help: 'Usage: mkdir <path>\n\nCreates one folder. The final path segment becomes the new folder name, and the parent path must already exist. mkdir does not support -p in this Terminal.\n\nOptions:\n  -h, --help   Show this help text.'
		},
		{
			name: 'touch',
			summary: 'Create an empty text file or refresh one existing text file.',
			help: 'Usage: touch <path>\n\nCreates one empty text file when the path does not exist. When the path points at an existing text file, touch refreshes it by writing its current contents again.\n\nOptions:\n  -h, --help   Show this help text.'
		},
		{
			name: 'cat',
			summary: 'Print one text file to the terminal output.',
			help: 'Usage: cat <path>\n\nPrints the UTF-8 contents of one text file. Binary files are not supported by cat in this Terminal.\n\nOptions:\n  -h, --help   Show this help text.'
		},
		{
			name: 'echo',
			summary: 'Print text or write text into one file with >.',
			help: 'Usage: echo <text>\n       echo <text> > <path>\n\nPrints the given text or writes it into one text file. The > form overwrites the target file or creates it when missing. Append redirection is not supported.\n\nOptions:\n  -h, --help   Show this help text.'
		},
		{
			name: 'mv',
			summary: 'Move or rename one file-system node.',
			help: 'Usage: mv <source> <destination>\n\nMoves one file or folder into an existing destination folder, or renames it when the destination path names a new final segment inside an existing parent folder.\n\nOptions:\n  -h, --help   Show this help text.'
		},
		{
			name: 'rm',
			summary: 'Delete one file or remove one folder with -r.',
			help: 'Usage: rm <path>\n       rm -r <path>\n\nDeletes one file. To remove a folder, pass -r. Folder deletion is recursive in this Terminal.\n\nOptions:\n  -h, --help   Show this help text.'
		},
		{
			name: 'help',
			summary: 'List supported commands or show help for one command.',
			help: 'Usage: help [command]\n\nLists the supported commands, or shows the help text for one command. Every command also supports -h and --help.\n\nOptions:\n  -h, --help   Show this help text.'
		}
	]

	@Spec('Returns the supported terminal command names in display order.')
	public static getCommandNames(): string[] {
		return this.commands.map(command => command.name)
	}

	@Spec('Returns the supported command records with one-line summaries in display order.')
	public static getCommandSummaries(): Array<{ name: string, summary: string }> {
		return this.commands.map(command => ({ name: command.name, summary: command.summary }))
	}

	@Spec('Returns the help text for one supported command when it exists.')
	public static getHelpText(commandName: string): string | null {
		const command = this.commands.find(candidate => candidate.name === commandName) ?? null
		return command?.help ?? null
	}

	@Spec('Returns whether one command name is supported by the Terminal app.')
	public static hasCommand(commandName: string): boolean {
		return this.commands.some(candidate => candidate.name === commandName)
	}

	@Spec('Builds the startup banner that declares the supported command set once the Terminal starts.')
	public static buildStartupBanner(): string {
		const lines = [
			'IvaOS Terminal',
			'',
			'Supported Unix-like commands:'
		]
		for (const command of this.commands) {
			lines.push(`  ${command.name.padEnd(6, ' ')} ${command.summary}`)
		}
		lines.push('')
		lines.push('Run any command with -h or --help for quick usage.')
		return lines.join('\n')
	}
}
