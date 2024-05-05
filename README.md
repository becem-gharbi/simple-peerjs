# Simple Peerjs

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

[PeerJS](https://peerjs.com) wraps the browser's WebRTC implementation to provide a complete, configurable, and easy-to-use peer-to-peer connection API. Equipped with nothing but an ID, a peer can create a P2P data or media stream connection to a remote peer.

The intended goal behind this work is to more simplify the usage by auto-handling of data connections and providing a global API to reference connections and trigger events.

# Setup

Install the package:

```bash
npm i @bg-dev/simple-peerjs
```

Instantiate a new `SimplePeer` instance and set config options which extends `Peer` [options](https://peerjs.com/docs/#api):

```ts
const simplePeer = new SimplePeer({
  rmVideoElId: "rm-video",
  lcVideoElId: "lc-video",
  callingTimeoutMs: 15000,
  connectIntervalMs: 5000,
});
```

- `rmVideoElId`: id of video element for the remote stream.
- `lcVideoElId`: id of video element for the local stream.
- `callingTimeoutMs`: timeout in ms of a media call.
- `connectIntervalMs`: interval in ms of reconnect for a data connection.

## Usage

When the local Peer id (your id) is available, for example on login, initialize `simplePeer`. This will connect the local peer to the Peer server.

```ts
simplePeer.init(lcPeerId);
```

When the local peer id is no longer available, for example on logout, terminate `simplePeer`. This will disconnect the local peer from the Peer server and clear data connections.

```ts
simplePeer.end();
```

When a remote peer is available register it by their Peer id. This will connect the local peer to the remote peer with reconnection set by `connectIntervalMs`.

```ts
simplePeer.addPeerData(rmPeerId);
```

To get the added Peer data:

```ts
simplePeer.getPeerData(rmPeerId);
```

When a remote peer is no longer available unregister it. This will disconnect the local peer from the remote peer and clear the data connection.

```ts
simplePeer.removePeerData(rmPeerId);
```

To send data to the remote peer:

```ts
simplePeer.getPeerData(rmPeerId).sendData("data");
```

To start a media call with the remote peer. The call will be auto-terminated when not accepted during timeout set by `callingTimeoutMs`.

```ts
simplePeer.peerMedia.startCall(rmPeerId);
```

To accept an incoming media call:

```ts
simplePeer.peerMedia.acceptCall();
```

To end an active or pending media call:

```ts
simplePeer.peerMedia.endCall();
```

## Events

The `simplePeer` triggers the following events that you can listen to via `simplePeer.hooks.hook()`.

- `media:call`: triggered on media call request which can be rejected by throwing an error.
- `data:connection`: triggered on data connection request which can be rejected by throwing an error.
- `data:received`: triggered on data reception.
- `media:status`: triggered on change of status of the media call.
  - `active`: media is streaming.
  - `waiting`: pending on the initial peer.
  - `calling`: pending on the other peer.
  - `inactive`: otherwise.

## Development

```bash
# Install dependencies
pnpm i

# rename .example.env to .env

# Run peer server
pnpm peer

# Develop with the playground
pnpm dev
```

## License

[MIT License](./LICENSE)

[npm-version-src]: https://img.shields.io/npm/v/@bg-dev/simple-peerjs/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/@bg-dev/simple-peerjs
[npm-downloads-src]: https://img.shields.io/npm/dt/@bg-dev/simple-peerjs.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/@bg-dev/simple-peerjs
[license-src]: https://img.shields.io/npm/l/@bg-dev/simple-peerjs.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/@bg-dev/simple-peerjs
