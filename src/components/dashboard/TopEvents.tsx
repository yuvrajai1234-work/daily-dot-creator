import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
    type CarouselApi
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useRef, useState } from "react";

const TopEvents = () => {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    const plugin = useRef(
        Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })
    );

    const events = [
        {
            title: "Metamorphosis YouTube",
            description: "Join our community for deep dives into discipline, habit mastery, and transformation.",
            image: "/metamorphosis-yt.jpeg",
            link: "https://youtube.com/@metamorphosisxmetamorphosis?si=YyJ6Cl_Gx2t-0ZrE"
        },
        {
            title: "Metamorphosis Instagram",
            description: "Daily inspiration, micro-habits, and community updates to keep you motivated.",
            image: "/metamorphosis-ig.jpeg",
            link: "https://www.instagram.com/metamorphosis_metamorphosis?igsh=cG11YnhyNXk1bGFl"
        }
    ];

    useEffect(() => {
        if (!api) return;

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap());

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold px-1">Top Events</h2>
            <Carousel
                setApi={setApi}
                plugins={[plugin.current]}
                opts={{
                    loop: true,
                    align: "start",
                }}
                className="w-full group/carousel relative"
            >
                <CarouselContent>
                    {events.map((event, index) => (
                        <CarouselItem key={index}>
                            <a
                                href={event.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block outline-none cursor-pointer"
                            >
                                <Card className="overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm group/card hover:border-primary/50 transition-all duration-300">
                                    <CardContent className="p-0">
                                        <div className="relative aspect-[16/9] overflow-hidden">
                                            <img
                                                src={event.image}
                                                alt={event.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 flex flex-col justify-end">
                                                <h3 className="text-xl font-bold text-white mb-2 group-hover/card:text-primary transition-colors leading-tight">{event.title}</h3>
                                                <p className="text-sm text-gray-200 line-clamp-2 max-w-[90%]">{event.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </a>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Dot Indicators */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
                    {Array.from({ length: count }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => api?.scrollTo(i)}
                            className={`h-1.5 transition-all duration-300 rounded-full ${current === i
                                    ? "w-4 bg-primary"
                                    : "w-1.5 bg-white/40 hover:bg-white/60"
                                }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Floating Navigation Controls */}
                <div className="opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <CarouselPrevious
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-primary border-white/20 text-white backdrop-blur-md transition-all hover:scale-110 z-40 pointer-events-auto border-0 shadow-lg"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            api?.scrollPrev();
                        }}
                    />
                    <CarouselNext
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-primary border-white/20 text-white backdrop-blur-md transition-all hover:scale-110 z-40 pointer-events-auto border-0 shadow-lg"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            api?.scrollNext();
                        }}
                    />
                </div>
            </Carousel>
        </div>
    );
};

export default TopEvents;
