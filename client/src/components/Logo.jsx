import React from 'react';

const Logo = ({ size = 'md' }) => {
  const sizes = {
    sm: {
      containerClass: 'w-8 h-8',
      iconClass: 'text-xl',
      textClass: 'text-lg',
    },
    md: {
      containerClass: 'w-10 h-10',
      iconClass: 'text-2xl',
      textClass: 'text-xl',
    },
    lg: {
      containerClass: 'w-12 h-12',
      iconClass: 'text-3xl',
      textClass: 'text-2xl',
    }
  };
  
  const sizeProps = sizes[size] || sizes.md;
  
  return (
    <div className="flex items-center">
      <div className={`${sizeProps.containerClass} flex items-center justify-center rounded-lg bg-primary-600 mr-2`}>
        <i className={`ri-database-2-line text-white ${sizeProps.iconClass}`}></i>
      </div>
      <div className="flex flex-col">
        <span className={`font-bold tracking-tight ${sizeProps.textClass} text-primary-600`}>
          DataChat
        </span>
        <span className="text-xs text-gray-500 -mt-1">AI-Powered Analysis</span>
      </div>
    </div>
  );
};

export default Logo;