// hooks/useWebRTCCall.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  doc,
  collection,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  getDoc,
  DocumentReference,
  FirestoreError,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";

type Member = any;

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useWebRTCCall({ currentuserIs }: { currentuserIs: { id: string; name?: string } }) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElems = useRef<Record<string, HTMLVideoElement | null>>({});
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const inboundStreams = useRef<Record<string, MediaStream>>({});
  const unsubRef = useRef<Array<() => void>>([]);
  const callDocRef = useRef<DocumentReference | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
const {user, userData} = useAuth();
  const [isCalling, setIsCalling] = useState(false);
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [videoOn, setVideoOn] = useState<Record<string, boolean>>({});
  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<"ringing" | "active" | "ended" | null>(null);
  const [caller, setCaller] = useState<{ id: string; name?: string } | null>(null);
const [ID, setId] = useState<any>()
  // Normalize ID helper
  const normalize = (id: any) => (id === undefined || id === null ? String(id) : String(id));

 const getRemoteVideoRef = useCallback((peerId: string) => {
  const pid = normalize(peerId);
  return (el: HTMLVideoElement | null) => {
    // store ref (null allowed when unmounting)
    remoteVideoElems.current[pid] = el;

    // Try to attach any already-received inbound stream
    const s = inboundStreams.current[pid];
    if (el && s) {
      try {
        if (el.srcObject !== s) el.srcObject = s;
        // try play but ignore errors (autoplay policy)
        el.play().catch(() => {});
      } catch (err) {
        console.warn("attach remote video failed", err);
      }
    }
  };
}, []);


  const startLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

  
    const stream = await navigator.mediaDevices?.getUserMedia({ audio: true, video: true });
    stream.getVideoTracks().forEach(track => track.enabled = true);
stream.getAudioTracks().forEach(track => track.enabled = true);

    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      await localVideoRef.current.play().catch(() => {});
    }
    setVideoOn((p) => ({ ...p, [normalize(currentuserIs?.id)]: true }));
    setMuted((p) => ({ ...p, [normalize(currentuserIs?.id)]: false }));
    return stream;
  }, [currentuserIs?.id]);
const candidateQueue = useRef<Record<string, RTCIceCandidateInit[]>>({});

const createPeerConnection = useCallback(
  async (
    pairKey: string,
    remotePeerId: string,
    isCaller: boolean,
    callRef: DocumentReference | null
  ) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    const pid = normalize(remotePeerId);

    // debug handlers
    pc.onconnectionstatechange = () => {
      // optional: more detailed logging if you need it
      // console.log("pc.connectionState", pid, pc.connectionState);
    };
    pc.oniceconnectionstatechange = () => {
      // console.log("pc.iceConnectionState", pid, pc.iceConnectionState);
    };

    // ensure local stream exists (fallback)
    let localStream = localStreamRef.current;
    if (!localStream) {
      console.warn("No local stream yet - attempting fallback getUserMedia");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        localStream = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("getUserMedia fallback failed:", err);
      }
    }

    // add local tracks (if available)
    if (localStream) {
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }
    } else {
      // still continue — remote could be audio-only or we can handle later
      console.warn("Still no local stream — pc created without local tracks");
    }

    // when remote track arrives — compose stream and attach (retry if DOM not yet mounted)
    pc.ontrack = (ev) => {
      const remoteStream = inboundStreams.current[pid] ?? new MediaStream();

      if (ev.streams && ev.streams.length > 0) {
        inboundStreams.current[pid] = ev.streams[0];
      } else if (ev.track) {
        remoteStream.addTrack(ev.track);
        inboundStreams.current[pid] = remoteStream;
      }

      // attach safely with retries (stops when element available)
      let tries = 0;
      const tryAttach = () => {
        tries++;
        const el = remoteVideoElems.current[pid];
        const s = inboundStreams.current[pid];
        if (el && s) {
          try {
            if (el.srcObject !== s) el.srcObject = s;
            el.play().catch(() => {});
          } catch (err) {
            console.warn("attach remote stream error:", err);
          }
          return;
        }
        if (tries < 20) {
          // retry up to ~5s (20 * 250ms)
          setTimeout(tryAttach, 250);
        } else {
          // give up gracefully
          console.warn("give up attaching remote stream for", pid);
        }
      };
      tryAttach();
    };

    // onicecandidate: write to Firestore
    pc.onicecandidate = async (ev) => {
      if (!ev.candidate || !callRef) return;
      try {
        const cand = ev.candidate.toJSON();
        const colName = isCaller ? `callerCandidates_${pairKey}` : `calleeCandidates_${pairKey}`;
        await addDoc(collection(callRef, colName), cand);
      } catch (err) {
        console.warn("add candidate failed", err);
      }
    };

    // store pc
    pcsRef.current[pid] = pc;
    // ensure a queue entry exists
    candidateQueue.current[pid] = candidateQueue.current[pid] || [];

    return pc;
  },
  []
);
const addRemoteCandidateSafely = useCallback((peerId: string, candInit: RTCIceCandidateInit) => {
  const pid = normalize(peerId);
  const pc = pcsRef.current[pid];
  if (pc) {
    // if remote description is set, add immediately
    if (pc.remoteDescription && pc.remoteDescription.type) {
      pc.addIceCandidate(new RTCIceCandidate(candInit)).catch((err) => {
        console.warn("addIceCandidate failed:", err);
      });
    } else {
      // queue until remoteDescription is set
      candidateQueue.current[pid] = candidateQueue.current[pid] || [];
      candidateQueue.current[pid].push(candInit);
    }
  } else {
    // no pc yet: queue anyway (createPeerConnection should flush later)
    candidateQueue.current[pid] = candidateQueue.current[pid] || [];
    candidateQueue.current[pid].push(candInit);
  }
}, []);

