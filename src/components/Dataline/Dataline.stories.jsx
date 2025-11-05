import React from 'react';
import { Dataline } from './Dataline';

/**
 * Dataline Component Stories
 * Auto-generated from Figma
 */
export default {
  title: 'Components/Dataline',
  component: Dataline,
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

const Template = (args) => <Dataline {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'Dataline',
};

export const WithImage = Template.bind({});
WithImage.args = {
  children: 'Dataline with image',
  imageSrc: 'https://via.placeholder.com/150',
  imageAlt: 'Dataline placeholder',
};

export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
  children: 'Dataline with custom class',
  className: 'custom-variant',
};
