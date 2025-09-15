import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // your firestore init

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:your.turnserver.com:3478", // <--- replace with real TURN
      username: "user",
      credential: "pass",
    },
  ],
};

export async function createCall(callId: string, localStream: MediaStream) {
  const callRef = doc(db, "calls", callId);
  const offerCandidates = collection(callRef, "offerCandidates");
  const answerCandidates = collection(callRef, "answerCandidates");

  const pc = new RTCPeerConnection(rtcConfig);

  // Add local stream
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  // Handle ICE candidates
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await addDoc(offerCandidates, event.candidate.toJSON());
    }
  };

  // Remote stream callback
  const remoteStream = new MediaStream();
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };
  await setDoc(callRef, { offer });

  // Listen for answer
  onSnapshot(callRef, (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // Listen for answer candidates
  onSnapshot(answerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  return { pc, remoteStream };
}

export async function joinCall(callId: string, localStream: MediaStream) {
  const callRef = doc(db, "calls", callId);
  const offerCandidates = collection(callRef, "offerCandidates");
  const answerCandidates = collection(callRef, "answerCandidates");

  const pc = new RTCPeerConnection(rtcConfig);

  // Add local stream
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  // Handle ICE candidates
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await addDoc(answerCandidates, event.candidate.toJSON());
    }
  };

  const remoteStream = new MediaStream();
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
  };

  // Fetch offer
  const callSnapshot = await getDoc(callRef);
  const callData = callSnapshot.data();
  const offerDescription = callData?.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  // Create answer
  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await updateDoc(callRef, { answer });

  // Listen for offer candidates
  onSnapshot(offerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  return { pc, remoteStream };
}
