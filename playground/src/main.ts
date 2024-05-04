import { SimplePeer } from '../../src'

const lcPeerIdHeading = document.getElementById("lc-peer-id-heading") as HTMLHeadingElement
const receivedDataHeading = document.getElementById("received-data-heading") as HTMLHeadingElement
const mediaStatusHeading = document.getElementById("media-status-heading") as HTMLHeadingElement
const serverConnectedHeading = document.getElementById("server-connected-heading") as HTMLHeadingElement
const rmPeerConnectedHeading = document.getElementById("rm-peer-connected-heading") as HTMLHeadingElement

const rmPeerIdInput = document.getElementById("rm-peer-id-input") as HTMLInputElement
const sendDataInput = document.getElementById("send-data-input") as HTMLInputElement

const rmPeerAddBtn = document.getElementById("rm-peer-add-btn") as HTMLButtonElement
const sendDataBtn = document.getElementById("send-data-btn") as HTMLButtonElement
const callBtn = document.getElementById("call-btn") as HTMLButtonElement
const answerBtn = document.getElementById("answer-btn") as HTMLButtonElement
const hangBtn = document.getElementById("hang-btn") as HTMLButtonElement

const peer = new SimplePeer({
  rmVideoElId: 'rm-video',
  lcVideoElId: 'lc-video',
  host: import.meta.env.VITE_SIMPLE_PEER_HOST,
  port: import.meta.env.VITE_SIMPLE_PEER_PORT,
  path: import.meta.env.VITE_SIMPLE_PEER_PATH 
})

peer.init(crypto.randomUUID())

lcPeerIdHeading.innerText = 'Local Peer Id: ' + peer.lcPeerId
receivedDataHeading.innerText = 'Received data: '

setInterval(() => {
  mediaStatusHeading.innerText = 'Media status: ' + peer.peerMedia?.status
  serverConnectedHeading.innerText = 'Connected to server: ' + peer.connected
  const rmPeerConnected = peer.peerDataMap.get(rmPeerIdInput.value)?.connected ?? false
  rmPeerConnectedHeading.innerText = 'Connected to remote peer: ' + rmPeerConnected
}, 1000)

rmPeerAddBtn.onclick = () => peer.addPeerData(rmPeerIdInput.value)

sendDataBtn.onclick = () => peer.peerDataMap.get(rmPeerIdInput.value)?.sendData(sendDataInput.value)

callBtn.onclick = () => peer.peerMedia?.startCall(rmPeerIdInput.value)

answerBtn.onclick = () => peer.peerMedia?.acceptCall()

hangBtn.onclick = () => peer.peerMedia?.endCall()

peer.hooks.hook('data:received', (_, data) => {
  receivedDataHeading.innerText = 'Received data: ' + data
})

peer.hooks.hook('media:status', (status) => {
  switch (status) {
    case 'inactive':
      callBtn.hidden = false
      answerBtn.hidden = true
      hangBtn.hidden = true
      break;
    case 'calling':
      callBtn.hidden = true
      answerBtn.hidden = false
      hangBtn.hidden = false
      break;
    default:
      callBtn.hidden = true
      answerBtn.hidden = true
      hangBtn.hidden = false
      break;
  }
})