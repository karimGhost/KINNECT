"use client";

import { useState, useRef , useEffect} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Camera,
  Video,
  Mic,
  RefreshCw,
  Zap,
  X,
  Check,
  Download,
  UploadCloud,
  MicOff,
} from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export function VideoRecorderControls() {
  const router = useRouter();
  const { user, userData } = useAuth();

const [videoFile, setVideoFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [zoom, setZoom] = useState(1);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);

const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
const [micOn, setMicOn] = useState(true);
const [torchOn, setTorchOn] = useState(false); 


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

     const file = e.target.files?.[0];
  if (file) {
    setVideoFile(file);

    setPreviewUrl(URL.createObjectURL(file));
  }

  };
const startRecording = async () => {
  setVideoFile(null);
  setPreviewUrl(null);
  setTimer(0);
  const { camera, microphone } = await checkMediaPermissions();


  

  // Optionally check permission status
   if (camera === "denied" || microphone === "denied") {
    alert("Camera or microphone access has been denied. Please enable it in your browser settings.");
    return;
  }

  if (camera === "prompt" || microphone === "prompt") {
    const proceed = confirm("We need access to your camera and microphone to continue. Allow?");
    if (!proceed) return;
  }

  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode,
        width: { ideal: 720 },
        height: { ideal: 1280 }
      },
      audio: micOn
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setStream(stream);

    // Torch setup (only works on environment camera)
    const videoTrack = stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities?.();
    if (capabilities?.torch) {
      videoTrack.applyConstraints({
        advanced: [{ torch: torchOn }],
      }).catch(() => {});
    }

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }

    const localChunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) localChunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(localChunks, { type: "video/webm" });
      const file = new File([blob], "recorded-video.webm", { type: "video/webm" });

      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
      setVideoFile(file);

      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  } catch (err) {
    console.error("Recording error:", err);
    alert("Could not start recording");
  }
};


const checkMediaPermissions = async () => {
  if (!navigator.permissions || !navigator.permissions.query) {
    return { camera: "unknown", microphone: "unknown" };
  }

  let camera = "unknown";
  let microphone = "unknown";

  try {
    const micPerm = await navigator.permissions.query({ name: "microphone" as PermissionName });
    microphone = micPerm.state;
  } catch (e) {
    console.warn("Microphone permission not supported", e);
  }

  try {
    const camPerm = await navigator.permissions.query({ name: "camera" as PermissionName });
    camera = camPerm.state;
  } catch (e) {
    console.warn("Camera permission not supported", e);
  }

  return { camera, microphone };
};

useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
}, [previewUrl]);


const stopRecording = () => {
  mediaRecorder?.stop();
  setRecording(false);
  if (timerRef.current) clearInterval(timerRef.current);
  setTimer(0);
};


    const handleSaveDraft = async () => {
    if (!videoFile) return alert("Record or select a video first");
    setUploading(true);
    try {
      const videoUrl = await uploadToCloudinary(videoFile);
      await saveVideoToFirestore(videoUrl, true);
      alert("Draft saved");
    } catch (err) {
      console.error("Save draft error:", err);
      alert("Failed to save draft");
    } finally {
      setUploading(false);
    }
  };

// useEffect(() => {
//   if (!recording && recordedChunks.length > 0) {
//     const blob = new Blob(recordedChunks, { type: "video/webm" });
//     const blobUrl = URL.createObjectURL(blob);
//     const file = new File([blob], "recorded-video.webm", { type: "video/webm" });

