const servers = [
  {
    url: 'https://builder-api.cachyos.org/api',
    name: 'CachyOS Builder API - STANDARD',
    default: true,
  },
  {
    url: 'https://builder-api-1.cachyos.org/api',
    name: 'CachyOS Builder API - ZEN4',
    default: false,
  },
];

export const defaultServer =
  servers.find(server => server.default) ?? servers[0];

export default servers;
