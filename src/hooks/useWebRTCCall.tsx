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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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

  const [isCalling, setIsCalling] = useState(false);
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [videoOn, setVideoOn] = useState<Record<string, boolean>>({});
  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<"ringing" | "active" | "ended" | null>(null);
  const [caller, setCaller] = useState<{ id: string; name?: string } | null>(null);

  // Normalize ID helper
  const normalize = (id: any) => (id === undefined || id === null ? String(id) : String(id));

  const getRemoteVideoRef = useCallback((peerId: string) => {
    const pid = normalize(peerId);
    return (el: HTMLVideoElement | null) => {
      remoteVideoElems.current[pid] = el;
      const s = inboundStreams.current[pid];
      if (el && s) {
        el.srcObject = s;
        el.play().catch(() => {});
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

  const createPeerConnection = useCallback(
    (pairKey: string, remotePeerId: string, isCaller: boolean, callRef: DocumentReference | null) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      // add local tracks (if available)
      const localStream = localStreamRef.current;
      if (localStream) {
        for (const track of localStream.getTracks()) {
          pc.addTrack(track, localStream);
        }
      }

      pc.ontrack = (ev) => {
        const pid = normalize(remotePeerId);
        // Compose a MediaStream from incoming tracks
        const remoteStream = inboundStreams.current[pid] ?? new MediaStream();

        if (ev.streams && ev.streams.length > 0) {
          // prefer provided stream
          inboundStreams.current[pid] = ev.streams[0];
        } else if (ev.track) {
          remoteStream.addTrack(ev.track);
          inboundStreams.current[pid] = remoteStream;
        }

        const el = remoteVideoElems.current[pid];
        if (el && inboundStreams.current[pid]) {
          el.srcObject = inboundStreams.current[pid];
          el.play().catch(() => {});
        }
      };

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

      pcsRef.current[normalize(remotePeerId)] = pc;
      return pc;
    },
    []
  );

  const cleanup = useCallback(async () => {
    // close peer connections
    Object.values(pcsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    pcsRef.current = {};
    inboundStreams.current = {};

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
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
    await startLocalStream();

    const id = crypto.randomUUID();
    const callRef = doc(db, "calls", id);
    callDocRef.current = callRef;
    setCallId(id);

    const offers: Record<string, any> = {};

    // create offers for each other participant
    for (const peer of members.filter((m) => String(m.id) !== String(currentuserIs?.id))) {
      const pairKey = `${currentuserIs?.id}_${peer.id}`;

      // ✅ create peer connection with remote peerId
      const pc = createPeerConnection(pairKey, peer.id, true, callRef);

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
        [normalize(currentuserIs?.id)]: { muted: false, videoOn: true },
      },
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
          // pairKey format: callerId_peerId
          const targetPeerId = pairKey.split("_")[1];
          const pc = pcsRef.current[normalize(targetPeerId)];
          if (pc && answer && !pc.currentRemoteDescription) {
            pc.setRemoteDescription(
              new RTCSessionDescription({ type: answer.type, sdp: answer.sdp })
            ).catch(console.error);
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
            const pc = pcsRef.current[normalize(peer.id)];
            if (pc) pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
          }
        });
      });
      unsubRef.current.push(unsubCallee);
    }

    setIsCalling(true);
    setStatus("ringing");
    return id;
  },
  [createPeerConnection, currentuserIs?.id, currentuserIs?.name, startLocalStream]
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
    await startLocalStream();

// if (localVideoRef.current && localStreamRef.current) {
//   localVideoRef.current.srcObject = localStreamRef.current;
//   localVideoRef.current.muted = true;
//   await localVideoRef.current.play().catch(() => {});
// }


    const callRef = doc(db, "calls", id);
    callDocRef.current = callRef;
    setCallId(id);

    await updateDoc(callRef, {
      status: "active",
      [`participants.${normalize(currentuserIs?.id)}`]: { muted: false, videoOn: true },
    });
    setStatus("active");

    const snap = await getDoc(callRef);
    const data = snap.data() || {};
    const offers = data.offers || {};

    const offersForMe = Object.entries<any>(offers).filter(
      ([, offer]) => offer && offer.to === currentuserIs?.id
    );

    for (const [pairKey, offer] of offersForMe) {
      const callerId = offer.from as string;

      // ✅ use callerId as remote peer
      const pc = createPeerConnection(pairKey, callerId, false, callRef);

      // subscribe to caller ICE candidates
      const callerCandidatesCol = collection(callRef, `callerCandidates_${pairKey}`);
      const unsubCallerCand = onSnapshot(callerCandidatesCol, (snap2) => {
        snap2.docChanges().forEach((change) => {
          if (change.type === "added") {
            const c = change.doc.data();
            const pcInner = pcsRef.current[normalize(callerId)];
            if (pcInner) pcInner.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
          }
        });
      });
      unsubRef.current.push(unsubCallerCand);

      // set remote offer
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: offer.type, sdp: offer.sdp })
      ).catch(console.error);

      // create answer and write it src
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
            const pcInner = pcsRef.current[normalize(callerId)];
            if (pcInner) pcInner.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
          }
        });
      });
      unsubRef.current.push(unsubCallee);
    }

    // listen to call doc live updates
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
            pc.setRemoteDescription(
              new RTCSessionDescription({ type: answer.type, sdp: answer.sdp })
            ).catch(console.error);
          }
        });
      }
    });
    unsubRef.current.push(unsubDoc);

    setIsCalling(true);
  },
  [createPeerConnection, currentuserIs?.id, startLocalStream]
);


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
  };
}


// callerCandidates