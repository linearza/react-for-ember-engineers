import { Activity, useState } from 'react';

/*
DAY 14 — <Activity>.
Type a comment draft, switch to Details, switch back: the draft is gone. Conditional rendering
UNMOUNTS the hidden tab, and its state goes with it.

TODO: render both tabs, each wrapped in <Activity mode={visible ? 'visible' : 'hidden'}>.
Hidden Activity content stays mounted (state preserved) but is display:none and its effects
are torn down. Ember has no direct equivalent: closest is keeping a component rendered and
toggling a CSS class, which keeps its effects running.
*/

function DetailsTab() {
  return <p>Issue details go here.</p>;
}

function CommentTab() {
  const [draft, setDraft] = useState('');
  return (
    <label>
      Comment draft
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
    </label>
  );
}

type Tab = 'details' | 'comment';

export function KeepAliveTabs() {
  const [tab, setTab] = useState<Tab>('details');
  void Activity;
  return (
    <div>
      <div role="group" aria-label="Sections">
        <button type="button" aria-pressed={tab === 'details'} onClick={() => setTab('details')}>
          Details
        </button>
        <button type="button" aria-pressed={tab === 'comment'} onClick={() => setTab('comment')}>
          Comment
        </button>
      </div>
      {tab === 'details' ? <DetailsTab /> : <CommentTab />}
    </div>
  );
}
