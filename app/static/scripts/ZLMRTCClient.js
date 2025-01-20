// ZLMRTCClient.js

class EventEmitter {
	constructor() {
	  this.events = {};
	}
  
	on(event, listener) {
	  if (!this.events[event]) this.events[event] = [];
	  this.events[event].push(listener);
	}
  
	off(event, listener) {
	  if (!this.events[event]) return;
	  const idx = this.events[event].indexOf(listener);
	  if (idx > -1) this.events[event].splice(idx, 1);
	}
  
	emit(event, ...args) {
	  if (!this.events[event]) return;
	  this.events[event].forEach(listener => listener(...args));
	}
  }
  
  class AudioTrackConstraints {
	constructor(source) {
	  if (!['mic', 'screen-cast', 'file', 'mixed'].includes(source)) {
		throw new TypeError('Invalid audio source.');
	  }
	  this.source = source;
	  this.deviceId = undefined;
	}
  }
  
  class VideoTrackConstraints {
	constructor(source) {
	  if (!['camera', 'screen-cast', 'file', 'mixed'].includes(source)) {
		throw new TypeError('Invalid video source.');
	  }
	  this.source = source;
	  this.deviceId = undefined;
	  this.resolution = undefined;
	  this.frameRate = undefined;
	}
  }
  
  class Resolution {
	constructor(width, height) {
	  this.width = width;
	  this.height = height;
	}
  }
  
  class StreamConstraints {
	constructor(audioConstraints = false, videoConstraints = false) {
	  this.audio = audioConstraints;
	  this.video = videoConstraints;
	}
  }
  
  class MediaStreamFactory {
	static createMediaStream(constraints) {
	  if (typeof constraints !== 'object' || (!constraints.audio && !constraints.video)) {
		return Promise.reject(new TypeError('Invalid constraints'));
	  }
  
	  const mediaConstraints = {};
	  if (constraints.audio) {
		mediaConstraints.audio = constraints.audio.source === 'mic' ? { deviceId: { exact: constraints.audio.deviceId } } : constraints.audio.source === 'screen-cast';
	  }
	  if (constraints.video) {
		mediaConstraints.video = constraints.video.source === 'camera' ? { deviceId: { exact: constraints.video.deviceId }, width: constraints.video.resolution ? constraints.video.resolution.width : undefined, height: constraints.video.resolution ? constraints.video.resolution.height : undefined } : constraints.video.source === 'screen-cast';
	  }
  
	  if (constraints.video && constraints.video.source === 'screen-cast') {
		return navigator.mediaDevices.getDisplayMedia(mediaConstraints);
	  } else {
		return navigator.mediaDevices.getUserMedia(mediaConstraints);
	  }
	}
  }
  
  const Events = {
	WEBRTC_ON_REMOTE_STREAMS: 'WEBRTC_ON_REMOTE_STREAMS',
	WEBRTC_ON_CONNECTION_STATE_CHANGE: 'WEBRTC_ON_CONNECTION_STATE_CHANGE',
	WEBRTC_ICE_CANDIDATE_ERROR: 'WEBRTC_ICE_CANDIDATE_ERROR',
	WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED: 'WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED'
  };
  
  // 使用 Axios 进行 HTTP 请求
  // 请确保已经引入 Axios 库，或在此处添加 Axios 的精简版本
  // 这里假设 Axios 已经被引入为 axios
  
  class RTCEndpoint extends EventEmitter {
	constructor(options) {
	  super();
	  this.TAG = '[RTCPusherPlayer]';
	  this.options = Object.assign({
		element: null,
		debug: false,
		zlmsdpUrl: '',
		simulcast: false,
		useCamera: true,
		audioEnable: true,
		videoEnable: true,
		recvOnly: false,
		resolution: { w: 0, h: 0 },
		usedatachannel: false,
		videoId: '',
		audioId: ''
	  }, options);
  
	  if (this.options.debug) {
		console.log = console.log.bind(console);
		console.error = console.error.bind(console);
	  }
  
	  this._remoteStream = null;
	  this._localStream = null;
	  this._tracks = [];
	  this.pc = new RTCPeerConnection();
  
	  this.pc.onicecandidate = this._onIceCandidate.bind(this);
	  this.pc.onicecandidateerror = this._onIceCandidateError.bind(this);
	  this.pc.ontrack = this._onTrack.bind(this);
	  this.pc.onconnectionstatechange = this._onConnectionStateChange.bind(this);
  
	  this.datachannel = null;
	  if (this.options.usedatachannel) {
		this.datachannel = this.pc.createDataChannel('chat');
		this.datachannel.onclose = this._onDataChannelClose.bind(this);
		this.datachannel.onerror = this._onDataChannelError.bind(this);
		this.datachannel.onmessage = this._onDataChannelMessage.bind(this);
		this.datachannel.onopen = this._onDataChannelOpen.bind(this);
	  }
  
	  if (!this.options.recvOnly && (this.options.audioEnable || this.options.videoEnable)) {
		this.start();
	  } else {
		this.receive();
	  }
	}
  
	receive() {
	  const AudioTransceiverInit = {
		direction: 'recvonly'
	  };
	  const VideoTransceiverInit = {
		direction: 'recvonly'
	  };
  
	  if (this.options.videoEnable) {
		this.pc.addTransceiver('video', VideoTransceiverInit);
	  }
	  if (this.options.audioEnable) {
		this.pc.addTransceiver('audio', AudioTransceiverInit);
	  }
  
	  this.pc.createOffer().then(desc => {
		if (this.options.debug) console.log(this.TAG, 'Offer SDP:', desc.sdp);
		return this.pc.setLocalDescription(desc);
	  }).then(() => {
		return axios.post(this.options.zlmsdpUrl, this.pc.localDescription.sdp, {
		  headers: { 'Content-Type': 'text/plain;charset=utf-8' }
		});
	  }).then(response => {
		const ret = response.data;
		if (ret.code !== 0) {
		  this.emit(Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED, ret);
		  return;
		}
		const answer = {
		  type: 'answer',
		  sdp: ret.sdp
		};
		if (this.options.debug) console.log(this.TAG, 'Answer SDP:', answer.sdp);
		return this.pc.setRemoteDescription(answer);
	  }).then(() => {
		if (this.options.debug) console.log(this.TAG, 'Remote description set successfully.');
	  }).catch(e => {
		if (this.options.debug) console.error(this.TAG, e);
	  });
	}
  
	start() {
	  let videoConstraints = false;
	  let audioConstraints = false;
  
	  if (this.options.useCamera) {
		if (this.options.videoEnable) videoConstraints = new VideoTrackConstraints('camera');
		if (this.options.audioEnable) audioConstraints = new AudioTrackConstraints('mic');
		if (videoConstraints && this.options.videoId) {
		  videoConstraints.deviceId = this.options.videoId;
		}
		if (audioConstraints && this.options.audioId) {
		  audioConstraints.deviceId = this.options.audioId;
		}
	  } else {
		if (this.options.videoEnable) {
		  videoConstraints = new VideoTrackConstraints('screen-cast');
		  if (this.options.audioEnable) audioConstraints = new AudioTrackConstraints('screen-cast');
		} else {
		  if (this.options.audioEnable) {
			audioConstraints = new AudioTrackConstraints('mic');
		  } else {
			console.error(this.TAG, 'Error: At least audio or video must be enabled.');
		  }
		  if (audioConstraints && this.options.audioId) {
			audioConstraints.deviceId = this.options.audioId;
		  }
		}
	  }
  
	  if (videoConstraints && this.options.resolution.w !== 0 && this.options.resolution.h !== 0) {
		videoConstraints.resolution = new Resolution(this.options.resolution.w, this.options.resolution.h);
	  }
  
	  MediaStreamFactory.createMediaStream(new StreamConstraints(audioConstraints, videoConstraints))
		.then(stream => {
		  this._localStream = stream;
		  this.emit('WEBRTC_ON_LOCAL_STREAM', stream);
  
		  const AudioTransceiverInit = {
			direction: 'sendrecv'
		  };
		  const VideoTransceiverInit = {
			direction: 'sendrecv'
		  };
  
		  if (this.options.simulcast && stream.getVideoTracks().length > 0) {
			VideoTransceiverInit.sendEncodings = [
			  { rid: 'h', active: true, maxBitrate: 1000000 },
			  { rid: 'm', active: true, maxBitrate: 500000, scaleResolutionDownBy: 2 },
			  { rid: 'l', active: true, maxBitrate: 200000, scaleResolutionDownBy: 4 }
			];
		  }
  
		  if (this.options.audioEnable) {
			if (stream.getAudioTracks().length > 0) {
			  this.pc.addTransceiver(stream.getAudioTracks()[0], AudioTransceiverInit);
			} else {
			  AudioTransceiverInit.direction = 'recvonly';
			  this.pc.addTransceiver('audio', AudioTransceiverInit);
			}
		  }
  
		  if (this.options.videoEnable) {
			if (stream.getVideoTracks().length > 0) {
			  this.pc.addTransceiver(stream.getVideoTracks()[0], VideoTransceiverInit);
			} else {
			  VideoTransceiverInit.direction = 'recvonly';
			  this.pc.addTransceiver('video', VideoTransceiverInit);
			}
		  }
  
		  this.pc.createOffer().then(desc => {
			if (this.options.debug) console.log(this.TAG, 'Offer SDP:', desc.sdp);
			return this.pc.setLocalDescription(desc);
		  }).then(() => {
			return axios.post(this.options.zlmsdpUrl, this.pc.localDescription.sdp, {
			  headers: { 'Content-Type': 'text/plain;charset=utf-8' }
			});
		  }).then(response => {
			const ret = response.data;
			if (ret.code !== 0) {
			  this.emit(Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED, ret);
			  return;
			}
			const answer = {
			  type: 'answer',
			  sdp: ret.sdp
			};
			if (this.options.debug) console.log(this.TAG, 'Answer SDP:', answer.sdp);
			return this.pc.setRemoteDescription(answer);
		  }).then(() => {
			if (this.options.debug) console.log(this.TAG, 'Remote description set successfully.');
		  }).catch(e => {
			this.emit('CAPTURE_STREAM_FAILED');
			if (this.options.debug) console.error(this.TAG, e);
		  });
		}).catch(e => {
		  this.emit('CAPTURE_STREAM_FAILED');
		  if (this.options.debug) console.error(this.TAG, e);
		});
	}
  
	_onIceCandidate(event) {
	  if (event.candidate && this.options.debug) {
		console.log(this.TAG, 'New ICE candidate:', event.candidate.candidate);
		// 这里可以将 ICE candidate 发送到服务器或处理
	  }
	}
  
	_onIceCandidateError(event) {
	  this.emit(Events.WEBRTC_ICE_CANDIDATE_ERROR, event);
	}
  
	_onTrack(event) {
	  this._tracks.push(event.track);
	  if (this.options.element && event.streams && event.streams.length > 0) {
		this.options.element.srcObject = event.streams[0];
		this._remoteStream = event.streams[0];
		this.emit(Events.WEBRTC_ON_REMOTE_STREAMS, this._remoteStream);
	  } else {
		if (this.pc.getReceivers().length === this._tracks.length) {
		  if (this.options.element) {
			this._remoteStream = new MediaStream(this._tracks);
			this.options.element.srcObject = this._remoteStream;
			this.emit(Events.WEBRTC_ON_REMOTE_STREAMS, this._remoteStream);
		  }
		} else {
		  if (this.options.debug) console.error(this.TAG, 'Waiting for all stream tracks to finish.');
		}
	  }
	}
  
	_onConnectionStateChange(event) {
	  this.emit(Events.WEBRTC_ON_CONNECTION_STATE_CHANGE, this.pc.connectionState);
	}
  
	_onDataChannelOpen(event) {
	  if (this.options.debug) console.log(this.TAG, 'Data channel opened:', event);
	  this.emit('WEBRTC_ON_DATA_CHANNEL_OPEN', event);
	}
  
	_onDataChannelMessage(event) {
	  if (this.options.debug) console.log(this.TAG, 'Data channel message:', event);
	  this.emit('WEBRTC_ON_DATA_CHANNEL_MSG', event);
	}
  
	_onDataChannelError(event) {
	  if (this.options.debug) console.error(this.TAG, 'Data channel error:', event);
	  this.emit('WEBRTC_ON_DATA_CHANNEL_ERR', event);
	}
  
	_onDataChannelClose(event) {
	  if (this.options.debug) console.log(this.TAG, 'Data channel closed:', event);
	  this.emit('WEBRTC_ON_DATA_CHANNEL_CLOSE', event);
	}
  
	sendMsg(data) {
	  if (this.datachannel) {
		this.datachannel.send(data);
	  } else {
		if (this.options.debug) console.error(this.TAG, 'Data channel is not open.');
	  }
	}
  
	close() {
	  if (this.datachannel) {
		this.datachannel.close();
		this.datachannel = null;
	  }
	  if (this.pc) {
		this.pc.close();
		this.pc = null;
	  }
	  if (this._localStream) {
		this._localStream.getTracks().forEach(track => track.stop());
		this._localStream = null;
	  }
	  if (this._remoteStream) {
		this._remoteStream.getTracks().forEach(track => track.stop());
		this._remoteStream = null;
	  }
	  this._tracks = [];
	}
  }
  
  const ZLMRTCClient = {
	Endpoint: RTCEndpoint,
	Events: Events
  };
  
  window.ZLMRTCClient = ZLMRTCClient;
  