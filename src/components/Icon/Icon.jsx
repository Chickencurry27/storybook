import React from 'react';
import './Icon.scss';

/**
 * Icon Component
 * For displaying SVG icons from Figma
 */
export const Icon = ({
  name = 'bell',
  size = 'md',
  color = 'currentColor',
  className = '',
  ...props
}) => {
  // Map icon names to SVG paths
  const icons = {
    bell: '/src/assets/figma/vector---0.svg',
  };

  const sizes = {
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '48px',
  };

  return (
    <span
      className={`icon icon--${size} ${className}`.trim()}
      style={{ color }}
      {...props}
    >
      <img
        src={icons[name] || icons.bell}
        alt={`${name} icon`}
        style={{ width: sizes[size], height: sizes[size] }}
      />
    </span>
  );
};

export default Icon;
