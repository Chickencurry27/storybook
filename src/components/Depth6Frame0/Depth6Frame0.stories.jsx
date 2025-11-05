import React from 'react';
import { Depth6Frame0 } from './Depth6Frame0';

/**
 * Depth6Frame0 Component Stories
 * Auto-generated from Figma
 */
export default {
  title: 'Components/Depth6Frame0',
  component: Depth6Frame0,
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

const Template = (args) => <Depth6Frame0 {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Depth6Frame0',
};

export const WithImage = Template.bind({});
WithImage.args = {
  children: 'Depth6Frame0 with image',
  imageSrc: 'https://via.placeholder.com/150',
  imageAlt: 'Depth6Frame0 placeholder',
};

export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
  children: 'Depth6Frame0 with custom class',
  className: 'custom-variant',
};
