import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion } from '@ex/day14/Accordion';
import { Modal } from '@ex/day14/Modal';
import { TextField } from '@ex/day14/TextField';
import { KeepAliveTabs } from '@ex/day14/KeepAliveTabs';

describe('Day 14 — patterns & modern APIs', () => {
  describe('Accordion (compound components)', () => {
    function FAQ() {
      return (
        <Accordion>
          <Accordion.Item value="hooks">
            <Accordion.Trigger>What is a hook?</Accordion.Trigger>
            <Accordion.Panel>A function that uses React state.</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="keys">
            <Accordion.Trigger>Why keys?</Accordion.Trigger>
            <Accordion.Panel>Identity across renders.</Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      );
    }

    test('starts closed; panels are hidden', () => {
      render(<FAQ />);
      expect(screen.getByRole('button', { name: 'What is a hook?' })).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByText('A function that uses React state.')).not.toBeVisible();
    });

    test('opens one item at a time, and the panel is labelled by its trigger', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      const hooks = screen.getByRole('button', { name: 'What is a hook?' });
      const keys = screen.getByRole('button', { name: 'Why keys?' });

      await user.click(hooks);
      expect(hooks).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('region', { name: 'What is a hook?' })).toHaveTextContent('A function that uses React state.');
      expect(hooks).toHaveAttribute('aria-controls', screen.getByRole('region').id);

      await user.click(keys);
      expect(keys).toHaveAttribute('aria-expanded', 'true');
      expect(hooks).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByText('A function that uses React state.')).not.toBeVisible();

      await user.click(keys);
      expect(keys).toHaveAttribute('aria-expanded', 'false');
    });

    test('defaultValue opens an item initially', () => {
      render(
        <Accordion defaultValue="keys">
          <Accordion.Item value="keys">
            <Accordion.Trigger>Why keys?</Accordion.Trigger>
            <Accordion.Panel>Identity across renders.</Accordion.Panel>
          </Accordion.Item>
        </Accordion>,
      );
      expect(screen.getByRole('button', { name: 'Why keys?' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Identity across renders.')).toBeVisible();
    });

    test('subcomponents throw outside <Accordion>', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() =>
        render(
          <Accordion.Item value="x">
            <Accordion.Trigger>Orphan</Accordion.Trigger>
          </Accordion.Item>,
        ),
      ).toThrow('must be used inside <Accordion>');
      expect(() => render(<Accordion.Panel>Orphan</Accordion.Panel>)).toThrow('must be used inside <Accordion>');
    });
  });

  describe('Modal (portal)', () => {
    test('renders into document.body, outside the render container, as a labelled modal dialog', () => {
      const { container } = render(
        <Modal open onClose={() => {}} title="New issue">
          <p>Form goes here</p>
        </Modal>,
      );
      const dialog = screen.getByRole('dialog', { name: 'New issue' });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(container).not.toContainElement(dialog);
      expect(document.body).toContainElement(dialog);
    });

    test('moves focus into the dialog and closes on Escape', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <Modal open onClose={onClose} title="New issue">
          <p>Form goes here</p>
        </Modal>,
      );
      expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('events bubble through the React tree, and focus returns to the opener on close', async () => {
      const user = userEvent.setup();
      const onParentClick = vi.fn();
      function Harness() {
        const [open, setOpen] = useState(false);
        return (
          <div onClick={onParentClick}>
            <button type="button" onClick={() => setOpen(true)}>
              Open
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="New issue">
              <button type="button">Inside</button>
            </Modal>
          </div>
        );
      }
      const { container } = render(<Harness />);
      await user.click(screen.getByRole('button', { name: 'Open' }));
      onParentClick.mockClear();

      const inside = screen.getByRole('button', { name: 'Inside' });
      expect(container).not.toContainElement(inside); // not a DOM descendant…
      await user.click(inside);
      expect(onParentClick).toHaveBeenCalled(); // …but still a React descendant

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
    });

    test('renders nothing when closed, and the labelled dialog once opened', () => {
      const { rerender } = render(
        <Modal open={false} onClose={() => {}} title="New issue">
          x
        </Modal>,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      rerender(
        <Modal open onClose={() => {}} title="New issue">
          x
        </Modal>,
      );
      expect(screen.getByRole('dialog', { name: 'New issue' })).toBeInTheDocument();
    });
  });

  test('TextField passes ref (a plain prop in React 19) to the <input>', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField label="Title" ref={ref} placeholder="What broke?" />);
    expect(ref.current).toBe(screen.getByLabelText('Title'));
    expect(ref.current).toHaveAttribute('placeholder', 'What broke?');
  });

  test('KeepAliveTabs keeps a hidden tab mounted with <Activity>', async () => {
    const user = userEvent.setup();
    render(<KeepAliveTabs />);
    await user.click(screen.getByRole('button', { name: 'Comment' }));
    await user.type(screen.getByLabelText('Comment draft'), 'LGTM, ship it');

    await user.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByText('Issue details go here.')).toBeVisible();
    expect(screen.getByLabelText('Comment draft')).not.toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Comment' }));
    expect(screen.getByLabelText('Comment draft')).toHaveValue('LGTM, ship it');
  });
});
