"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  ArrowRight,
  ShoppingBag,
  MapPin,
  Clock,
  Shield,
  Star,
  Users,
  TrendingUp,
  Zap,
  Heart,
} from "lucide-react";

const stats = [
  { label: "Active Shoppers", value: "12", icon: Users },
  { label: "Errands Completed", value: "234", icon: ShoppingBag },
  { label: "Money Saved", value: "₦2.1M", icon: TrendingUp },
  { label: "Average Rating", value: "4.8", icon: Star },
];

const steps = [
  {
    icon: ShoppingBag,
    title: "Post Your Errand",
    description: "Tell us what you need from the market. Add items, set your budget, and name your reward.",
  },
  {
    icon: MapPin,
    title: "Shopper Accepts",
    description: "A neighbor already heading to the market accepts your errand. Your money is held safely in escrow.",
  },
  {
    icon: Clock,
    title: "Track & Receive",
    description: "Watch your shopper in real-time. Confirm delivery when your items arrive. Done!",
  },
];

const features = [
  {
    icon: Shield,
    title: "Secure Escrow",
    description: "Your money is held safely until you confirm delivery. Powered by Monnify.",
  },
  {
    icon: Users,
    title: "Community Trust",
    description: "Shop within your estate. See ratings, reviews, and verified neighbors.",
  },
  {
    icon: TrendingUp,
    title: "Save Money",
    description: "Pay a fraction of standard delivery costs. Support your neighbors while saving.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Your errand gets picked up within minutes, not hours. Get items same-day.",
  },
  {
    icon: Heart,
    title: "Support Locals",
    description: "Every errand supports a neighbor. Strengthen your community one shop at a time.",
  },
  {
    icon: Star,
    title: "Verified Shoppers",
    description: "All shoppers are rated and reviewed. Choose someone you trust every time.",
  },
];

const testimonials = [
  {
    name: "Adunni O.",
    estate: "Lekki Gardens",
    text: "I used to spend 3 hours every Saturday at Mile 12. Now I post an errand and it's done in 45 minutes. Game changer!",
    rating: 5,
  },
  {
    name: "Chidi K.",
    estate: "Allen Gardens",
    text: "As a shopper, I earn ₦2,000-₦5,000 extra every weekend just helping neighbors. Everyone wins.",
    rating: 5,
  },
  {
    name: "Funke A.",
    estate: "Opebi Estate",
    text: "The escrow system means I never worry about my money. I only release payment when I'm happy with what I receive.",
    rating: 5,
  },
];

export function HeroSection() {
  const { user } = useAuth();
  const router = useRouter();

  const handlePostErrand = () => {
    if (user) {
      router.push("/create");
    } else {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { mode: "signup" } }));
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 bg-accent rounded-full status-pulse" />
            12 shoppers active now in Lagos
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Someone is already at the{" "}
            <span className="gradient-text">market</span>.
            <br />
            Let them help you shop.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            A community-powered platform where neighbors help neighbors.
            Skip the traffic, avoid the stress, and get your groceries delivered
            by someone you trust.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-base px-8" onClick={handlePostErrand}>
              Post an Errand
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Link href="/errands">
              <Button size="lg" variant="outline" className="text-base px-8">
                Browse Errands
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function StatsSection() {
  return (
    <section className="py-16 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            How MarketRun Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Three simple steps to get your groceries without leaving your home.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-card rounded-2xl p-8 border border-border/50 card-hover h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                    {index + 1}
                  </div>
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="w-8 h-8 text-primary/30" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Why MarketRun?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            We combine community trust with secure payments to create
            a shopping experience that works for everyone.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 border border-border/50 card-hover"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Loved by Lagosians
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Real stories from our community members.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 border border-border/50 card-hover"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">&ldquo;{testimonial.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{testimonial.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.estate}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  const { user } = useAuth();
  const router = useRouter();

  const handlePostErrand = () => {
    if (user) {
      router.push("/create");
    } else {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { mode: "signup" } }));
    }
  };

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-primary rounded-3xl p-12 md:p-16 text-center overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to skip the market stress?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Join hundreds of Lagosians who are already saving time and money
              with community-powered shopping.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 text-base px-8"
                onClick={handlePostErrand}
              >
                Post Your First Errand
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link href="/errands">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 text-base px-8"
                >
                  Become a Shopper
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
