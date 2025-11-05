import React from 'react';
import { Icon } from './Icon';

/**
 * Icon Component Stories
 */
export default {
  title: 'Components/Icon',
  component: Icon,
  argTypes: {
    name: {
      control: 'select',
      options: ['bell'],
      description: 'Icon name',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Icon size',
    },
    color: {
      control: 'color',
      description: 'Icon color',
    },
  },
};

const Template = (args) => <Icon {...args} />;

export const Default = Template.bind({});
Default.args = {
  name: 'bell',
  size: 'md',
};

export const Small = Template.bind({});
Small.args = {
  name: 'bell',
  size: 'sm',
};

export const Large = Template.bind({});
Large.args = {
  name: 'bell',
  size: 'lg',
};

export const ExtraLarge = Template.bind({});
ExtraLarge.args = {
  name: 'bell',
  size: 'xl',
};

export const AllSizes = () => (
  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
    <Icon name="bell" size="sm" />
    <Icon name="bell" size="md" />
    <Icon name="bell" size="lg" />
    <Icon name="bell" size="xl" />
  </div>
);
