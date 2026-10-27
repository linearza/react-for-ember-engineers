import { useId, type ComponentProps } from 'react';

/*
DAY 14 — ref as a prop.
In React 19, function components receive `ref` like any other prop. forwardRef is no longer needed.
TODO: this component swallows the ref (a leftover from the forwardRef days). Pass it on to the
<input> so `<TextField ref={inputRef} />` gives the parent the DOM node.
*/

type TextFieldProps = ComponentProps<'input'> & { label: string };

export function TextField({ label, ref, id, ...inputProps }: TextFieldProps) {
  void ref;
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="text-field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} {...inputProps} />
    </div>
  );
}
