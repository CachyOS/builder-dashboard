const servers = [
  {
    default: true,
    name: 'CachyOS Builder API - STANDARD',
    url: 'https://builder-api.cachyos.org/api',
  },
  {
    default: false,
    name: 'CachyOS Builder API - ZEN4',
    url: 'https://builder-api-1.cachyos.org/api',
  },
];

export const defaultServer =
  servers.find(server => server.default) ?? servers[0];

export default servers;
