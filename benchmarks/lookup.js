import dns from 'node:dns';
import Benchmark from 'benchmark';
import Tangerine from '../index.js';

const options = { timeout: 5000, tries: 1 };

// eslint-disable-next-line n/prefer-promises/dns
dns.setServers(['1.1.1.1', '1.0.0.1']);

const resolver = new dns.promises.Resolver(options);
resolver.setServers(['1.1.1.1', '1.0.0.1']);

const cache = new Map();

async function lookupWithCache(host) {
  let result = cache.get(host);
  if (result) {
    return result;
  }

  result = await dns.promises.lookup(host);
  if (result) {
    cache.set(host, result);
  }

  return result;
}

const tangerine = new Tangerine({ ...options, method: 'POST' });
const tangerineNoCache = new Tangerine({
  ...options,
  method: 'POST',
  cache: false
});
const tangerineGet = new Tangerine(options);
const tangerineGetNoCache = new Tangerine({ ...options, cache: false });

const host = 'netflix.com';

const suite = new Benchmark.Suite('lookup');

suite.on('start', (ev) => {
  console.log(`Started: ${ev.currentTarget.name}`);
});

suite.add('tangerine.lookup POST with caching using Cloudflare', {
  defer: true,
  async fn(deferred) {
    await tangerine.lookup(host);
    deferred.resolve();
  }
});

suite.add('tangerine.lookup POST without caching using Cloudflare', {
  defer: true,
  async fn(deferred) {
    await tangerineNoCache.lookup(host);
    deferred.resolve();
  }
});

suite.add('tangerine.lookup GET with caching using Cloudflare', {
  defer: true,
  async fn(deferred) {
    await tangerineGet.lookup(host);
    deferred.resolve();
  }
});

suite.add('tangerine.lookup GET without caching using Cloudflare', {
  defer: true,
  async fn(deferred) {
    await tangerineGetNoCache.lookup(host);
    deferred.resolve();
  }
});

suite.add('dns.promises.lookup with caching using Cloudflare', {
  defer: true,
  async fn(deferred) {
    try {
      await lookupWithCache(host);
    } catch {}

    deferred.resolve();
  }
});

suite.add('dns.promises.lookup without caching using Cloudflare', {
  defer: true,
  async fn(deferred) {
    try {
      await dns.promises.lookup(host);
    } catch {}

    deferred.resolve();
  }
});

suite.on('cycle', (ev) => {
  console.log(String(ev.target));
});

suite.on('complete', function () {
  console.log(
    `Fastest without caching is: ${this.filter((bench) =>
      bench.name.includes('without caching')
    )
      .filter('fastest')
      .map('name')
      .join(', ')}\n`
  );
});

suite.run();
