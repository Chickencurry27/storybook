import React from 'react';
import './Depth6Frame0.scss';

/**
 * Depth6Frame0 Component
 * Auto-generated from Figma
 */
export const Depth6Frame0 = ({
  children = 'Depth6Frame0',
  className = '',
  imageSrc = null,
  imageAlt = 'Depth6Frame0 image',
  ...props
}) => {
  return (
    <div className={`depth6frame0 ${className}`.trim()} {...props}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="depth6frame0__image"
        />
      )}
      <div className="depth6frame0__content">
        {children}
      </div>
    </div>
  );
};

export default Depth6Frame0;
