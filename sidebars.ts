import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/quickstart', 'getting-started/docker-deploy'],
    },
    {
      type: 'category',
      label: 'Clutch Node',
      items: ['clutch-node/overview', 'clutch-node/configuration'],
    },
    {
      type: 'category',
      label: 'Clutch Hub API',
      items: ['clutch-hub-api/overview', 'clutch-hub-api/graphql'],
    },
    {
      type: 'category',
      label: 'SDK',
      items: ['clutch-hub-sdk-js/overview', 'clutch-hub-sdk-js/usage'],
    },
  ],
};

export default sidebars;
