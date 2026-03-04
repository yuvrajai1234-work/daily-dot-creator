import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Star, Clock, Lock, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

const ebooks = [
  { id: 1, title: "Meditations", author: "Marcus Aurelius", pages: 254, rating: 4.9, category: "Philosophy", description: "Personal writings of the Roman Emperor on Stoic philosophy, resilience, and self-improvement.", free: true, url: "https://www.gutenberg.org/files/2680/2680-h/2680-h.htm" },
  { id: 2, title: "As a Man Thinketh", author: "James Allen", pages: 38, rating: 4.7, category: "Mindset", description: "A classic essay on the power of thought and its effect on our lives and character.", free: true, url: "https://www.gutenberg.org/files/4507/4507-h/4507-h.htm" },
  { id: 3, title: "The Art of War", author: "Sun Tzu", pages: 120, rating: 4.8, category: "Strategy", description: "Ancient Chinese military treatise that provides profound applications for business and life.", free: false, cost: 75, url: "https://www.gutenberg.org/files/132/132-h/132-h.htm" },
  { id: 4, title: "Tao Te Ching", author: "Laozi", pages: 84, rating: 4.9, category: "Mindfulness", description: "Fundamental text for both philosophical and religious Taoism, teaching balance and flow.", free: false, cost: 100, url: "https://www.gutenberg.org/cache/epub/216/pg216-images.html" },
  { id: 5, title: "The Science of Getting Rich", author: "Wallace D. Wattles", pages: 76, rating: 4.6, category: "Wealth", description: "The 1910 classic that inspired modern wealth creation and manifestation literature.", free: true, url: "https://www.gutenberg.org/files/59844/59844-h/59844-h.htm" },
  { id: 6, title: "Walden", author: "Henry David Thoreau", pages: 352, rating: 4.5, category: "Simplicity", description: "A reflection upon simple living in natural surroundings and personal declaration of independence.", free: false, cost: 150, url: "https://www.gutenberg.org/files/205/205-h/205-h.htm" },
];

const EbooksPage = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [purchased, setPurchased] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("dd_purchased_ebooks") || "[]");
      setPurchased(new Set(saved));
    } catch { }
  }, []);

  const handleAction = async (book: typeof ebooks[0]) => {
    if (book.free || purchased.has(book.id)) {
      window.open(book.url, "_blank");
      return;
    }

    if (isProcessing) return;

    if (!user) {
      toast.error("Please log in to purchase books.");
      return;
    }

    const aCoins = (profile as any)?.a_coin_balance || 0;
    if (aCoins < (book.cost || 0)) {
      toast.error(`Not enough A Coins. You need ${(book.cost || 0)} but have ${aCoins}.`);
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ a_coin_balance: aCoins - (book.cost || 0) } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      const nextPurchased = new Set(purchased).add(book.id);
      setPurchased(nextPurchased);
      localStorage.setItem("dd_purchased_ebooks", JSON.stringify(Array.from(nextPurchased)));

      toast.success(`Successfully unlocked "${book.title}"!`);
      window.open(book.url, "_blank");
    } catch (e: any) {
      toast.error("Failed to process transaction: " + e.message);
    } finally {
      setIsProcessing(false);
    }
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
              <h2 className="text-2xl font-bold">Meditations</h2>
              <p className="text-sm opacity-80 mt-1">
                The ultimate guide to stoicism and resilience by Marcus Aurelius. Free open-source classic.
              </p>
              <Button className="mt-4 bg-foreground/20 hover:bg-foreground/30 border-0" onClick={() => handleAction(ebooks[0])}>
                <BookOpen className="w-4 h-4 mr-2" /> Read Now
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
                  onClick={() => handleAction(book)}
                  disabled={isProcessing}
                >
                  {book.free || purchased.has(book.id) ? (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" /> Read Now
                      <ArrowUpRight className="w-3 h-3 ml-1 opacity-50" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2 opacity-80" /> Unlock ({book.cost} coins)
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="py-12 text-center text-muted-foreground flex flex-col items-center">
        <BookOpen className="w-8 h-8 opacity-20 mb-3" />
        <p className="text-sm font-medium">More books will come in this section soon!</p>
        <p className="text-xs opacity-70 mt-1">We're expanding our library of open-source and public domain classics.</p>
      </motion.div>
    </div>
  );
};

export default EbooksPage;
