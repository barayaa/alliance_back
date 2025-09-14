// export function parseJawsDbUrl(url: string): {
//   host: string;
//   port: number;
//   username: string;
//   password: string;
//   database: string;
// } {
//   const parsed = new URL(url);
//   return {
//     host: parsed.hostname,
//     port: parseInt(parsed.port, 10) || 3306,
//     username: parsed.username,
//     password: decodeURIComponent(parsed.password),
//     database: parsed.pathname.slice(1), // enlève le /
//   };
// }

export function parseJawsDbUrl(url: string) {
  const parsed = new URL(url.startsWith('mysql://') ? url : `mysql://${url}`);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 3306,
    username: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
  };
}
