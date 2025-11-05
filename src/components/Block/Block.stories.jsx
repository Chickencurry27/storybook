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
  imageSrc: 'https://via.placeholder.com/150',
  imageAlt: 'Block placeholder',
};

export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
  children: 'Block with custom class',
  className: 'custom-variant',
};
