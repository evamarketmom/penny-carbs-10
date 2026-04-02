import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Banner } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useIsMobile } from '@/hooks/use-mobile';

const BannerCarousel: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;
        setBanners(data as Banner[]);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <Skeleton className="h-64 w-full rounded-xl sm:h-48" />
      </div>
    );
  }

  const placeholderBanners = [
    { title: 'Order Event Food', bg: 'from-indoor-events/80 to-indoor-events', emoji: '🎉' },
    { title: 'Fresh Cloud Kitchen', bg: 'from-cloud-kitchen/80 to-cloud-kitchen', emoji: '👨‍🍳' },
    { title: 'Homemade Specials', bg: 'from-homemade/80 to-homemade', emoji: '🏠' },
  ];

  if (banners.length === 0) {
    return (
      <div className="px-4 py-4">
        <Carousel
          plugins={[Autoplay({ delay: 4000 })]}
          opts={{
            align: 'start',
            loop: true,
            slidesToScroll: 1,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {placeholderBanners.map((item, index) => (
              <CarouselItem key={index} className={`pl-3 ${isMobile ? 'basis-full' : 'basis-1/3'}`}>
                <div className={`relative overflow-hidden rounded-xl bg-gradient-to-b ${item.bg} ${isMobile ? 'aspect-[3/4]' : 'aspect-[3/4]'}`}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-6xl mb-4">{item.emoji}</span>
                    <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm text-white/80">Explore our menu</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {!isMobile && banners.length > 3 && (
            <>
              <CarouselPrevious className="-left-3" />
              <CarouselNext className="-right-3" />
            </>
          )}
        </Carousel>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <Carousel
        plugins={[Autoplay({ delay: 4000 })]}
        opts={{
          align: 'start',
          loop: true,
          slidesToScroll: 1,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {banners.map((banner) => (
            <CarouselItem key={banner.id} className={`pl-3 ${isMobile ? 'basis-full' : 'basis-1/3'}`}>
              <a
                href={banner.link_url || '#'}
                className="relative block overflow-hidden rounded-xl aspect-[3/4]"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-bold text-white">{banner.title}</h3>
                </div>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
        {!isMobile && banners.length > 3 && (
          <>
            <CarouselPrevious className="-left-3" />
            <CarouselNext className="-right-3" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default BannerCarousel;
