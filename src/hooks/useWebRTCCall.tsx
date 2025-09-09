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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Member = { id: string; name?: string; avatar?: string; fullName?: string };

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // Add TURN servers here for production.
  ],
};

export function useWebRTCCall({ currentUser }: { currentUser: { id: string; name?: string } }) {
  // refs & maps
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElems = useRef<Record<string, HTMLVideoElement | null>>({});
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const inboundStreams = useRef<Record<string, MediaStream>>({});
  const unsubRef = useRef<Array<() => void>>([]);
  const callDocRef = useRef<any>(null);

  // local media stream
  const localStreamRef = useRef<MediaStream | null>(null);

  // state
  const [isCalling, setIsCalling] = useState(false);
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [videoOn, setVideoOn] = useState<Record<string, boolean>>({});
  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<"ringing" | "active" | "ended" | null>(null);
  const [caller, setCaller] = useState<{ id: string; name?: string } | null>(null);

  // helper: callback ref setter for remote video elements
  const getRemoteVideoRef = useCallback((peerId: string) => {
    return (el: HTMLVideoElement | null) => {
      remoteVideoElems.current[peerId] = el;
      // attach existing inbound stream if present
      const s = inboundStreams.current[peerId];
      if (el && s) {
        el.srcObject = s;
        el.play().catch(() => {});
      }
    };
  }, []);

  // start local camera/mic
  const startLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      await localVideoRef.current.play().catch(() => {});
    }
    // initialize local participant state (optimistic)
    setVideoOn((p) => ({ ...p, [currentUser.id]: true }));
    setMuted((p) => ({ ...p, [currentUser.id]: false }));
    return stream;
  }, [currentUser.id]);

  // create a peer connection for a pair (pairKey e.g. callerId_peerId)
  const createPeerConnection = useCallback(
    (pairKey: string, peerId: string, isCaller: boolean, callRefDoc: any) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      // add local tracks
      const localStream = localStreamRef.current;
      if (localStream) {
        for (const track of localStream.getTracks()) {
          pc.addTrack(track, localStream);
        }
      }

      // when remote track arrives, assemble stream and attach
      pc.ontrack = (ev) => {
        const remoteStream = ev.streams && ev.streams[0] ? ev.streams[0] : new MediaStream();
        // if event.track present, ensure it's added
        if (!ev.streams || ev.streams.length === 0) {
          remoteStream.addTrack(ev.track);
        }
        inboundStreams.current[peerId] = remoteStream;
        const el = remoteVideoElems.current[peerId];
        if (el) {
          el.srcObject = remoteStream;
          el.play().catch(() => {});
        }
      };

      // ICE -> Firestore
      pc.onicecandidate = async (ev) => {
        if (!ev.candidate || !callRefDoc) return;
        try {
          const cand = ev.candidate.toJSON();
          const colName = isCaller ? `callerCandidates_${pairKey}` : `calleeCandidates_${pairKey}`;
          await addDoc(collection(callRefDoc, colName), cand);
        } catch (err) {
          console.warn("add candidate failed", err);
        }
      };

      pcsRef.current[peerId] = pc;
      return pc;
    },
    []
  );

  // internal cleanup
  const cleanup = useCallback(async () => {
    // close pcs
    Object.values(pcsRef.current).forEach((pc) => {
      try { pc.close(); } catch {}
    });
    pcsRef.current = {};
    inboundStreams.current = {};

    // stop local stream tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    // unsub snapshots
    unsubRef.current.forEach((u) => u());
    unsubRef.current = [];

    callDocRef.current = null;
    setIsCalling(false);
  }, []);

  // startCall: caller creates call doc + offers for all other members
  const startCall = useCallback(
    async (members: Member[]) => {
      await startLocalStream();

      const id = crypto.randomUUID();
      const callRef = doc(db, "calls", id);
      callDocRef.current = callRef;
      setCallId(id);

      // create PC + offers for each other member
      const offers: Record<string, any> = {};

      for (const peer of members.filter((m) => m.id !== currentUser.id)) {
        const pairKey = `${currentUser.id}_${peer.id}`;
        const pc = createPeerConnection(pairKey, peer.id, true, callRef);

        // create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        offers[pairKey] = {
          type: offer.type,
          sdp: offer.sdp,
          from: currentUser.id,
          to: peer.id,
        };
      }

      // Save doc with ringing status + offers + caller + participants map
      await setDoc(callRef, {
        status: "ringing",
        caller: { id: currentUser.id, name: currentUser.name },
        participants: {
          [currentUser.id]: { muted: false, videoOn: true },
        },
        offers,
        createdAt: Date.now(),
      });

      // Listen to call doc (for answers, participants, status)
      const unsubCall = onSnapshot(callRef, (snap) => {
        const data = snap.data() || {};
        if (data.status) setStatus(data.status);
        if (data.caller) setCaller(data.caller);
        if (data.participants) {
          const participants = data.participants as Record<string, { muted: boolean; videoOn: boolean }>;
          setMuted(Object.fromEntries(Object.entries(participants).map(([k, p]) => [k, p.muted])));
          setVideoOn(Object.fromEntries(Object.entries(participants).map(([k, p]) => [k, p.videoOn])));
        }
        if (data.answers) {
          // for each answer, attach to relevant pc
          Object.entries<any>(data.answers).forEach(([pairKey, answer]) => {
            const targetPeerId = pairKey.split("_")[1]; // caller_peerId
            const pc = pcsRef.current[targetPeerId];
            if (pc && answer && !pc.currentRemoteDescription) {
              pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(console.error);
            }
          });
        }
      });
      unsubRef.current.push(unsubCall);

      // Listen for callee ICE candidates for every pairKey
      for (const peer of members.filter((m) => m.id !== currentUser.id)) {
        const pairKey = `${currentUser.id}_${peer.id}`;
        const colRef = collection(callRef, `calleeCandidates_${pairKey}`);
        const unsubCallee = onSnapshot(colRef, (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type === "added") {
              const cand = change.doc.data();
              const pc = pcsRef.current[peer.id];
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
    [createPeerConnection, currentUser.id, currentUser.name, startLocalStream]
  );

  // acceptCall: participant accepts, reads offers targeted at them and answers
  const acceptCall = useCallback(
    async (id: string, members: Member[]) => {
      await startLocalStream();
      const callRef = doc(db, "calls", id);
      callDocRef.current = callRef;
      setCallId(id);

      // Add self to participants and mark active
      await updateDoc(callRef, {
        status: "active",
        [`participants.${currentUser.id}`]: { muted: false, videoOn: true },
      });
      setStatus("active");

      // Get the call doc once to read offers
      const snap = await getDoc(callRef);
      const data = snap.data() || {};
      const offers = data.offers || {};

      // Offers targeted to current user
      const offersForMe = Object.entries<any>(offers).filter(([, offer]) => offer && offer.to === currentUser.id);

      // For each offer: create pc, setRemoteDescription(offer), createAnswer, setLocalDescription(answer), write answer
      for (const [pairKey, offer] of offersForMe) {
        const callerId = offer.from as string;
        const pc = createPeerConnection(pairKey, callerId, false, callRef);

        // Listen to caller ICE candidates
        const callerCandidatesCol = collection(callRef, `callerCandidates_${pairKey}`);
        const unsubCallerCand = onSnapshot(callerCandidatesCol, (snap2) => {
          snap2.docChanges().forEach((change) => {
            if (change.type === "added") {
              const c = change.doc.data();
              const pcInner = pcsRef.current[callerId];
              if (pcInner) pcInner.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
            }
          });
        });
        unsubRef.current.push(unsubCallerCand);

        // set remote offer
        await pc.setRemoteDescription(new RTCSessionDescription(offer)).catch(console.error);

        // create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // write answer
        await updateDoc(callRef, {
          [`answers.${pairKey}`]: { type: answer.type, sdp: answer.sdp, from: currentUser.id },
        });

        // Listen for calleeCandidates (this callee writing to calleeCandidates_... used by caller)
        const calleeCandidatesCol = collection(callRef, `calleeCandidates_${pairKey}`);
        const unsubCallee = onSnapshot(calleeCandidatesCol, (snap3) => {
          snap3.docChanges().forEach((change) => {
            if (change.type === "added") {
              const c = change.doc.data();
              const pcInner = pcsRef.current[callerId];
              if (pcInner) pcInner.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
            }
          });
        });
        unsubRef.current.push(unsubCallee);
      }

      // Also subscribe to call doc for live updates (participants/status/answers)
      const unsubDoc = onSnapshot(callRef, (snapDoc) => {
        const d = snapDoc.data() || {};
        if (d.status) setStatus(d.status);
        if (d.caller) setCaller(d.caller);
        if (d.participants) {
          const participants = d.participants as Record<string, { muted: boolean; videoOn: boolean }>;
          setMuted(Object.fromEntries(Object.entries(participants).map(([k, p]) => [k, p.muted])));
          setVideoOn(Object.fromEntries(Object.entries(participants).map(([k, p]) => [k, p.videoOn])));
        }
        if (d.answers) {
          Object.entries<any>(d.answers).forEach(([pairKey, answer]) => {
            const callerId = pairKey.split("_")[0];
            const pc = pcsRef.current[callerId];
            if (pc && answer && !pc.currentRemoteDescription) {
              pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(console.error);
            }
          });
        }
      });
      unsubRef.current.push(unsubDoc);

      setIsCalling(true);
    },
    [createPeerConnection, currentUser.id, startLocalStream]
  );

  const joinCall = useCallback(async (id: string, members: Member[]) => {
    // alias for acceptCall
    return acceptCall(id, members);
  }, [acceptCall]);

  const declineCall = useCallback(
    async (id: string) => {
      const callRef = doc(db, "calls", id);
      await updateDoc(callRef, { status: "ended" });
      setStatus("ended");
      await cleanup();
    },
    [cleanup]
  );

  // toggle mic (current user)
  const toggleMute = useCallback(async () => {
    if (!callId) return;
    const callRef = doc(db, "calls", callId);
    const newState = !muted[currentUser.id];
    setMuted((p) => ({ ...p, [currentUser.id]: newState }));
    // update local tracks if available
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !newState));
    await updateDoc(callRef, { [`participants.${currentUser.id}.muted`]: newState });
  }, [callId, currentUser.id, muted]);

  // toggle video (current user)
  const toggleVideo = useCallback(async () => {
    if (!callId) return;
    const callRef = doc(db, "calls", callId);
    const newState = !videoOn[currentUser.id];
    setVideoOn((p) => ({ ...p, [currentUser.id]: newState }));
    // update local tracks if available
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = newState));
    await updateDoc(callRef, { [`participants.${currentUser.id}.videoOn`]: newState });
  }, [callId, currentUser.id, videoOn]);

  // hang up and cleanup
  const hangUp = useCallback(async () => {
    try {
      if (callId) {
        const callRef = doc(db, "calls", callId);
        await updateDoc(callRef, {
          status: "ended",
          [`participants.${currentUser.id}`]: { muted: true, videoOn: false },
        });
      }
    } catch (err) {
      console.warn("hangUp update error", err);
    }
    await cleanup();
    setCallId(null);
    setStatus("ended");
  }, [callId, cleanup, currentUser.id]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      unsubRef.current.forEach((u) => u());
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
    // refs & helpers
    localVideoRef,
    getRemoteVideoRef,

    // actions
    startCall,
    acceptCall,
    joinCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleVideo,

    // state
    isCalling,
    muted,
    videoOn,
    status,
    caller,
    callId,
  };
}
