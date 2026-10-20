// The five broken Tabs. Your checks must catch every one.
import type { TabsComponent } from '../Tabs';
import { Mutant as AriaSelectedAlwaysFalse } from './mutant1-aria-selected-always-false';
import { Mutant as ArrowRightNoWrap } from './mutant2-arrow-right-no-wrap';
import { Mutant as PanelNeverChanges } from './mutant3-panel-never-changes';
import { Mutant as AllTabsFocusable } from './mutant4-all-tabs-focusable';
import { Mutant as OnChangeNeverCalled } from './mutant5-on-change-never-called';

export const mutants: { name: string; Tabs: TabsComponent }[] = [
  { name: 'aria-selected-always-false', Tabs: AriaSelectedAlwaysFalse },
  { name: 'arrow-right-no-wrap', Tabs: ArrowRightNoWrap },
  { name: 'panel-never-changes', Tabs: PanelNeverChanges },
  { name: 'all-tabs-focusable', Tabs: AllTabsFocusable },
  { name: 'on-change-never-called', Tabs: OnChangeNeverCalled },
];
