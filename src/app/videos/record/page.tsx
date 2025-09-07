import { VideoRecorderControls } from "@/components/video/video-recorder-controls";

export default function RecordVideoPage() {
  return (
    <div className="h-full w-full fixed inset-0 z-50"> {/* Full screen overlay */}
      <VideoRecorderControls/>
    </div>
  );
}
