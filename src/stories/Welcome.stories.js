export default {
  title: 'Welcome',
};

export const Welcome = () => {
  return `
    <div style="font-family: sans-serif; padding: 2rem; max-width: 600px;">
      <h1>Welcome to Storybook Urban Heroes</h1>
      <p>This is a design system built with:</p>
      <ul>
        <li>Storybook 10.0.5</li>
        <li>Twig templates</li>
        <li>SCSS</li>
        <li>Node 22.21.1 Bookworm</li>
        <li>Vite 6</li>
      </ul>
      <h2>Getting Started</h2>
      <p>Run <code>npm run fetch-figma</code> to import your design system from Figma.</p>
    </div>
  `;
};