const flushCandidateQueue = (peerId: string) => {
  const pid = normalize(peerId);
  const pc = pcsRef.current[pid];
  const q = candidateQueue.current[pid] || [];
  if (pc && q.length) {
    q.forEach((candInit) => {
      pc.addIceCandidate(new RTCIceCandidate(candInit)).catch(console.error);
    });
    candidateQueue.current[pid] = [];
  }
};


//   useEffect(() => {
//   Object.entries(remoteVideoElems.current).forEach(([peerId, el]) => {
//     const stream = inboundStreams.current[peerId];
//     if (el && stream && el.srcObject !== stream) {
//       el.srcObject = stream;
//     }
//   });
// }, [remoteVideoElems.current]);

  const cleanup = useCallback(async () => {
    // close peer connections
    Object.values(pcsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    pcsRef.current = {};
    inboundStreams.current = {};
if (!localStreamRef.current) {
  console.warn("No local stream when creating connection");
}    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    unsubRef.current.forEach((u) => {
      try {
        u();
      } catch {}
    });
    unsubRef.current = [];

    callDocRef.current = null;
    setIsCalling(false);
    setCallId(null);
  }, []);
const startCall = useCallback(
  async (members: Member[]) => {
    const id = crypto.randomUUID();
    setCallId(id);
    setId(id);

    // ensure local stream
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Failed to get local media:", err);
        return;
      }
    }

    const callRef = doc(db, "calls", id);
    callDocRef.current = callRef;
    const offers: Record<string, any> = {};

    // create offers for each other participant
    for (const peer of members.filter((m) => String(m.id) !== String(currentuserIs?.id))) {
      const pairKey = `${currentuserIs?.id}_${peer.id}`;

      // await the pc so fallback getUserMedia inside createPeerConnection can run
      const pc = await createPeerConnection(pairKey, peer.id, true, callRef);

      // flush any queued remote candidates for safety (unlikely for caller)
      flushCandidateQueue(peer.id);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      offers[pairKey] = {
        type: offer.type,
        sdp: offer.sdp,
        from: currentuserIs?.id,
        to: peer.id,
      };
    }

    // write the call doc (ringing)
    await setDoc(callRef, {
      status: "ringing",
      caller: { id: currentuserIs?.id, name: currentuserIs?.name },
      participants: {
        [normalize(currentuserIs?.id)]: { muted: false, videoOn: true, name: currentuserIs?.name },
      },
      members: members.map((m) => normalize(m.id ?? m.uid)),
      offers,
      createdAt: Date.now(),
    });

    // listen to call doc updates
    const unsubCall = onSnapshot(callRef, (snap) => {
      const data = snap.data() || {};
      if (data.status) setStatus(data.status);
      if (data.caller) setCaller(data.caller);
      if (data.participants) {
        const participants = data.participants as Record<string, { muted: boolean; videoOn: boolean }>;
        setMuted(Object.fromEntries(Object.entries(participants).map(([k, p]) => [normalize(k), p.muted])));
        setVideoOn(Object.fromEntries(Object.entries(participants).map(([k, p]) => [normalize(k), p.videoOn])));
      }
      if (data.answers) {
        Object.entries<any>(data.answers).forEach(([pairKey, answer]) => {
          const targetPeerId = pairKey.split("_")[1];
          const pc = pcsRef.current[normalize(targetPeerId)];
          if (pc && answer && !pc.currentRemoteDescription) {
            pc.setRemoteDescription(new RTCSessionDescription({ type: answer.type, sdp: answer.sdp }))
              .then(() => flushCandidateQueue(targetPeerId))
              .catch(console.error);
          }
        });
      }
    });
    unsubRef.current.push(unsubCall);

    // listen for calleeCandidates for each pairKey (callee writes these)
    for (const peer of members.filter((m) => String(m.id) !== String(currentuserIs?.id))) {
      const pairKey = `${currentuserIs?.id}_${peer.id}`;
      const colRef = collection(callRef, `calleeCandidates_${pairKey}`);
      const unsubCallee = onSnapshot(colRef, (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const cand = change.doc.data();
            addRemoteCandidateSafely(peer.id, cand);
          }
        });
      });
      unsubRef.current.push(unsubCallee);
    }

    setIsCalling(true);
    setStatus("ringing");
    return id;
  },
  [createPeerConnection, currentuserIs?.id, currentuserIs?.name]
);




