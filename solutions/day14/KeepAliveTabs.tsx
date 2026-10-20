import { Activity, useState } from 'react';

function DetailsTab() {
  return <p>Issue details go here.</p>;
}

function CommentTab() {
  // Local state that would be lost on unmount.
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
      {/* <Activity mode="hidden"> keeps the subtree mounted (state and DOM preserved), hides it
          with display:none, and unmounts its effects until it's visible again. */}
      <Activity mode={tab === 'details' ? 'visible' : 'hidden'}>
        <DetailsTab />
      </Activity>
      <Activity mode={tab === 'comment' ? 'visible' : 'hidden'}>
        <CommentTab />
      </Activity>
    </div>
  );
}
