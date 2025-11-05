import React from 'react';
import './Dataline.scss';

/**
 * Dataline Component
 * Auto-generated from Figma
 */
export const Dataline = ({
  children = 'Dataline',
  className = '',
  imageSrc = null,
  imageAlt = 'Dataline image',
  ...props
}) => {
  return (
    <div className={`dataline ${className}`.trim()} {...props}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="dataline__image"
        />
      )}
      <div className="dataline__content">
        {children}
      </div>
    </div>
  );
};

export default Dataline;
