import { css, html, type CSSResultGroup, type TemplateResult } from 'lit'
import { Spec } from '@shared/lll.lll'

@Spec('Provides one shared on-the-fly emoji icon treatment that desaturates glyphs and remaps them into the shell blue palette.')
export class EmojiIconRenderer {
	static readonly styles: CSSResultGroup = css`
		.emoji-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			line-height: 1;
			vertical-align: middle;
		}

		.emoji-icon__glyph {
			display: inline-block;
			filter: grayscale(1) saturate(0.18) brightness(0.82) contrast(1.12) sepia(1) hue-rotate(168deg) saturate(4.6) brightness(0.96);
			text-shadow: 0 0 calc(6px * var(--shell-density-scale, 1)) rgba(118, 173, 255, 0.2);
			transform: translateZ(0);
		}
	`

	@Spec('Renders one emoji icon wrapper so every UI surface uses the same filtered glyph treatment.')
	public static renderIcon(emoji: string, accessibleLabel: string, additionalClassName: string = ''): TemplateResult {
		const normalizedAdditionalClassName = additionalClassName.trim()
		const hostClassName = normalizedAdditionalClassName === '' ? 'emoji-icon' : `emoji-icon ${normalizedAdditionalClassName}`
		return html`
			<span class=${hostClassName} role="img" aria-label=${accessibleLabel}>
				<span class="emoji-icon__glyph" aria-hidden="true">${emoji}</span>
			</span>
		`
	}
}
