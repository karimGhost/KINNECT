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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Member = { id?: string; uid?: string; name?: string };

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useWebRTCAudioCall({ currentuserIs }: { currentuserIs: { id: string; name?: string } }) {
  const localAudioElRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // remote audio elements keyed by normalized peerId
  const remoteAudioElems = useRef<Record<string, HTMLAudioElement | null>>({});
  // inbound streams keyed by normalized peerId
  const inboundStreams = useRef<Record<string, MediaStream>>({});
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const unsubRef = useRef<Array<() => void>>([]);
  const callDocRef = useRef<DocumentReference | null>(null);

  const [isCalling, setIsCalling] = useState(false);
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<"ringing" | "active" | "ended" | null>(null);
  const [caller, setCaller] = useState<{ id: string; name?: string } | null>(null);

  const normalize = (id: any) => (id === undefined || id === null ? String(id) : String(id));

  // callback ref to attach local audio element from component
  const getLocalAudioRef = useCallback((el: HTMLAudioElement | null) => {
    localAudioElRef.current = el;
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current;
      el.muted = true; // local preview muted
      el.play().catch(() => {});
    }
  }, []);

  // callback ref to attach remote audio elements from component
  const getRemoteAudioRef = useCallback((peerIdRaw: string) => {
    const pid = normalize(peerIdRaw);
    return (el: HTMLAudioElement | null) => {
      remoteAudioElems.current[pid] = el;
      const s = inboundStreams.current[pid];
      if (el && s) {
        el.srcObject = s;
        el.play().catch(() => {});
      }
    };
  }, []);

  // get microphone
  const startLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = s;

    // attach to local element if exists
    if (localAudioElRef.current) {
      localAudioElRef.current.srcObject = s;
      localAudioElRef.current.muted = true;
      await localAudioElRef.current.play().catch(() => {});
    }

    // default muted state for self
    setMuted((p) => ({ ...p, [normalize(currentuserIs?.id)]: false }));
    return s;
  }, [currentuserIs?.id]);

  const createPeerConnection = useCallback(
    (pairKey: string, remotePeerId: string, isCaller: boolean, callRef: DocumentReference | null) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      // add local audio tracks
      const localStream = localStreamRef.current;
      if (localStream) {
        for (const track of localStream.getTracks()) {
          pc.addTrack(track, localStream);
        }
      }

      // when remote audio arrives
      pc.ontrack = (ev) => {
        const pid = normalize(remotePeerId);
        let remoteStream = inboundStreams.current[pid] ?? new MediaStream();

        if (ev.streams && ev.streams.length > 0) {
          inboundStreams.current[pid] = ev.streams[0];
        } else if (ev.track) {
          remoteStream.addTrack(ev.track);
          inboundStreams.current[pid] = remoteStream;
        }

        const el = remoteAudioElems.current[pid];
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
    Object.values(pcsRef.current).forEach((pc) => {
      try { pc.close(); } catch {}
    });
    pcsRef.current = {};
    inboundStreams.current = {};

    // stop local tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localAudioElRef.current) localAudioElRef.current.srcObject = null;

    // unsubscribe listeners
    unsubRef.current.forEach((u) => {
      try { u(); } catch {}
    });
    unsubRef.current = [];

    callDocRef.current = null;
    setIsCalling(false);
    setCallId(null);
    setStatus(null);
    setCaller(null);
  }, []);

  // Start a new audio call (ringing) to members (array of Member)
  const startCall = useCallback(
    async (members: Member[]) => {
      await startLocalStream();

      const id = crypto.randomUUID();
      const callRef = doc(db, "calls", id);
      callDocRef.current = callRef;
      setCallId(id);

      const offers: Record<string, any> = {};

      // create per-peer offers
      for (const peer of members.filter((m) => normalize(m.id ?? m.uid) !== normalize(currentuserIs?.id))) {
        const peerId = peer.id ?? peer.uid;
        const pairKey = `${currentuserIs?.id}_${peerId}`;

        const pc = createPeerConnection(pairKey, peerId!, true, callRef);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        offers[pairKey] = {
          type: offer.type,
          sdp: offer.sdp,
          from: currentuserIs?.id,
          to: peerId,
        };
      }

      // write call doc
      await setDoc(callRef, {
        status: "ringing",
        type: "audio",
        caller: { id: currentuserIs?.id, name: currentuserIs?.name },
        participants: {
          [normalize(currentuserIs?.id)]: { muted: false },
        },
        offers,
        createdAt: Date.now(),
      });

      // listen to call doc updates (answers, participants, status)
      const unsubCall = onSnapshot(callRef, (snap) => {
        const data = snap.data() || {};
        if (data.status) setStatus(data.status);
        if (data.caller) setCaller(data.caller);
        if (data.participants) {
          const participants = data.participants as Record<string, { muted: boolean }>;
          setMuted(Object.fromEntries(Object.entries(participants).map(([k, p]) => [normalize(k), p.muted])));
        }
        if (data.answers) {
          Object.entries<any>(data.answers).forEach(([pairKey, answer]) => {
            // pairKey format: callerId_peerId
            const targetPeerId = pairKey.split("_")[1];
            const pc = pcsRef.current[normalize(targetPeerId)];
            if (pc && answer && !pc.currentRemoteDescription) {
              pc.setRemoteDescription(new RTCSessionDescription({ type: answer.type, sdp: answer.sdp })).catch(console.error);
            }
          });
        }
      });
      unsubRef.current.push(unsubCall);

      // listen for calleeCandidates for each pairKey (callee will write these)
      for (const peer of members.filter((m) => normalize(m.id ?? m.uid) !== normalize(currentuserIs?.id))) {
        const peerId = peer.id ?? peer.uid;
        const pairKey = `${currentuserIs?.id}_${peerId}`;
        const colRef = collection(callRef, `calleeCandidates_${pairKey}`);
        const unsubCallee = onSnapshot(colRef, (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type === "added") {
              const cand = change.doc.data();
              const pc = pcsRef.current[normalize(peerId)];
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

  // Accept a call by id and members list (will answer offers targeted to current user)
  const acceptCall = useCallback(
    async (id: string, members: Member[]) => {
      await startLocalStream();
      const callRef = doc(db, "calls", id);
      callDocRef.current = callRef;
      setCallId(id);

      // mark joined in participants
      await updateDoc(callRef, {
        status: "active",
        [`participants.${normalize(currentuserIs?.id)}`]: { muted: false },
      });
      setStatus("active");

      const snap = await getDoc(callRef);
      const data = snap.data() || {};
      const offers = data.offers || {};

      // offers object keyed by pairKey: each callee will find offers where offer.to === currentuserIs.id
      const offersForMe = Object.entries<any>(offers).filter(([, offer]) => offer && offer.to === currentuserIs?.id);

      for (const [pairKey, offer] of offersForMe) {
        const callerId = offer.from as string;

        // create pc with caller as remote peer
        const pc = createPeerConnection(pairKey, callerId, false, callRef);

        // listen for caller ICE candidates (caller writes these)
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
        await pc.setRemoteDescription(new RTCSessionDescription({ type: offer.type, sdp: offer.sdp })).catch(console.error);

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
              const pcInner = pcsRef.current[normalize(callerId)];
              if (pcInner) pcInner.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
            }
          });
        });
        unsubRef.current.push(unsubCallee);
      }

      // listen to call doc live updates (participants, answers that may arrive later...)
      const unsubDoc = onSnapshot(callRef, (snapDoc) => {
        const d = snapDoc.data() || {};
        if (d.status) setStatus(d.status);
        if (d.caller) setCaller(d.caller);
        if (d.participants) {
          const participants = d.participants as Record<string, { muted: boolean }>;
          setMuted(Object.fromEntries(Object.entries(participants).map(([k, p]) => [normalize(k), p.muted])));
        }
        if (d.answers) {
          Object.entries<any>(d.answers).forEach(([pairKey, answer]) => {
            const callerId = pairKey.split("_")[0];
            const pc = pcsRef.current[normalize(callerId)];
            if (pc && answer && !pc.currentRemoteDescription) {
              pc.setRemoteDescription(new RTCSessionDescription({ type: answer.type, sdp: answer.sdp })).catch(console.error);
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

  const hangUp = useCallback(async () => {
    try {
      if (callId) {
        const callRef = doc(db, "calls", callId);
        await updateDoc(callRef, {
          status: "ended",
          [`participants.${normalize(currentuserIs?.id)}`]: { muted: true },
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
    // refs
    getLocalAudioRef,
    getRemoteAudioRef,

    // actions
    startCall,
    acceptCall,
    joinCall,
    declineCall,
    hangUp,
    toggleMute,

    // state
    isCalling,
    muted,
    status,
    caller,
    callId,
  };
}
