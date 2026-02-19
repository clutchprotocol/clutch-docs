import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/quickstart',
        'getting-started/docker-deploy',
        'getting-started/architecture',
      ],
    },
    {
      type: 'category',
      label: 'Clutch Node',
      items: [
        'clutch-node/overview',
        'clutch-node/configuration',
        'clutch-node/running',
      ],
    },
    {
      type: 'category',
      label: 'Clutch Hub API',
      items: [
        'clutch-hub-api/overview',
        'clutch-hub-api/authentication',
        'clutch-hub-api/graphql',
        'clutch-hub-api/configuration',
      ],
    },
    {
      type: 'category',
      label: 'Clutch Hub SDK',
      items: [
        'clutch-hub-sdk-js/overview',
        'clutch-hub-sdk-js/installation',
        'clutch-hub-sdk-js/usage',
        'clutch-hub-sdk-js/api-reference',
      ],
    },
    {
      type: 'category',
      label: 'Demo App',
      items: [
        'demo-app/overview',
        'demo-app/getting-started',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/clutch-deploy',
        'deployment/monitoring',
        'deployment/nginx',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/security',
        'reference/transaction-flow',
        'reference/faq',
      ],
    },
  ],
};

export default sidebars;
