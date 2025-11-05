import React from 'react';
import { Header } from './Header';

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
