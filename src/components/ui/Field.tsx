import { ReactNode } from "react";
import styles from "./Field.module.css";

type Props = {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  startIcon?: string;
  endAction?: ReactNode;
  hint?: string;
  /**
   * Content opposite the label — "Forgot password?" and the like. From the parallel build's Field,
   * which is otherwise the same component as the Frostrek dashboard's; this is the one prop of
   * theirs ours lacked, and their auth screens use it.
   */
  labelAction?: ReactNode;
};

export function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  disabled,
  startIcon,
  endAction,
  hint,
  labelAction,
}: Props) {
  return (
    <div className={styles.field}>
      {labelAction ? (
        <div className={styles.labelRow}>
          <label htmlFor={name}>{label}</label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={name}>{label}</label>
      )}
      <div className={styles.inputWrap}>
        {startIcon ? (
          <span className={`material-symbols-outlined ${styles.startIcon}`} aria-hidden>
            {startIcon}
          </span>
        ) : null}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          aria-describedby={hint ? `${name}-hint` : undefined}
          className={startIcon ? styles.hasStart : undefined}
          style={endAction ? { paddingRight: "2.5rem" } : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {endAction ? <div className={styles.endAction}>{endAction}</div> : null}
      </div>
      {hint ? (
        <p id={`${name}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

import { Select as CustomSelect } from "./Select";

type SelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  /** Hide the label visually but keep it for screen readers — for selects inside a table row,
   *  where the column header already says what it is but the control still needs a name. */
  hideLabel?: boolean;
};

export function Select({
  label,
  name,
  value,
  onChange,
  options,
  disabled,
  hideLabel,
}: SelectProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </label>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        disabled={disabled}
      />
    </div>
  );
}
