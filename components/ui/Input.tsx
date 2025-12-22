import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, wrapperClassName = '', ...rest }) => {
  return (
    <div className={wrapperClassName}>
      {label && <label className="block text-xs text-gray-300 mb-1">{label}</label>}
      <input
        {...rest}
        className={`w-full rounded-[10px] bg-gray-800 border border-white/10 text-sm text-gray-100 placeholder-gray-400 focus:outline-none transition-shadow duration-150 ${rest.className || ''}`}
        style={{ padding: '11px 14px' }}
      />
      {error && <div className="text-xs text-rose-400 mt-1">{error}</div>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, wrapperClassName = '', ...rest }) => {
  return (
    <div className={wrapperClassName}>
      {label && <label className="block text-xs text-gray-300 mb-1">{label}</label>}
      <textarea
        {...rest}
        className={`w-full rounded-[10px] bg-gray-800 border border-white/10 text-sm text-gray-100 placeholder-gray-400 focus:outline-none transition-shadow duration-150 ${rest.className || ''}`}
        style={{ padding: '11px 14px' }}
      />
      {error && <div className="text-xs text-rose-400 mt-1">{error}</div>}
    </div>
  );
};

export default Input;


