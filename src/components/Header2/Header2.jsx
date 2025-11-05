import React from 'react';
import './Header2.scss';

/**
 * Header2 Component
 * Auto-generated from Figma
 */
export const Header2 = ({
  children = 'Header2',
  className = '',
  imageSrc = null,
  imageAlt = 'Header2 image',
  ...props
}) => {
  return (
    <div className={`header2 ${className}`.trim()} {...props}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="header2__image"
        />
      )}
      <div className="header2__content">
        {children}
      </div>
    </div>
  );
};

export default Header2;
