import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './index.module.css';

type Feature = {
  title: string;
  description: string;
  to: string;
};

const features: Feature[] = [
  {
    title: 'Clutch Node',
    description: 'Blockchain core with Aura consensus, custom RLP transactions, non-EVM design.',
    to: '/clutch-node/overview',
  },
  {
    title: 'Hub API',
    description: 'GraphQL bridge between apps and the node, with wallet JWT auth.',
    to: '/clutch-hub-api/overview',
  },
  {
    title: 'JavaScript SDK',
    description: 'Client-side signing, RLP encoding, and live subscriptions over WebSocket.',
    to: '/clutch-hub-sdk-js/overview',
  },
  {
    title: 'Block Explorer',
    description: 'Read-only chain indexer, REST API, and web UI for blocks, transactions, and accounts.',
    to: '/clutch-explorer/overview',
  },
  {
    title: 'Demo App',
    description: 'Reference React app showing the passenger and driver ride flow end to end.',
    to: '/demo-app/overview',
  },
  {
    title: 'CLT Economics',
    description: 'Fully-reserved CLT, referrer fees on ride payments, and a flat per-transaction fee to the block author.',
    to: '/clutch-node/clt-economics',
  },
  {
    title: 'Clutch Treasury',
    description: 'USDT deposits and redemptions split across three services, so no single one can both decide to mint and move the money behind it.',
    to: '/clutch-treasury/overview',
  },
];

const route = [
  {tx: 'RideRequest', text: 'The passenger posts the trip.'},
  {tx: 'RideOffer', text: 'A driver offers a price.'},
  {tx: 'RideAcceptance', text: 'The passenger accepts the offer.'},
  {tx: 'RidePay', text: 'The passenger pays the driver in CLT.'},
];

function Hero(): ReactNode {
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroInner}>
        <div>
          <h1 className={styles.heroTitle}>Clutch Protocol</h1>
          <p className={styles.heroSubtitle}>
            Decentralized ride-sharing blockchain
          </p>
          <p className={styles.heroTagline}>
            Open-source stack for on-chain ride lifecycle, client-side signing,
            and instant CLT payouts to drivers.
          </p>
          <div className={styles.buttons}>
            <Link className={styles.heroButtonPrimary} to="/intro">
              Get started
            </Link>
            <Link
              className={styles.heroButtonOutline}
              href="https://app-stage.clutchprotocol.io"
            >
              Try the stage demo
            </Link>
          </div>
          <p className={styles.alphaBadge}>Alpha software. Public testnet is live.</p>
        </div>
        <div className={styles.route}>
          <h2 className={styles.routeTitle}>One ride, four transactions</h2>
          <ol className={styles.routeList}>
            {route.map((r) => (
              <li key={r.tx}>
                <code>{r.tx}</code> {r.text}
              </li>
            ))}
          </ol>
          <Link to="/getting-started/ride-lifecycle">Read the ride lifecycle</Link>
        </div>
      </div>
    </header>
  );
}

function Repo({name}: {name: string}): ReactNode {
  return (
    <Link href={`https://github.com/clutchprotocol/${name}`}>
      <code>{name}</code>
    </Link>
  );
}

// The same three lines as the org profile README and clutchprotocol.io. Change them together.
function WhatIsClutch(): ReactNode {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>What is Clutch?</h2>
      <dl className={styles.whatIsList}>
        <div>
          <dt>What it is</dt>
          <dd> Clutch Protocol is an open-source
          ride-sharing blockchain. Passengers and drivers send ride requests,
          offers and payments as transactions on its own chain,{' '}
          <Repo name="clutch-node" />.</dd>
        </div>
        <div>
          <dt>How apps use it</dt>
          <dd> <Repo name="clutch-hub" /> has the
          Hub API, a JavaScript SDK that signs on the user's device, and a
          reference app for passengers and drivers.{' '}
          <Repo name="clutch-explorer" /> shows the blocks and transactions.</dd>
        </div>
        <div>
          <dt>Money and servers</dt>
          <dd> Rides are paid in CLT, a token
          fully backed by USDT, and <Repo name="clutch-treasury" /> gives CLT
          for USDT and pays USDT back. <Repo name="clutch-deploy" /> runs the
          public testnet and the mainnet, which has been live since 2026-09-19
          (mainnet deposits are not open yet).</dd>
        </div>
      </dl>
    </section>
  );
}

function Features(): ReactNode {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Explore the stack</h2>
      <div className={styles.featureGrid}>
        {features.map((f) => (
          <Link key={f.title} to={f.to} className={styles.featureCard}>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ArchitectureSteps(): ReactNode {
  const steps = [
    'Build unsigned tx — the app asks the Hub API for an unsigned transaction payload',
    'Sign client-side — the user signs the hash locally (keys never sent to server)',
    'Submit signed tx — the app sends signed RLP hex to the Hub, which forwards to the node',
    'Validate & mine — the node verifies signature/nonce, applies state, includes in a block',
  ];
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>How it fits together</h2>
      <div className={styles.archBlock}>
        <p>
          <strong>Demo App / Your dApp + SDK</strong> → <strong>Clutch Hub API</strong>{' '}
          (GraphQL / WS) → <strong>Clutch Node</strong> (blockchain,
          WebSocket RPC) → <strong>Clutch Explorer</strong> (indexer + UI)
        </p>
        <ol>
          {steps.map((s) => (
            <li key={s.slice(0, 24)}>{s}</li>
          ))}
        </ol>
        <p>
          See the full{' '}
          <Link to="/getting-started/architecture">architecture overview</Link>{' '}
          and <Link to="/getting-started/ride-lifecycle">ride lifecycle</Link>.
        </p>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <Hero />
      <main>
        <WhatIsClutch />
        <Features />
        <ArchitectureSteps />
      </main>
    </Layout>
  );
}
