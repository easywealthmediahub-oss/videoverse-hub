import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  "All",
  "Music",
  "Gaming",
  "News",
  "Live",
  "Cooking",
  "Recently uploaded",
  "Watched",
  "New to you",
  "Technology",
  "Sports",
  "Travel",
  "Comedy",
  "Education",
];

const CategoryChips = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative flex items-center py-2 md:py-4">
      {/* Left scroll button - desktop only */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur hidden md:flex"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollRef}
        className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide scroll-smooth md:mx-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
              activeCategory === category
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Right scroll button - desktop only */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur hidden md:flex"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CategoryChips;
