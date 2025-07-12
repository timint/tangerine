import dns from 'node:dns';
import Benchmark from 'benchmark';
import Tangerine from '../index.js';

const options = { timeout: 5000, tries: 1 };

// eslint-disable-next-line n/prefer-promises/dns
dns.setServers(['1.1.1.1', '1.0.0.1']);

const resolver = new dns.promises.Resolver(options);
resolver.setServers(['1.1.1.1', '1.0.0.1']);

const cache = new Map();

async function resolverReverseWithCache(host) {
  let result = cache.get(host);
  if (result) {
    return result;
  }

  result = await resolver.reverse(host);
  if (result) {
    cache.set(host, result);
  }

  return result;
}

async function dnsReverseWithCache(host) {
  let result = cache.get(host);
  if (result) {
    return result;
  }

  result = await dns.promises.reverse(host);
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

const suite = new Benchmark.Suite('reverse');

suite.on('start', (ev) => {
  console.log(`Started: ${ev.currentTarget.name}`);
});

suite.add('tangerine.reverse GET with caching', {
  defer: true,
  async fn(deferred) {
    try {
      await tangerine.reverse('1.1.1.1');
    } catch {}

    deferred.resolve();
  }
});

suite.add('tangerine.reverse GET without caching', {
  defer: true,
  async fn(deferred) {
    try {
      await tangerineNoCache.reverse('1.1.1.1');
    } catch {}

    deferred.resolve();
  }
});

suite.add('resolver.reverse with caching', {
  defer: true,
  async fn(deferred) {
    try {
      await resolverReverseWithCache('1.1.1.1');
    } catch {}

    deferred.resolve();
  }
});

suite.add('resolver.reverse without caching', {
  defer: true,
  async fn(deferred) {
    try {
      await resolver.reverse('1.1.1.1');
    } catch {}

    deferred.resolve();
  }
});

suite.add('dns.promises.reverse with caching', {
  defer: true,
  async fn(deferred) {
    try {
      await dnsReverseWithCache('1.1.1.1');
    } catch {}

    deferred.resolve();
  }
});

suite.add('dns.promises.reverse without caching', {
  defer: true,
  async fn(deferred) {
    try {
      await dns.promises.reverse('1.1.1.1');
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
