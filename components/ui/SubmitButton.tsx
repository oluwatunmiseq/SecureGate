import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import styles from './SubmitButton.module.css';

type SubmitButtonProps = {
  label: string;
  isPending: boolean;
  disabled?: boolean;
};

export function SubmitButton({ label, isPending, disabled }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || isPending}
      className={styles.button}
      aria-busy={isPending ? 'true' : 'false'}
    >
      {isPending ? (
        <span className={styles.content}>
          <LoadingSpinner className={styles.spinner} />
          {label}...
        </span>
      ) : (
        label
      )}
    </button>
  );
}
