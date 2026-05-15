import { Spec } from '@shared/lll.lll'
import { AppShellView } from './AppShellView.lll';


@Spec("Provides the App shell style bundle as a focused companion class for the browser-hosted shell root.")
export class AppStyles {
	public static styles = AppShellView.styles

}
