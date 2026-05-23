const { Buffer } = require('buffer');
const buffer = require('buffer');
if (typeof buffer.SlowBuffer === 'undefined') {
    buffer.SlowBuffer = Buffer;
}
if (typeof global.SlowBuffer === 'undefined') {
    global.SlowBuffer = Buffer;
}
console.log('SlowBuffer polyfilled for Node.js v25 compatibility.');
