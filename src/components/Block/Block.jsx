import React from 'react';
import './Block.scss';

/**
 * Block Component
 * Auto-generated from Figma
 */
export const Block = ({
  children = 'Block',
  className = '',
  imageSrc = null,
  imageAlt = 'Block image',
  ...props
}) => {
  return (
    <div className={`block ${className}`.trim()} {...props}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="block__image"
        />
      )}
      <div className="block__content">
        {children}
      </div>
    </div>
  );
};

export default Block;
