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
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Member = { id?: string; uid?: string; name?: string };

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useWebRTCAudioCall({ currentuserIs }: { currentuserIs: { id: string; name?: string } }) {
  const localAudioElRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const remoteAudioElems = useRef<Record<string, HTMLAudioElement | null>>({});
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

  // ----- callback refs (no change) but added logs -----
  const getLocalAudioRef = useCallback((el: HTMLAudioElement | null) => {
    localAudioElRef.current = el;
    if (el) {
      console.log("[audioHook] local audio element mounted");
      // if stream already exists, attach it
      if (localStreamRef.current) {
        try {
          el.srcObject = localStreamRef.current;
          el.muted = true;
          el.play().catch((err) => console.warn("[audioHook] local play error:", err));
        } catch (err) {
          console.warn("[audioHook] attach local stream error:", err);
        }
      }
    }
  }, []);

  // const getRemoteAudioRef = useCallback((peerIdRaw: string) => { new RTC
  //   const pid = normalize(peerIdRaw);
  //   return (el: HTMLAudioElement | null) => {
  //     remoteAudioElems.current[pid] = el;
  //     console.log(`[audioHook] remote audio element mounted for ${pid}`);
  //     const s = inboundStreams.current[pid];
  //     if (el && s) {
  //       try {
  //         el.srcObject = s;
  //         el.play().catch((err) => console.warn(`[audioHook] remote play error ${pid}:`, err));
  //       } catch (err) {
  //         console.warn(`[audioHook] attach remote stream error ${pid}:`, err);
  //       }
  //     }
  //   };
  // }, []);


  // in useWebRTCAudioCall (replace your getRemoteAudioRef)
const getRemoteAudioRef = useCallback((peerIdRaw: string) => {
  const pid = normalize(peerIdRaw);
  return (el: HTMLAudioElement | null) => {
    remoteAudioElems.current[pid] = el;
    console.log(`[audioHook] remote audio element mounted for ${pid}`);
    const s = inboundStreams.current[pid];
    if (el) {
      // set helpful attributes (autoplay may still be blocked until user gesture)
      el.autoplay = true;
      el.playsInline = true;
      // ensure it's not muted (we want to play remote audio)
      try { el.muted = false; } catch {}
    }
    if (el && s) {
      try {
        el.srcObject = s;
        // attempt to play and log any error
        el.play().then(() => {
          console.log(`[audioHook] remote audio play started for ${pid}`);
        }).catch((err) => {
          console.warn(`[audioHook] remote audio play blocked for ${pid}:`, err);
        });
        console.log(`[audioHook] attached inbound stream to element ${pid}`);
      } catch (err) {
        console.warn(`[audioHook] attach remote stream error ${pid}:`, err);
      }
    }
  };
}, []);


  // ----- ensure binding if ref mounts after stream/ontrack fired -----
  useEffect(() => {
    // whenever inboundStreams or remoteAudioElems changes we need to try re-attach
    Object.entries(inboundStreams.current).forEach(([peerId, stream]) => {
      const el = remoteAudioElems.current[peerId];
      if (el && stream) {
        try {
          if (el.srcObject !== stream) {
            el.srcObject = stream;
            el.play().catch((err) => console.warn(`[audioHook] play failed for ${peerId}:`, err));
            console.log(`[audioHook] attached inbound stream to element ${peerId}`);
          }
        } catch (err) {
          console.warn(`[audioHook] attach inbound error ${peerId}:`, err);
        }
      }
    });

    // local
    const localEl = localAudioElRef.current;
    const localS = localStreamRef.current;
    if (localEl && localS) {
      try {
        if (localEl.srcObject !== localS) {
          localEl.srcObject = localS;
          localEl.muted = true;
          localEl.play().catch((err) => console.warn("[audioHook] local re-play error:", err));
          console.log("[audioHook] re-attached local stream to element");
        }
      } catch (err) {
        console.warn("[audioHook] attach local fallback error:", err);
      }
    }
  }, [/* run on mount + whenever hook's refs mutate: we rely on refs, so leave empty so it runs after mount */]);

  // ----- get microphone -----
  const startLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = s;
      console.log("[audioHook] got local audio tracks:", s.getAudioTracks().map(t => t.label));

      // attach if element exists
      if (localAudioElRef.current) {
        try {
          localAudioElRef.current.srcObject = s;
          localAudioElRef.current.muted = true;
          await localAudioElRef.current.play().catch((err) => console.warn("[audioHook] local play error:", err));
        } catch (err) {
          console.warn("[audioHook] attaching local stream failed:", err);
        }
      }

      setMuted((p) => ({ ...p, [normalize(currentuserIs?.id)]: false }));
      return s;
    } catch (err) {
      console.warn("[audioHook] getUserMedia failed:", err);
      throw err;
    }
  }, [currentuserIs?.id]);

  const createPeerConnection = useCallback(
    (pairKey: string, remotePeerId: string, isCaller: boolean, callRef: DocumentReference | null) => {
      console.log(`[audioHook] createPeerConnection pairKey=${pairKey} remote=${remotePeerId} caller=${isCaller}`);
      // const pc = new RTCPeerConnection(RTC_CONFIG);
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:relay.metered.ca:80",
      username: "openai",
      credential: "openai123",
    },
  ],
});

      pc.onicecandidate = async (ev) => {
  console.log(`[audioHook] onicecandidate pair=${pairKey} remote=${remotePeerId} candidate=`, ev.candidate);
  if (!ev.candidate || !callRef) return;
  try {
    const cand = ev.candidate.toJSON();
    const colName = isCaller ? `callerCandidates_${pairKey}` : `calleeCandidates_${pairKey}`;
    await addDoc(collection(callRef, colName), cand);
    console.log(`[audioHook] wrote candidate to ${colName}`);
  } catch (err) {
    console.warn("[audioHook] add candidate failed", err);
  }
};