useEffect(() => {
  if (localVideoRef.current && localStreamRef.current) {
    console.log("✅ Attaching local stream after ref mount");
    localVideoRef.current.srcObject = localStreamRef.current;
    localVideoRef.current.muted = true;
    localVideoRef.current
      .play()
      .catch((err) => console.warn("Local video play error:", err));
  }
}, [localVideoRef.current, localStreamRef.current]);
const acceptCall = useCallback(
  async (id: string, members: Member[]) => {
    // ensure local stream first
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Failed to get local media:", err);
        return;
      }
    }

    const callRef = doc(db, "calls", id);
    callDocRef.current = callRef;
    setCallId(id);

    await updateDoc(callRef, {
      status: "active",
      [`participants.${normalize(currentuserIs?.id)}`]: { muted: true, videoOn: true, name: user?.displayName },
      [`renegotiate.${normalize(currentuserIs?.id)}`]: Date.now(),
    });

    setStatus("active");

    const snap = await getDoc(callRef);
    const data = snap.data() || {};
    const offers = data.offers || {};

    const offersForMe = Object.entries<any>(offers).filter(([, offer]) => offer && offer.to === currentuserIs?.id);

    for (const [pairKey, offer] of offersForMe) {
      const callerId = offer.from as string;

      // create/await pc
      const pc = await createPeerConnection(pairKey, callerId, false, callRef);

      // listen for caller ICE candidates (caller wrote these)
      const callerCandidatesCol = collection(callRef, `callerCandidates_${pairKey}`);
      const unsubCallerCand = onSnapshot(callerCandidatesCol, (snap2) => {
        snap2.docChanges().forEach((change) => {
          if (change.type === "added") {
            const c = change.doc.data();
            addRemoteCandidateSafely(callerId, c);
          }
        });
      });
      unsubRef.current.push(unsubCallerCand);

      // set remote offer
      await pc.setRemoteDescription(new RTCSessionDescription({ type: offer.type, sdp: offer.sdp }))
        .catch(console.error);

      // flush any queued candidates now remoteDescription exists
      flushCandidateQueue(callerId);

      // create answer and write it
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await updateDoc(callRef, {
        [`answers.${pairKey}`]: { type: answer.type, sdp: answer.sdp, from: currentuserIs?.id },
      });

      // listen for calleeCandidates written by this callee (so caller can add them)
      const calleeCandidatesCol = collection(callRef, `calleeCandidates_${pairKey}`);
      const unsubCallee = onSnapshot(calleeCandidatesCol, (snap3) => {
        snap3.docChanges().forEach((change) => {
          if (change.type === "added") {
            const c = change.doc.data();
            addRemoteCandidateSafely(callerId, c);
          }
        });
      });
      unsubRef.current.push(unsubCallee);
    }

    // listen to call doc live updates (answers, status, etc.)
    const unsubDoc = onSnapshot(callRef, (snapDoc) => {
      const d = snapDoc.data() || {};
      if (d.status) setStatus(d.status);
      if (d.caller) setCaller(d.caller);
      if (d.participants) {
        const participants = d.participants as Record<string, { muted: boolean; videoOn: boolean }>;
        setMuted(Object.fromEntries(Object.entries(participants).map(([k, p]) => [normalize(k), p.muted])));
        setVideoOn(Object.fromEntries(Object.entries(participants).map(([k, p]) => [normalize(k), p.videoOn])));
      }
      if (d.answers) {
        Object.entries<any>(d.answers).forEach(([pairKey, answer]) => {
          const callerId = pairKey.split("_")[0];
          const pc = pcsRef.current[normalize(callerId)];
          if (pc && answer && !pc.currentRemoteDescription) {
            pc.setRemoteDescription(new RTCSessionDescription({ type: answer.type, sdp: answer.sdp }))
              .then(() => flushCandidateQueue(callerId))
              .catch(console.error);
          }
        });
      }
    });
    unsubRef.current.push(unsubDoc);

    setIsCalling(true);
  },
  [createPeerConnection, currentuserIs?.id]
);



