import { useRef, useState, useEffect } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

export default function CustomVideoPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const lastTapRef = useRef<number>(0);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setShowOverlay(false);
    } else {
      video.pause();
      setIsPlaying(false);
      setShowOverlay(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = new Date().getTime();
    const timeDiff = now - lastTapRef.current;
    const x = e.touches[0].clientX;
    const width = window.innerWidth;

    if (timeDiff < 300) {
      if (x < width / 2) videoRef.current!.currentTime -= 10;
      else videoRef.current!.currentTime += 10;
    }
    lastTapRef.current = now;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const x = e.clientX;
    const width = window.innerWidth;

    if (x < width / 2) videoRef.current!.currentTime -= 10;
    else videoRef.current!.currentTime += 10;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => setProgress(video.currentTime);
    video.addEventListener('timeupdate', updateProgress);

    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  const [tControls,SetControls] = useState("")


useEffect(() => {
  if (tControls === url) {
    const timeoutId = setTimeout(() => {
      SetControls("");
    }, 2000);

    return () => clearTimeout(timeoutId); // Cleanup on unmount or re-run
  }
}, [tControls, url]);

  

  useEffect(() => {



    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && isPlaying) {
          videoRef.current?.pause();
          setIsPlaying(false);
          setShowOverlay(true);
        }
      },
      { threshold: 0.5 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black"
      onClick={togglePlay}
      onTouchEnd={handleTouch}
      onDoubleClick={handleDoubleClick}
    >
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
        onMouseOver={() => SetControls(url)}
        onTouchStart={() => SetControls(url)}
      />

      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-white text-4xl bg-black/50 rounded-full p-4">
            {isPlaying ? <Pause /> : <Play />}
          </div>
        </div>
      )}
{tControls === url &&
      <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-2 bg-black/60 p-2 rounded">
        <input
          type="range"
          min={0}
          max={videoRef.current?.duration || 1}
          step="0.1"
          value={progress}
          onChange={handleProgressChange}
          className="w-full h-10 accent-orange-500"


        />

        <div className="flex items-center justify-between">
          <button onClick={togglePlay} className="text-white">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={toggleMute} className="text-white">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 accent-orange-500"

          />
        </div>


      </div>
}
    </div>

  );
}
