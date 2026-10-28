// CodeHive WebRTC Audio & Video Call Panel (IDE Extension Plan Section 7)
// Manages real-time mesh audio/video calling for up to 4 participants with media toggles
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  PhoneCall,
  Users,
  AlertCircle,
  Volume2,
  Monitor,
  Radio,
  Sparkles,
  Shield,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  fetchIceServersAPI,
  joinCallAPI,
  leaveCallAPI,
  getCallStatusAPI,
  updateMediaStateAPI,
  sendSignalAPI,
  fetchSignalsAPI,
} from '../../services/rtcService';
import { getAuthTokenForRoom, getUidForRoom } from '../../services/collabService';

const DEFAULT_STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export const CallPanel = ({
  roomId,
  currentUser,
  idToken,
  userRole = 'editor',
  isOpen,
  onClose,
}) => {
  const { isDark } = useTheme();

  // Call states
  const [isInCall, setIsInCall] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [, setStreamVersion] = useState(0); // Forces re-render when tracks arrive
  const [myParticipantUid, setMyParticipantUid] = useState(null);

  // WebRTC refs
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // targetUid -> RTCPeerConnection
  const remoteVideosRef = useRef(new Map()); // targetUid -> MediaStream
  const pendingCandidatesRef = useRef(new Map()); // targetUid -> Array<candidate>
  const iceServersRef = useRef(DEFAULT_STUN_SERVERS);
  const signalPollingTimerRef = useRef(null);
  const statusPollingTimerRef = useRef(null);

  // Helper to resolve a valid auth token
  const getToken = useCallback(async () => {
    if (idToken) {
      return idToken.startsWith('Bearer ') ? idToken.replace(/^Bearer /, '') : idToken;
    }
    const tok = await getAuthTokenForRoom(roomId, currentUser);
    return tok ? (tok.startsWith('Bearer ') ? tok.replace(/^Bearer /, '') : tok) : '';
  }, [idToken, roomId, currentUser]);

  // Helper to reliably check if a participant UID is the local user
  const isSelf = useCallback(
    (uid) => {
      if (!uid) return false;
      return (
        uid === myParticipantUid ||
        uid === currentUser?.uid ||
        uid === getUidForRoom(roomId, currentUser)
      );
    },
    [myParticipantUid, currentUser, roomId]
  );

  // Helper to apply any pending ICE candidates received before remoteDescription was set
  const applyPendingCandidates = async (peerUid, pc) => {
    const pending = pendingCandidatesRef.current.get(peerUid) || [];
    for (const cand of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn('[WebRTC] Error applying queued ICE candidate:', err);
      }
    }
    pendingCandidatesRef.current.delete(peerUid);
  };

  // Helper to parse SDP payload safely across browser formats
  const parseSdpPayload = (payload, fallbackType) => {
    if (!payload) return null;
    if (payload.sdp && payload.sdp.type) return payload.sdp;
    if (payload.type && payload.sdp) return payload;
    const sdpStr = typeof payload.sdp === 'string' ? payload.sdp : typeof payload === 'string' ? payload : '';
    return sdpStr ? { type: fallbackType, sdp: sdpStr } : null;
  };

  // Fetch initial call status on mount or room change
  const refreshCallStatus = useCallback(async () => {
    if (!roomId) return;
    try {
      const tok = await getToken();
      const data = await getCallStatusAPI(roomId, tok);
      if (data && data.participants) {
        setParticipants(data.participants);
      }
    } catch (err) {
      // Ignored if offline
    }
  }, [getToken, roomId]);

  useEffect(() => {
    if (!isOpen || !roomId) return;
    refreshCallStatus();
    statusPollingTimerRef.current = setInterval(refreshCallStatus, 4000);
    return () => {
      if (statusPollingTimerRef.current) clearInterval(statusPollingTimerRef.current);
    };
  }, [isOpen, refreshCallStatus, roomId]);

  // Clean up WebRTC peer connections and local media tracks
  const cleanupCall = useCallback(() => {
    // 1. Stop all tracks in local media stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    // 2. Close and destroy all RTCPeerConnections
    peerConnectionsRef.current.forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();
    remoteVideosRef.current.clear();
    pendingCandidatesRef.current.clear();

    // 3. Clear signalling polling timer
    if (signalPollingTimerRef.current) {
      clearInterval(signalPollingTimerRef.current);
      signalPollingTimerRef.current = null;
    }

    setIsInCall(false);
    setIsJoining(false);
    setIsScreenSharing(false);
    setMyParticipantUid(null);
  }, []);

  // 1. Initialize or obtain RTCPeerConnection for a specific remote peer
  const getOrCreatePeerConnection = useCallback(
    (targetUid) => {
      if (peerConnectionsRef.current.has(targetUid)) {
        return peerConnectionsRef.current.get(targetUid);
      }

      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current,
      });

      // Add local media tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE candidates generated by browser
      pc.onicecandidate = async (event) => {
        if (event.candidate && roomId) {
          try {
            const tok = await getToken();
            await sendSignalAPI({
              roomId,
              targetUid,
              type: 'candidate',
              payload: { candidate: event.candidate },
              idToken: tok,
            });
          } catch (e) {
            // Non-fatal if candidate transmission fails momentarily
          }
        }
      };

      // Handle incoming remote media tracks (Audio & Video)
      pc.ontrack = (event) => {
        let stream = event.streams && event.streams[0];
        if (!stream) {
          if (!remoteVideosRef.current.has(targetUid)) {
            remoteVideosRef.current.set(targetUid, new MediaStream());
          }
          stream = remoteVideosRef.current.get(targetUid);
          stream.addTrack(event.track);
        } else {
          remoteVideosRef.current.set(targetUid, stream);
        }
        setStreamVersion((v) => v + 1); // Trigger re-render to attach audio/video elements
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed') {
          console.warn(`[WebRTC] Connection failed with peer ${targetUid}, restarting ICE.`);
          pc.restartIce?.();
        }
      };

      peerConnectionsRef.current.set(targetUid, pc);
      return pc;
    },
    [getToken, roomId]
  );

  // 2. Process incoming WebRTC signals (Offers, Answers, ICE candidates)
  const processIncomingSignals = useCallback(async () => {
    if (!roomId || !isInCall) return;

    try {
      const tok = await getToken();
      const signals = await fetchSignalsAPI({ roomId, idToken: tok });
      if (!signals || signals.length === 0) return;

      for (const sig of signals) {
        const { senderUid, type, payload } = sig;
        if (!senderUid || !payload || isSelf(senderUid)) continue;

        const pc = getOrCreatePeerConnection(senderUid);

        if (type === 'offer') {
          // Received SDP Offer: set remote desc, apply queued ICE, and send SDP Answer
          const sdpDesc = parseSdpPayload(payload, 'offer');
          if (sdpDesc) {
            if (pc.signalingState !== 'stable') {
              await Promise.all([
                pc.setLocalDescription({ type: 'rollback' }).catch(() => {}),
                pc.setRemoteDescription(new RTCSessionDescription(sdpDesc)),
              ]);
            } else {
              await pc.setRemoteDescription(new RTCSessionDescription(sdpDesc));
            }

            await applyPendingCandidates(senderUid, pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await sendSignalAPI({
              roomId,
              targetUid: senderUid,
              type: 'answer',
              payload: { sdp: pc.localDescription },
              idToken: tok,
            });
          }
        } else if (type === 'answer') {
          // Received SDP Answer
          const sdpDesc = parseSdpPayload(payload, 'answer');
          if (sdpDesc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(sdpDesc));
            await applyPendingCandidates(senderUid, pc);
          }
        } else if (type === 'candidate' && payload.candidate) {
          // Received ICE Candidate
          if (!pc.remoteDescription) {
            // Queue until remoteDescription is set to prevent InvalidStateError
            if (!pendingCandidatesRef.current.has(senderUid)) {
              pendingCandidatesRef.current.set(senderUid, []);
            }
            pendingCandidatesRef.current.get(senderUid).push(payload.candidate);
          } else {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.warn('[WebRTC] Error adding ICE candidate:', e.message);
            }
          }
        } else if (type === 'call-ended') {
          pc.close();
          peerConnectionsRef.current.delete(senderUid);
          remoteVideosRef.current.delete(senderUid);
          pendingCandidatesRef.current.delete(senderUid);
          setParticipants((prev) => prev.filter((p) => p.uid !== senderUid));
        }
      }
    } catch (err) {
      // Non-fatal during rapid polling
    }
  }, [getOrCreatePeerConnection, getToken, isInCall, isSelf, roomId]);

  // Fast polling for incoming signals while in call (every 800ms for swift negotiation)
  useEffect(() => {
    if (isInCall && roomId) {
      processIncomingSignals();
      signalPollingTimerRef.current = setInterval(processIncomingSignals, 800);
    } else {
      if (signalPollingTimerRef.current) {
        clearInterval(signalPollingTimerRef.current);
        signalPollingTimerRef.current = null;
      }
    }
    return () => {
      if (signalPollingTimerRef.current) clearInterval(signalPollingTimerRef.current);
    };
  }, [isInCall, processIncomingSignals, roomId]);

  // 3. Initiate call connection to peers
  const initiateConnectionsToPeers = useCallback(
    async (activePeers) => {
      const tok = await getToken();
      for (const peer of activePeers) {
        if (isSelf(peer.uid)) continue;
        const pc = getOrCreatePeerConnection(peer.uid);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          await sendSignalAPI({
            roomId,
            targetUid: peer.uid,
            type: 'offer',
            payload: { sdp: pc.localDescription },
            idToken: tok,
          });
        } catch (err) {
          console.warn(`[WebRTC] Failed to create offer for peer ${peer.uid}:`, err.message);
        }
      }
    },
    [getOrCreatePeerConnection, getToken, isSelf, roomId]
  );

  // 4. Handle Joining the Call
  const handleJoinCall = async () => {
    if (!roomId) {
      setErrorMessage('Please join or create a collaboration room first.');
      return;
    }
    setIsJoining(true);
    setErrorMessage('');

    try {
      const tok = await getToken();

      // Fetch ICE configuration with fallback
      try {
        const iceServers = await fetchIceServersAPI(tok);
        if (iceServers && iceServers.length > 0) {
          iceServersRef.current = iceServers;
        }
      } catch (iceErr) {
        iceServersRef.current = DEFAULT_STUN_SERVERS;
      }

      // Request media stream (Audio by default, Camera optional)
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideoEnabled ? { width: 640, height: 360 } : false,
        });
      } catch (mediaErr) {
        console.warn('Camera/Mic permission warning, falling back to audio only or mock:', mediaErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsVideoEnabled(false);
        } catch (audioErr) {
          // Headless / permission-denied environment fallback: generate silent audio stream
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            const osc = audioCtx.createOscillator();
            const dst = audioCtx.createMediaStreamDestination();
            osc.connect(dst);
            osc.start();
            stream = dst.stream;
          } else {
            stream = new MediaStream();
          }
        }
      }

      localStreamRef.current = stream;
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }

      // Join room call on backend
      const res = await joinCallAPI({
        roomId,
        audio: !isAudioMuted,
        video: isVideoEnabled,
        idToken: tok,
      });

      if (res.participant?.uid) {
        setMyParticipantUid(res.participant.uid);
      }

      setIsInCall(true);
      setParticipants(res.participants || []);

      // Initiate WebRTC connections with all other existing participants
      await initiateConnectionsToPeers(res.participants || []);
    } catch (err) {
      setErrorMessage(err.message || 'Could not join audio/video call.');
      cleanupCall();
    } finally {
      setIsJoining(false);
    }
  };

  // 5. Handle Leaving the Call
  const handleLeaveCall = async () => {
    if (!roomId) return;
    try {
      const tok = await getToken();
      // Notify all connected peers that we are disconnecting
      for (const peerUid of peerConnectionsRef.current.keys()) {
        sendSignalAPI({
          roomId,
          targetUid: peerUid,
          type: 'call-ended',
          payload: { reason: 'Peer left the call' },
          idToken: tok,
        }).catch(() => {});
      }
      await leaveCallAPI({ roomId, idToken: tok });
    } catch (err) {
      console.warn('Error during leave call API:', err.message);
    } finally {
      cleanupCall();
      refreshCallStatus();
    }
  };

  // 6. Toggle Microphone Mute
  const handleToggleAudio = async () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    if (isInCall && roomId) {
      const tok = await getToken();
      await updateMediaStateAPI({
        roomId,
        audio: !nextMuted,
        video: isVideoEnabled,
        idToken: tok,
      }).catch(() => {});
    }
  };

  // 7. Toggle Camera with proper Renegotiation
  const handleToggleVideo = async () => {
    const nextVideo = !isVideoEnabled;
    setIsVideoEnabled(nextVideo);

    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => {
          track.enabled = nextVideo;
        });
      } else if (nextVideo) {
        // Need to acquire video track
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 360 },
          });
          const newVideoTrack = videoStream.getVideoTracks()[0];
          localStreamRef.current.addTrack(newVideoTrack);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }

          // Add track to all active peer connections AND trigger renegotiation
          const tok = await getToken();
          for (const [peerUid, pc] of peerConnectionsRef.current.entries()) {
            try {
              pc.addTrack(newVideoTrack, localStreamRef.current);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);

              await sendSignalAPI({
                roomId,
                targetUid: peerUid,
                type: 'offer',
                payload: { sdp: pc.localDescription },
                idToken: tok,
              });
            } catch (renegErr) {
              console.warn(`[WebRTC] Renegotiation offer failed for peer ${peerUid}:`, renegErr.message);
            }
          }
        } catch (err) {
          console.warn('Could not turn on camera:', err.message);
          setIsVideoEnabled(false);
          setErrorMessage('Camera access was denied or is unavailable.');
        }
      }
    }

    if (isInCall && roomId) {
      const tok = await getToken();
      await updateMediaStateAPI({
        roomId,
        audio: !isAudioMuted,
        video: nextVideo,
        idToken: tok,
      }).catch(() => {});
    }
  };

  // 8. Toggle Screen Sharing with Renegotiation
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);

        const screenTrack = stream.getVideoTracks()[0];
        screenTrack.onended = () => {
          setIsScreenSharing(false);
        };

        // Add track to peer connections and renegotiate
        const tok = await getToken();
        for (const [peerUid, pc] of peerConnectionsRef.current.entries()) {
          try {
            pc.addTrack(screenTrack, stream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await sendSignalAPI({
              roomId,
              targetUid: peerUid,
              type: 'offer',
              payload: { sdp: pc.localDescription },
              idToken: tok,
            });
          } catch (err) {
            console.warn(`Screen share renegotiation failed for peer ${peerUid}:`, err.message);
          }
        }
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err.message);
      }
    }
  };

  // Auto clean up when component unmounts
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  if (!isOpen) return null;

  const remotePeers = participants.filter((p) => !isSelf(p.uid));

  return (
    <div className={`codehive-call-container ${isMinimized ? 'minimized' : ''} ${isDark ? 'dark' : 'light'}`}>
      {/* Call Header */}
      <div className="call-header">
        <div className="call-header-left">
          <div className="call-live-indicator">
            <Radio size={14} className={isInCall ? 'text-emerald animate-pulse' : 'text-slate'} />
          </div>
          <div>
            <div className="call-title-row">
              <span className="call-title font-brand">Room Voice & Video Call</span>
              <span className="call-count-pill font-code">
                {participants.length}/4 IN CALL
              </span>
            </div>
            <p className="call-subtitle">
              Peer-to-peer WebRTC mesh collaboration (up to 4 participants)
            </p>
          </div>
        </div>

        <div className="call-header-actions">
          <button
            type="button"
            className="btn-call-tool"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand Call' : 'Minimize Call'}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            type="button"
            className="btn-call-tool"
            onClick={onClose}
            title="Close Call Bar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Error Banner */}
          {errorMessage && (
            <div className="call-error-banner font-code">
              <AlertCircle size={14} className="text-red" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Video Grid Tiles (Up to 4 participants) */}
          <div className="call-tiles-grid">
            {/* Local User Tile */}
            <div className={`call-tile local-tile ${isInCall ? 'active' : 'idle'}`}>
              {isVideoEnabled && localStreamRef.current?.getVideoTracks()?.length > 0 ? (
                <video
                  ref={(el) => {
                    localVideoRef.current = el;
                    if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                      el.srcObject = localStreamRef.current;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="tile-video mirrored"
                />
              ) : (
                <div className="tile-avatar-view">
                  <div className={`tile-avatar ${!isAudioMuted && isInCall ? 'speaking-pulse' : ''}`}>
                    {currentUser?.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'ME'}
                  </div>
                </div>
              )}

              <div className="tile-footer font-code">
                <span className="tile-name">You ({userRole})</span>
                <div className="tile-indicators">
                  {isAudioMuted ? (
                    <MicOff size={13} className="text-red" />
                  ) : (
                    <Mic size={13} className="text-emerald" />
                  )}
                  {isVideoEnabled ? (
                    <Video size={13} className="text-emerald" />
                  ) : (
                    <VideoOff size={13} className="text-slate" />
                  )}
                </div>
              </div>
            </div>

            {/* Remote Peer Tiles */}
            {remotePeers.map((peer) => {
              const remoteStream = remoteVideosRef.current.get(peer.uid);
              const hasVideo = peer.video && remoteStream?.getVideoTracks()?.length > 0;

              return (
                <div key={peer.uid} className="call-tile remote-tile active">
                  {/* Dedicated Audio Element ensures incoming speech is ALWAYS audible */}
                  <audio
                    autoPlay
                    playsInline
                    ref={(el) => {
                      if (el && remoteStream && el.srcObject !== remoteStream) {
                        el.srcObject = remoteStream;
                        el.play().catch(() => {});
                      }
                    }}
                  />

                  {hasVideo ? (
                    <video
                      autoPlay
                      playsInline
                      ref={(el) => {
                        if (el && remoteStream && el.srcObject !== remoteStream) {
                          el.srcObject = remoteStream;
                        }
                      }}
                      className="tile-video"
                    />
                  ) : (
                    <div className="tile-avatar-view">
                      <div className={`tile-avatar ${peer.audio ? 'speaking-pulse' : ''}`}>
                        {peer.name ? peer.name.slice(0, 2).toUpperCase() : 'PE'}
                      </div>
                    </div>
                  )}

                  <div className="tile-footer font-code">
                    <span className="tile-name">{peer.name || 'Peer'}</span>
                    <div className="tile-indicators">
                      {peer.audio ? (
                        <Mic size={13} className="text-emerald" />
                      ) : (
                        <MicOff size={13} className="text-red" />
                      )}
                      {peer.video ? (
                        <Video size={13} className="text-emerald" />
                      ) : (
                        <VideoOff size={13} className="text-slate" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty Participant Placeholders to visualize mesh limit of 4 */}
            {Array.from({ length: Math.max(0, 4 - Math.max(1, remotePeers.length + 1)) }).map((_, i) => (
              <div key={`empty-${i}`} className="call-tile empty-tile font-code">
                <Users size={20} className="text-slate opacity-40" />
                <span>Slot {remotePeers.length + i + 2} Open</span>
              </div>
            ))}
          </div>

          {/* Action Controls Bar */}
          <div className="call-controls-bar">
            {isInCall ? (
              <>
                <button
                  type="button"
                  className={`btn-media-ctrl ${isAudioMuted ? 'muted' : 'active'}`}
                  onClick={handleToggleAudio}
                  title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isAudioMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  <span>{isAudioMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button
                  type="button"
                  className={`btn-media-ctrl ${isVideoEnabled ? 'active' : ''}`}
                  onClick={handleToggleVideo}
                  title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                  <span>{isVideoEnabled ? 'Stop Video' : 'Start Video'}</span>
                </button>

                <button
                  type="button"
                  className={`btn-media-ctrl ${isScreenSharing ? 'active' : ''}`}
                  onClick={handleToggleScreenShare}
                  title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                  <Monitor size={16} />
                  <span>{isScreenSharing ? 'Sharing' : 'Share Screen'}</span>
                </button>

                <button
                  type="button"
                  className="btn-leave-call"
                  onClick={handleLeaveCall}
                  title="Leave Call"
                >
                  <PhoneOff size={16} />
                  <span>Leave Call</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-join-call font-brand"
                onClick={handleJoinCall}
                disabled={isJoining}
              >
                <PhoneCall size={16} className="animate-bounce" />
                <span>{isJoining ? 'Connecting to Mesh...' : 'Join Voice & Video Call'}</span>
              </button>
            )}
          </div>
        </>
      )}

      <style>{`
        .codehive-call-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: min(520px, calc(100vw - 24px));
          max-height: calc(100vh - 48px);
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          z-index: 1000 !important;
          overflow: hidden;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
        }
        .codehive-call-container.dark {
          background: #252526;
          border-color: #333333;
          color: #f8fafc;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }
        .codehive-call-container.minimized {
          width: 320px;
        }
        .call-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .dark .call-header {
          background: #181818;
          border-color: #2b2b2b;
        }
        .call-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .call-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .call-title {
          font-size: 0.88rem;
          font-weight: 700;
        }
        .call-count-pill {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 12px;
          background: #e0e7ff;
          color: #4338ca;
        }
        .dark .call-count-pill {
          background: #312e81;
          color: #c7d2fe;
        }
        .call-subtitle {
          font-size: 0.72rem;
          color: #64748b;
          margin: 0;
        }
        .call-header-actions {
          display: flex;
          gap: 6px;
        }
        .btn-call-tool {
          background: transparent;
          border: none;
          color: #64748b;
          padding: 5px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-call-tool:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .dark .btn-call-tool:hover {
          background: #2a2d2e;
          color: #ffffff;
        }
        .call-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #fef2f2;
          border-bottom: 1px solid #fecaca;
          color: #b91c1c;
          font-size: 0.75rem;
        }
        .call-tiles-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 12px;
          background: #1e1e1e;
          min-height: 220px;
        }
        .call-tile {
          position: relative;
          background: #252526;
          border: 1px solid #333333;
          border-radius: 12px;
          overflow: hidden;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .call-tile.active {
          border-color: #3b82f6;
        }
        .tile-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tile-video.mirrored {
          transform: scaleX(-1);
        }
        .tile-avatar-view {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .tile-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
          color: #ffffff;
          font-weight: 800;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s ease;
        }
        .tile-avatar.speaking-pulse {
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.4);
          animation: audioPulse 1.2s infinite;
        }
        @keyframes audioPulse {
          0% { box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.8); }
          100% { box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4); }
        }
        .tile-footer {
          position: absolute;
          bottom: 6px;
          left: 8px;
          right: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(4px);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.68rem;
          color: #f8fafc;
        }
        .tile-indicators {
          display: flex;
          gap: 5px;
        }
        .empty-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1.5px dashed #334155;
          background: rgba(30, 41, 59, 0.4);
          color: #64748b;
          font-size: 0.72rem;
        }
        .call-controls-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
        }
        .dark .call-controls-bar {
          background: #0f172a;
          border-color: #1e293b;
        }
        .btn-media-ctrl {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 50px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          color: #334155;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dark .btn-media-ctrl {
          background: #1e293b;
          border-color: #334155;
          color: #f8fafc;
        }
        .btn-media-ctrl.active {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #059669;
        }
        .btn-media-ctrl.muted {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }
        .btn-leave-call {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 50px;
          border: none;
          background: #ef4444;
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.35);
          transition: all 0.18s ease;
        }
        .btn-leave-call:hover {
          background: #dc2626;
        }
        .btn-join-call {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 26px;
          border-radius: 50px;
          border: none;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          font-size: 0.88rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
          transition: all 0.2s ease;
        }
        .btn-join-call:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
        }
        .btn-join-call:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .codehive-call-container {
            bottom: 12px;
            right: 12px;
            width: calc(100vw - 24px);
          }
          .call-tiles-grid {
            grid-template-columns: 1fr;
            min-height: 180px;
          }
          .call-tile {
            height: 110px;
          }
        }
      `}</style>
    </div>
  );
};
