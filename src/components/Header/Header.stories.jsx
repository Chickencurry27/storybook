import React from 'react';
import { Header } from './Header';
import { Icon } from '../Icon/Icon';

/**
 * Header Component Stories
 * Auto-generated from Figma
 */
export default {
  title: 'Components/Header',
  component: Header,
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

const Template = (args) => <Header {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Header',
};

export const WithImage = Template.bind({});
WithImage.args = {
  children: 'Header with image',
  imageSrc: 'https://via.placeholder.com/150',
  imageAlt: 'Header placeholder',
};

export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
  children: 'Header with custom class',
  className: 'custom-variant',
};

export const AppHeader = () => (
  <Header>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img src="https://via.placeholder.com/40" alt="Logo" style={{ borderRadius: '50%' }} />
        <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Urban Heroes</span>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <Icon name="bell" size="md" />
        </button>
        <img src="https://via.placeholder.com/32" alt="User" style={{ borderRadius: '50%' }} />
      </div>
    </div>
  </Header>
);

export const NavigationHeader = () => (
  <Header>
    <nav style={{ display: 'flex', gap: '2rem', width: '100%', justifyContent: 'center' }}>
      <a href="#" style={{ textDecoration: 'none', color: 'inherit', fontWeight: '500' }}>Home</a>
      <a href="#" style={{ textDecoration: 'none', color: 'inherit', fontWeight: '500' }}>Products</a>
      <a href="#" style={{ textDecoration: 'none', color: 'inherit', fontWeight: '500' }}>About</a>
      <a href="#" style={{ textDecoration: 'none', color: 'inherit', fontWeight: '500' }}>Contact</a>
    </nav>
  </Header>
);
