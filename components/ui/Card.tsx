import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export const Card: React.FC<CardProps> = ({ title, icon, actions, children, className = '', headerClassName = '' }) => {
  return (
    <div className={`bg-gray-900/60 border border-white/10 rounded-[20px] shadow-sm backdrop-blur-md overflow-hidden ${className}`}>
      <div className={`flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500 ${headerClassName}`}>
        <div className="flex items-center gap-3 min-w-0">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          {title && <div className="min-w-0 truncate text-sm font-semibold text-white">{title}</div>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default Card;


