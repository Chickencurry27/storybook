import React from 'react';
import { Block } from './Block';

/**
 * Block Component Stories
 * Auto-generated from Figma
 */
export default {
  title: 'Components/Block',
  component: Block,
  argTypes: {
    children: {
      control: 'text',
      description: 'Component content',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    imageSrc: {
      control: 'text',
      description: 'Image source URL',
    },
    imageAlt: {
      control: 'text',
      description: 'Image alt text',
    },
  },
};

const Template = (args) => <Block {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Block',
};

export const WithImage = Template.bind({});
WithImage.args = {
  children: 'Block with image',
  imageSrc: 'https://via.placeholder.com/300x200',
  imageAlt: 'Block placeholder',
};

export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
  children: 'Block with custom class',
  className: 'custom-variant',
};

export const ProductCard = () => (
  <Block imageSrc="https://via.placeholder.com/300x200">
    <div style={{ textAlign: 'left', width: '100%' }}>
      <h3 style={{ margin: '0.5rem 0', color: '#007bff' }}>Product Name</h3>
      <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.6' }}>
        This is a description of the product. It has amazing features and great quality.
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>$99.99</span>
        <button style={{
          padding: '0.5rem 1rem',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Add to Cart
        </button>
      </div>
    </div>
  </Block>
);

export const FeatureCard = () => (
  <Block imageSrc="https://via.placeholder.com/200x200">
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ margin: '0.5rem 0', color: '#007bff' }}>Fast Delivery</h3>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Get your products delivered within 24 hours
      </p>
    </div>
  </Block>
);

export const CardGrid = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', padding: '1rem' }}>
    <Block imageSrc="https://via.placeholder.com/300x200">
      <h3>Product 1</h3>
      <p>$29.99</p>
    </Block>
    <Block imageSrc="https://via.placeholder.com/300x200">
      <h3>Product 2</h3>
      <p>$39.99</p>
    </Block>
    <Block imageSrc="https://via.placeholder.com/300x200">
      <h3>Product 3</h3>
      <p>$49.99</p>
    </Block>
  </div>
);
