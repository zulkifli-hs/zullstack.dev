"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * `useActionState`, dispatched from `onSubmit` instead of `<form action>`.
 *
 * React 19 resets a form whose `action` prop is a function the moment that
 * action settles. It is unconditional and it happens before React can know what
 * the action returned: `startHostTransition` calls `requestFormReset` on the way
 * in, and the commit runs `form.reset()`. So a save rejected by validation comes
 * back with every uncontrolled field snapped to its `defaultValue` — a new entry
 * empties itself, an edit reverts to what was on screen when the page loaded,
 * and the one required field the editor forgot now costs them the whole form.
 *
 * There is no way to decline it. `ReactDOM.requestFormReset` exists to opt *in*
 * from a submit handler; the `action` path opts in for you.
 *
 * Dispatching the action by hand keeps the entire `useActionState` cycle — same
 * server action, same returned state, same `pending` — and simply leaves the DOM
 * alone, so a rejected save returns the form exactly as it was submitted with
 * only the flagged fields to fix. Nothing degrades by giving up the `action`
 * prop: every form using this already requires JavaScript (the Cloudinary
 * uploader, the rich-text editor, and every repeater's hidden JSON input), so
 * the no-JS submission it would have bought was never functional.
 *
 * Forms that *want* to clear after a successful submit should do it from their
 * own state — that decision belongs to the form, not to the framework's
 * indifference to the outcome.
 */
export function useActionForm<State>(
  action: (state: Awaited<State>, formData: FormData) => State | Promise<State>,
  initialState: Awaited<State>,
) {
  const [state, dispatch, pending] = useActionState<State, FormData>(action, initialState);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Read the fields now: `currentTarget` is only valid for the duration of
    // the handler, and the transition callback runs after it returns.
    const formData = new FormData(event.currentTarget);

    // Not optional. `useActionState` only reports `pending` when its dispatch
    // is called inside a transition — outside one it quietly downgrades the
    // call to a plain update and the Save button never shows that it is busy.
    startTransition(() => dispatch(formData));
  }

  return { state, pending, onSubmit };
}
