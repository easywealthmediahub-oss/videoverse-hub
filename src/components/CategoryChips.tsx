import { useState } from "react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setActiveCategory(category)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
            activeCategory === category
              ? "bg-foreground text-background"
              : "bg-secondary text-secondary-foreground hover:bg-accent"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryChips;