//     setPreviewUrl(blobUrl);
//     setVideoFile(file);
//   }
// }, [recording, recordedChunks]);



  async function uploadToCloudinary(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "VideosBlab"); // make sure this is real

  const response = await fetch("https://api.cloudinary.com/v1_1/dzhoslb52/auto/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Cloudinary error response:", err);
    throw new Error("Upload failed");
  }

  const data = await response.json();
  return data.secure_url;

}

  const saveVideoToFirestore = async (videoUrl: string) => {
    if (!user || !userData) return;

                  const keywords = description.trim().toLowerCase().split(" ")

    const videoDoc = {

                  
                  family:{ 
   familyId: userData.familyId,
   familyName: userData.familyName,
   inFamily:userData.inFamily,
   },
         Type: "video",

      mediaType: "video",
    title: description,
          

  content:  null,
createdAt: serverTimestamp(),
  mediaUrl: videoUrl ,
  feeling:  null, 
  keywords:keywords || null,
  location:location || null,
  uid: user?.uid,   // Make sure this exists and matches the authenticated user!
  author: {
    uid: user?.uid,
    name: userData.fullName,
    username: userData.fullName,
    avatarUrl: userData.avatarUrl,
   approved: userData.approved,
  },
  comments: {},
  likes: [],
  commentsCount: 0,
  likesCount: 0, // ✅ Add this for easier counting

};



    // const videoDoc = {
    //   url: videoUrl,
    //   description,
    //   keywords:keywords,
    //   timestamp: serverTimestamp(),
    //   mediaType: "video",
    //   user: {
    //     uid: user.uid,
    //     name: userData.fullName,
    //     username: userData.fullName,
    //     avatarUrl: userData.avatarUrl,
    //   },
    //   likesCount: 0,
    //   commentsCount: 0,
    // };
await addDoc(collection(db, "families", userData.familyId, "posts"), videoDoc);


  };

  const handleUpload = async () => {
    if (!videoFile) return alert("Please select a video file.");

    setUploading(true);

    try {
      const videoUrl = await uploadToCloudinary(videoFile);
      if (videoUrl) {
        await saveVideoToFirestore(videoUrl);
        router.push("/dashboard");
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Something went wrong.");
    } finally {
      setUploading(false);
            setPreviewUrl(null)

    }
  };

  return (
     <div className="flex flex-col items-center justify-center h-full bg-black text-white p-4 relative">
      <div className="absolute top-4 left-4 z-10">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <X className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
    variant="ghost"
    size="icon"
    onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}
  >
    <RefreshCw className="h-5 w-5" />
  </Button>
       <Button
    variant="ghost"
    size="icon"
    onClick={() => setTorchOn(t => !t)}
  >
    <Zap className={`h-5 w-5 ${torchOn ? "text-yellow-400" : ""}`} />
  </Button>
      </div>
<div className="w-full max-w-md aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center mb-6 shadow-2xl">
  {previewUrl  ?  (
  <video
  key={previewUrl} // forces re-render when blob URL changes
  src={previewUrl}
  className="w-full h-full object-cover"
  controls
  autoPlay
  muted
  playsInline
/>
  ) : (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      autoPlay

      muted
      playsInline
      style={{ transform: `scale(${zoom})` }}
    />
  )}
</div>

      {recording && <p className="text-sm text-red-400 mb-2">Recording: {timer}s</p>}

      <div className="w-full max-w-md space-y-6">
        <input type="file" accept="video/*" hidden id="upload-input" onChange={handleFileChange} />

        <div className="flex items-center justify-center gap-4">
          <label htmlFor="upload-input">
            <Button variant="outline" size="icon" className="bg-transparent border-white/50 hover:bg-white/10" asChild>
              <UploadCloud className="h-6 w-6" />
            </Button>
          </label>
          <Button
            variant="destructive"
            size="icon"
            onClick={recording ? stopRecording : startRecording}
            className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
          >
            {recording ? <X className="h-10 w-10" /> : <Video className="h-10 w-10" />}
            <span className="sr-only">{recording ? "Stop" : "Record"}</span>
          </Button>
          <Button
    variant="ghost"
    size="icon"
    onClick={() => setMicOn(m => !m)}
  >
    {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5 text-red-500" />}
  </Button>
        </div>

        <textarea
          placeholder="Write a description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 bg-white/10 text-white rounded-md text-sm"
        />

        <div className="space-y-2">
          <p className="text-sm text-center text-gray-400">Zoom</p>
          <Slider defaultValue={[50]} max={100} step={1} onValueChange={([val]) => setZoom(val / 50)} className="[&>span]:bg-primary" />
        </div>

        <div className="flex justify-around">
          <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white" onClick={handleSaveDraft}>
            <Download className="h-4 w-4 mr-2" /> Save Draft
          </Button>
          <Button
            onClick={handleUpload}
            variant="default"
            className="bg-primary hover:bg-primary/90"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Next"}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
function checkCameraPermission() {
  throw new Error("Function not implemented.");
}

