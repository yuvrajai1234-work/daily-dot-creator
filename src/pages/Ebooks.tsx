import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Star, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const ebooks = [
  { id: 1, title: "Atomic Habits Summary", author: "DailyDots Team", pages: 32, rating: 4.8, category: "Habits", description: "Key takeaways from James Clear's bestseller on building good habits and breaking bad ones.", free: true },
  { id: 2, title: "The 5 AM Club Guide", author: "DailyDots Team", pages: 24, rating: 4.5, category: "Productivity", description: "A practical guide to becoming an early riser and owning your mornings.", free: true },
  { id: 3, title: "Mindfulness for Beginners", author: "DailyDots Team", pages: 40, rating: 4.7, category: "Mindfulness", description: "Start your meditation journey with simple, guided practices.", free: false, cost: 100 },
  { id: 4, title: "Digital Detox Playbook", author: "DailyDots Team", pages: 28, rating: 4.6, category: "Wellness", description: "Reclaim your time and attention from digital distractions.", free: false, cost: 150 },
  { id: 5, title: "Goal Setting Mastery", author: "DailyDots Team", pages: 36, rating: 4.9, category: "Growth", description: "The science-backed framework for setting and achieving meaningful goals.", free: false, cost: 200 },
  { id: 6, title: "Sleep Better Tonight", author: "DailyDots Team", pages: 20, rating: 4.4, category: "Health", description: "Evidence-based tips for improving your sleep quality starting tonight.", free: true },
];

const EbooksPage = () => {
  const handleDownload = (title: string) => {
    toast.success(`📖 "${title}" added to your library!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">E-books</h1>
        <p className="text-muted-foreground">Resources to help you grow and build better habits</p>
      </div>

      {/* Featured */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="gradient-hero border-0 shadow-primary-glow overflow-hidden">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-32 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-12 h-12 opacity-60" />
            </div>
            <div className="text-center md:text-left">
              <Badge className="bg-warning/20 text-warning border-0 mb-2">Featured</Badge>
              <h2 className="text-2xl font-bold">Atomic Habits Summary</h2>
              <p className="text-sm opacity-80 mt-1">
                The essential guide to building habits that stick. Free for all DailyDots users.
              </p>
              <Button className="mt-4 bg-foreground/20 hover:bg-foreground/30 border-0" onClick={() => handleDownload("Atomic Habits Summary")}>
                <Download className="w-4 h-4 mr-2" /> Download Free
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ebooks.map((book, i) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }}
          >
            <Card className="glass border-border/50 flex flex-col h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-xs">{book.category}</Badge>
                  {book.free ? (
                    <Badge className="bg-success/20 text-success border-0 text-xs">Free</Badge>
                  ) : (
                    <Badge className="bg-warning/20 text-warning border-0 text-xs">{book.cost} coins</Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{book.title}</CardTitle>
                <p className="text-xs text-muted-foreground">by {book.author}</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-3">{book.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-warning" /> {book.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {book.pages} pages
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full gradient-primary border-0 hover:opacity-90"
                  onClick={() => handleDownload(book.title)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {book.free ? "Download" : `Unlock (${book.cost} coins)`}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EbooksPage;
