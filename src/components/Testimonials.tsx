import { useState, useEffect } from "react";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { FadeInView } from "@/components/ui/motion-wrapper";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const testimonials = [
  {
    name: "Ayesha Khan",
    role: "Parent",
    text: "I can now track my son's attendance and homework from my phone. The instant notifications when he's absent have been a lifesaver. No more surprises at parent-teacher meetings!",
    rating: 5,
  },
  {
    name: "Mohammad Usman",
    role: "Teacher",
    text: "Uploading homework and entering marks used to take hours with paper registers. Now I do it in minutes. The system is simple enough that even less tech-savvy colleagues picked it up quickly.",
    rating: 5,
  },
  {
    name: "Fatima Riaz",
    role: "Principal",
    text: "Having all school data in one dashboard has transformed how I oversee operations. Attendance trends, exam results, teacher performance - everything is just a click away.",
    rating: 5,
  },
  {
    name: "Ali Ahmed",
    role: "Student",
    text: "I love checking my marks and attendance online. The result cards look great and I can download them anytime. It's way better than waiting for paper reports.",
    rating: 4,
  },
  {
    name: "Saima Nazir",
    role: "Coordinator",
    text: "Managing multiple class teachers and tracking section performance used to be chaotic. This platform gave us real structure and visibility into every classroom.",
    rating: 5,
  },
];

export const Testimonials = () => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  };

  const next = () => {
    setDirection(1);
    setCurrent((c) => (c + 1) % testimonials.length);
  };

  const item = testimonials[current];

  return (
    <section className="py-20 bg-gradient-hero relative overflow-hidden">
      <div className="container mx-auto px-4">
        <FadeInView>
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-primary/10 dark:bg-primary/15 text-primary rounded-full text-sm font-medium mb-4 border border-transparent dark:border-primary/20">
              {t("testimonials.badge")}
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-4">
              {t("testimonials.heading")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("testimonials.subtitle")}
            </p>
          </div>
        </FadeInView>

        <div className="max-w-3xl mx-auto">
          <div className="relative bg-card/80 dark:bg-card/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/[0.08] shadow-card-hover p-8 sm:p-10 min-h-[260px] flex flex-col justify-center dark:shadow-[0_2px_6px_hsl(0,0%,0%,0.35),0_12px_36px_-6px_hsl(199,80%,50%,0.12)]">
            {/* Quote icon */}
            <Quote className="w-10 h-10 text-primary/20 dark:text-primary/30 absolute top-6 left-6" />

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="text-center"
              >
                {/* Stars */}
                <div className="flex items-center justify-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < item.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>

                <blockquote className="text-foreground text-lg leading-relaxed mb-6 italic">
                  "{item.text}"
                </blockquote>

                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-sm text-primary font-medium">{item.role}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Nav arrows */}
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-muted/80 dark:bg-white/10 hover:bg-muted dark:hover:bg-white/15 flex items-center justify-center transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-muted/80 dark:bg-white/10 hover:bg-muted dark:hover:bg-white/15 flex items-center justify-center transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-8 bg-primary"
                    : "w-2 bg-primary/30 hover:bg-primary/50"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
