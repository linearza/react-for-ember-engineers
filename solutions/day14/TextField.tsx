import { useId, type ComponentProps } from 'react';

// React 19: `ref` is a regular prop on function components. No forwardRef.
// ComponentProps<'input'> gives you every native input prop (including ref), fully typed.
type TextFieldProps = ComponentProps<'input'> & { label: string };

export function TextField({ label, ref, id, ...inputProps }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="text-field">
      <label htmlFor={inputId}>{label}</label>
      <input ref={ref} id={inputId} {...inputProps} />
    </div>
  );
}
