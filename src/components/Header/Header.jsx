import React from 'react';
import './Header.scss';

/**
 * Header Component
 * Auto-generated from Figma
 */
export const Header = ({
  children = 'Header',
  className = '',
  imageSrc = null,
  imageAlt = 'Header image',
  ...props
}) => {
  return (
    <div className={`header ${className}`.trim()} {...props}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="header__image"
        />
      )}
      <div className="header__content">
        {children}
      </div>
    </div>
  );
};

export default Header;