pc.oniceconnectionstatechange = () =>
  console.log(`[audioHook] iceConnectionState pair=${pairKey} remote=${remotePeerId}`, pc.iceConnectionState);

pc.onconnectionstatechange = () =>
  console.log(`[audioHook] connectionState pair=${pairKey} remote=${remotePeerId}`, pc.connectionState);

pc.onnegotiationneeded = () =>
  console.log(`[audioHook] negotiationneeded pair=${pairKey} remote=${remotePeerId}`);

      const localStream = localStreamRef.current;
      if (localStream) {
        for (const track of localStream.getTracks()) {
          pc.addTrack(track, localStream);
        }
      }

     pc.ontrack = (ev) => {
  const pid = normalize(remotePeerId);
  console.log(`[audioHook] ontrack for pid=${pid}`, ev.streams);
  let remoteStream = inboundStreams.current[pid] ?? new MediaStream();

  if (ev.streams && ev.streams.length > 0) {
    inboundStreams.current[pid] = ev.streams[0];
  } else if (ev.track) {
    remoteStream.addTrack(ev.track);
    inboundStreams.current[pid] = remoteStream;
  }

  const el = remoteAudioElems.current[pid];
  if (el && inboundStreams.current[pid]) {
    try {
      el.srcObject = inboundStreams.current[pid];
      // ensure not muted and try to play
      try { el.muted = false; } catch {}
      el.play().then(() => {
        console.log(`[audioHook] attached inbound stream & play succeeded for ${pid}`);
      }).catch((err) => {
        console.warn(`[audioHook] attached inbound stream but play blocked for ${pid}:`, err);
      });
      console.log(`[audioHook] attached inbound stream to audio element ${pid}`);
    } catch (err) {
      console.warn(`[audioHook] failed to attach remote stream ${pid}:`, err);
    }
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
    Object.values(pcsRef.current).forEach((pc) => { try { pc.close(); } catch {} });
    pcsRef.current = {};
    inboundStreams.current = {};

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localAudioElRef.current) localAudioElRef.current.srcObject = null;

    unsubRef.current.forEach((u) => { try { u(); } catch {} });
    unsubRef.current = [];

    callDocRef.current = null;
    setIsCalling(false);
    setCallId(null);
    setStatus(null);
    setCaller(null);
  }, []);


  const playAllRemote = useCallback(async () => {
  Object.entries(remoteAudioElems.current).forEach(([pid, el]) => {
    if (!el) return;
    try {
      // attempt play, log results
      el.muted = false;
      el.play().then(() => console.log(`[audioHook] playAllRemote: play ok for ${pid}`))
                .catch((err) => console.warn(`[audioHook] playAllRemote: play blocked for ${pid}`, err));
    } catch (err) {
      console.warn(`[audioHook] playAllRemote error for ${pid}`, err);
    }
  });
}, []);


  // ----- startCall (caller) -----
  const startCall = useCallback(
    async (members: Member[]) => {
      await startLocalStream();

      const id = crypto.randomUUID();
      const callRef = doc(db, "calls", id);
      callDocRef.current = callRef;
      setCallId(id);

      const offers: Record<string, any> = {};

      for (const peer of members.filter((m) => normalize(m.id ?? m.uid) !== normalize(currentuserIs?.id))) {
        const peerId = normalize(peer.id ?? peer.uid);
        const pairKey = `${normalize(currentuserIs?.id)}_${peerId}`;

        const pc = createPeerConnection(pairKey, peerId, true, callRef);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        offers[pairKey] = {
          type: offer.type,
          sdp: offer.sdp,
          from: normalize(currentuserIs?.id),
          to: peerId,
        };
      }

      await setDoc(callRef, {
        status: "ringing",
        type: "audio",
        caller: { id: normalize(currentuserIs?.id), name: currentuserIs?.name },
        participants: {
          [normalize(currentuserIs?.id)]: { muted: false },
        },
 members: members.map((m) => normalize(m.id ?? m.uid)),
        offers,
        createdAt: Date.now(),
      });

      // snapshot listener (answers/participants/status)
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
            const targetPeerId = pairKey.split("_")[1];
            const pc = pcsRef.current[normalize(targetPeerId)];
            if (pc && answer && !pc.currentRemoteDescription) {
              pc.setRemoteDescription(new RTCSessionDescription({ type: answer.type, sdp: answer.sdp })).catch(console.error);
            }
          });
        }

        // handle renegotiate if someone rejoined (optional)
        if (data.renegotiate) {
          Object.entries<any>(data.renegotiate).forEach(async ([peerId, ts]) => {
            if (peerId !== normalize(currentuserIs?.id)) {
              console.log("[audioHook] renegotiate requested by", peerId);
              const pairKey = `${normalize(currentuserIs?.id)}_${peerId}`;
              const pc = createPeerConnection(pairKey, peerId, true, callRef);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await updateDoc(callRef, {
                [`offers.${pairKey}`]: { type: offer.type, sdp: offer.sdp, from: normalize(currentuserIs?.id), to: peerId },
                [`renegotiate.${peerId}`]: deleteField(),
              });
            }
          });
        }
      });
      unsubRef.current.push(unsubCall);

      // listen for calleeCandidates for each pairKey
      for (const peer of members.filter((m) => normalize(m.id ?? m.uid) !== normalize(currentuserIs?.id))) {
        const peerId = normalize(peer.id ?? peer.uid);
        const pairKey = `${normalize(currentuserIs?.id)}_${peerId}`;
        const colRef = collection(callRef, `calleeCandidates_${pairKey}`);
        const unsubCallee = onSnapshot(colRef, (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type === "added") {
              const cand = change.doc.data();
              const pc = pcsRef.current[peerId];
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

  // ----- acceptCall (callee) -----
  const acceptCall = useCallback(
    async (id: string, members: Member[]) => {
      await startLocalStream();
      const callRef = doc(db, "calls", id);
      callDocRef.current = callRef;
      setCallId(id);

      await updateDoc(callRef, {
        status: "active",
        [`participants.${normalize(currentuserIs?.id)}`]: { muted: false },
        [`renegotiate.${normalize(currentuserIs?.id)}`]: Date.now(),
      }).catch(async (err) => {
        // if doc missing, create it safely
        console.warn("[audioHook] updateDoc failed, falling back to setDoc", err);
        await setDoc(callRef, {
          status: "active",
          participants: { [normalize(currentuserIs?.id)]: { muted: false } },
          renegotiate: { [normalize(currentuserIs?.id)]: Date.now() },
        }, { merge: true });
      });
      setStatus("active");

      // fetch offers and answer those targeted to me
      const snap = await getDoc(callRef);
      const data = snap.data() || {};
      const offers = data.offers || {};
      const offersForMe = Object.entries<any>(offers).filter(([, offer]) => offer && normalize(offer.to) === normalize(currentuserIs?.id));

      for (const [pairKey, offer] of offersForMe) {
        const callerId = normalize(offer.from as string);
        const pc = createPeerConnection(pairKey, callerId, false, callRef);

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

        await pc.setRemoteDescription(new RTCSessionDescription({ type: offer.type, sdp: offer.sdp })).catch(console.error);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await updateDoc(callRef, {
          [`answers.${pairKey}`]: { type: answer.type, sdp: answer.sdp, from: normalize(currentuserIs?.id) },
        });

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

      // listen for call doc updates (same as caller)
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

  const declineCall = useCallback(async (id: string) => {
    try {
      const callRef = doc(db, "calls", id);
      await updateDoc(callRef, { status: "ended" });
    } catch (err) {
      console.warn("decline update error", err);
    }
    setStatus("ended");
    await cleanup();
  }, [cleanup]);

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
      unsubRef.current.forEach((u) => { try { u(); } catch {} });
      unsubRef.current = [];
      Object.values(pcsRef.current).forEach((pc) => { try { pc.close(); } catch {} });
      pcsRef.current = {};
      const s = localStreamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, []);

  return {
    playAllRemote,
    getLocalAudioRef,
    getRemoteAudioRef,
    startCall,
    acceptCall,
    joinCall,
    declineCall,
    hangUp,
    toggleMute,
    isCalling,
    muted,
    status,
    caller,
    callId,
  };
}
