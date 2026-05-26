'use client';

import React from 'react';
import styles from './TextInput.module.css';

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  error?: string;
};

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, id, error, required, ...props }, ref) => {
    return (
      <div className={styles.container}>
        <div className={styles.labelWrapper}>
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.required}> *</span>}
          </label>
        </div>
        <input
          id={id}
          ref={ref}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          required={required}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
