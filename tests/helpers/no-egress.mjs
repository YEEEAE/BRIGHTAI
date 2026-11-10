// Test process and Node test children: reject outbound sockets before DNS.
import net from 'node:net';
import tls from 'node:tls';
import { syncBuiltinESMExports } from 'node:module';
const local=new Set(['127.0.0.1','localhost','::1']);
function check(args) {
  if(Array.isArray(args[0])) args=args[0];
  const value=args[0];
  if(typeof value==='string'||value?.path) throw new Error('Unix socket forbidden during local verification');
  const host=typeof value==='object'?value.host:typeof args[1]==='string'?args[1]:'localhost';
  if(!local.has(host??'localhost')) throw new Error('External network forbidden during local verification');
}
const connect=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){check(args);return connect.apply(this,args);};
const secure=tls.connect;
tls.connect=function(...args){check(args);return secure.apply(this,args);};
syncBuiltinESMExports();