useEffect(() => {
  if (!callId) return;
  const callRef = doc(db, "calls", callId);

  const unsub = onSnapshot(callRef, async (snap) => {
    if (!snap.exists()) return;
    const d = snap.data();

    // 📌 normal createCall call status, offers, answers, ICE handling here...
    // ---------------------------------------------

    // 🔄 renegotiation handler
    if (d.renegotiate) {
      for (const [peerId, ts] of Object.entries(d.renegotiate)) {
        if (peerId !== currentuserIs?.id) {
          console.log("🔄 Renegotiation requested by", peerId);

          const pairKey =
            normalize(currentuserIs?.id) + "_" + normalize(peerId);

          // create fresh peer connection
          const pc = createPeerConnection(pairKey, peerId, true, callRef);

          // new offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          // write to Firestore
          await updateDoc(callRef, {
            [`offers.${pairKey}`]: {
              type: offer.type,
              sdp: offer.sdp,
              from: currentuserIs?.id,
              to: peerId,
            },
            [`renegotiate.${peerId}`]: deleteField(), // ✅ cleanup peerConnection.ontrack
          });
        }
      }
    }
  });

  return () => unsub();
}, [callId, currentuserIs]);

  const joinCall = useCallback(async (id: string, members: Member[]) => acceptCall(id, members), [acceptCall]);

  const declineCall = useCallback(
    async (id: string) => {
      try {
        const callRef = doc(db, "calls", id);
        await updateDoc(callRef, { status: "ended" });
      } catch (err) {
        console.warn("decline update error", err);
      }
      setStatus("ended");
      await cleanup();
    },
    [cleanup]
  );

  const toggleMute = useCallback(async () => {
    if (!callId || !currentuserIs) return;
    const callRef = doc(db, "calls", callId);
    const myId = normalize(currentuserIs?.id);
    const newState = !muted[myId];
    setMuted((p) => ({ ...p, [myId]: newState }));
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !newState));
    try {
      await updateDoc(callRef, { [`participants.${myId}.muted`]: newState });
    } catch (err) {
      console.warn("toggleMute update failed", err);
    }
  }, [callId, currentuserIs?.id, muted]);

  const toggleVideo = useCallback(async () => {
    if (!callId || !currentuserIs) return;
    const callRef = doc(db, "calls", callId);
    const myId = normalize(currentuserIs?.id);
    const newState = !videoOn[myId];
    setVideoOn((p) => ({ ...p, [myId]: newState }));
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = newState));
    try {
      await updateDoc(callRef, { [`participants.${myId}.videoOn`]: newState });
    } catch (err) {
      console.warn("toggleVideo update failed", err);
    }
  }, [callId, currentuserIs?.id, videoOn]);

  const hangUp = useCallback(async () => {
    try {
      if (callId) {
        const callRef = doc(db, "calls", callId);
        await updateDoc(callRef, {
          status: "ended",
          [`participants.${normalize(currentuserIs?.id)}`]: { muted: true, videoOn: false },
        });
      }
    } catch (err) {
      console.warn("hangUp update error", err);
    }
    await cleanup();
    setCallId(null);
    setStatus("ended");
  }, [callId, cleanup, currentuserIs?.id]);

  useEffect(() => {
    return () => {
      unsubRef.current.forEach((u) => {
        try { u(); } catch {}
      });
      unsubRef.current = [];
      Object.values(pcsRef.current).forEach((pc) => {
        try { pc.close(); } catch {}
      });
      pcsRef.current = {};
      const s = localStreamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, []);

  return {
    localVideoRef,
    getRemoteVideoRef,
    startCall,
    acceptCall,
    joinCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleVideo,
    isCalling,
    muted,
    videoOn,
    status,
    caller,
    callId,
    ID
  };
}


// callerCandidates