import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

const TopEvents = () => {
    const plugin = useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true })
    );

    const events = [
        {
            title: "Metamorphosis YouTube",
            description: "Join our community for deep dives into discipline, habit mastery, and transformation.",
            image: "/metamorphosis-yt.png",
            link: "https://youtube.com/@metamorphosisxmetamorphosis?si=YyJ6Cl_Gx2t-0ZrE"
        },
        {
            title: "Metamorphosis Instagram",
            description: "Daily inspiration, micro-habits, and community updates to keep you motivated.",
            image: "/metamorphosis-ig.png",
            link: "https://www.instagram.com/metamorphosis_metamorphosis?igsh=cG11YnhyNXk1bGFl"
        }
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold px-1">Top Events</h2>
            <Carousel
                plugins={[plugin.current]}
                className="w-full"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
            >
                <CarouselContent>
                    {events.map((event, index) => (
                        <CarouselItem key={index}>
                            <a href={event.link} target="_blank" rel="noopener noreferrer" className="block outline-none">
                                <Card className="overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm group cursor-pointer hover:border-primary/50 transition-all duration-300">
                                    <CardContent className="p-0">
                                        <div className="relative aspect-[16/9] overflow-hidden">
                                            <img
                                                src={event.image}
                                                alt={event.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{event.title}</h3>
                                                <p className="text-sm text-gray-200 line-clamp-2">{event.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </a>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
};

export default TopEvents;
