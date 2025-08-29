"use client";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import 'swiper/css/mousewheel';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import CustomVideoPlayer from '../customVideo/CustomVideoPlayer';
export default function PostMediaSlider({selectedPosts, post, setPreviewUrl } : any) {
  const [currentSlide, setCurrentSlide] = useState(1);
const totalSlides =  Array.isArray(post.mediaUrl) ?  post?.mediaUrl?.length || 0 : 0 


function isMediaUrl(  url: string, extensions: string[] = ['.mp4', '.m4a', '.webm', '.mov', '.ogg']) {
  return extensions.some(ext => url.toLowerCase().endsWith(ext));
}


  return (
    <div className="relative mt-3 rounded-lg overflow-hidden w-full aspect-[4/3]">
      <Swiper
        modules={[Pagination]}
        pagination={{ clickable: true }}
        onSlideChange={(swiper) => setCurrentSlide(swiper.realIndex + 1)}
        className="h-full w-full mySwiper"
          

      >
      {(Array.isArray(post.mediaUrl) ? post.mediaUrl : [post.mediaUrl]).map(
  (url: string, index: number) => (
    <SwiperSlide key={index}>
      <div className="relative w-full h-full">
      { isMediaUrl(url) ?
        
        <CustomVideoPlayer url={url} />
 :

         <Image
          src={url} // ✅ just use `url` here
          alt={`Post image ${index + 1}`}
          fill
          className="object-cover"
          onClick={(e)=> {e.preventDefault(); setPreviewUrl(url)}}
        />
      }
      </div>
    </SwiperSlide>
  )
)}
      </Swiper>

      {totalSlides > 1 && (
  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
          {currentSlide} / {totalSlides}
        </div>      )}
    </div>
  );
}
