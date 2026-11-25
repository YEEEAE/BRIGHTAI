import net from 'node:net';
import dgram from 'node:dgram';
import dns from 'node:dns';
import { syncBuiltinESMExports } from 'node:module';

const deny = () => { throw new Error('Network disabled for the BRIGHTAI offline audit'); };
globalThis.fetch = deny;
net.Socket.prototype.connect = deny;
dgram.createSocket = deny;
dns.lookup = deny;
dns.promises.lookup = deny;
syncBuiltinESMExports();
