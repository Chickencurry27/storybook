import React from 'react';
import './Avatar.scss';

/**
 * Avatar Component
 * Auto-generated from Figma
 */
export const Avatar = ({
  children = 'Avatar',
  className = '',
  imageSrc = null,
  imageAlt = 'Avatar image',
  ...props
}) => {
  return (
    <div className={`avatar ${className}`.trim()} {...props}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="avatar__image"
        />
      )}
      <div className="avatar__content">
        {children}
      </div>
    </div>
  );
};

export default Avatar;
