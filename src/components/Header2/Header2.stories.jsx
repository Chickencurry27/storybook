import React from 'react';
import { Header2 } from './Header2';

/**
 * Header2 Component Stories
 * Auto-generated from Figma
 */
export default {
  title: 'Components/Header2',
  component: Header2,
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

const Template = (args) => <Header2 {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Header2',
};

export const WithImage = Template.bind({});
WithImage.args = {
  children: 'Header2 with image',
  imageSrc: 'https://via.placeholder.com/150',
  imageAlt: 'Header2 placeholder',
};

export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
  children: 'Header2 with custom class',
  className: 'custom-variant',
};
