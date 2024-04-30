import { PeerServer } from 'peer'

const peerServer = PeerServer({ port: 9000, path: '/peer' })

peerServer.listen(() => console.log('Peer server running...'))
