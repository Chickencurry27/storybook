import React from 'react';
import { Avatar } from './Avatar';

/**
 * Avatar Component Stories
 * Auto-generated from Figma
 */
export default {
  title: 'Components/Avatar',
  component: Avatar,
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

const Template = (args) => <Avatar {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Avatar',
};

export const WithImage = Template.bind({});
WithImage.args = {
  children: 'Avatar with image',
  imageSrc: 'https://via.placeholder.com/150',
  imageAlt: 'Avatar placeholder',
};

export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
  children: 'Avatar with custom class',
  className: 'custom-variant',
};
