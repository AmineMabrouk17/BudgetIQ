import { Quote } from "lucide-react";
import SectionHeading from "@/components/landing/SectionHeading";

interface TestimonialData {
  quote: string;
  name: string;
  role: string;
}

// Placeholder testimonials — swap these with real quotes from the maintainer
// before launch. They are fictional and only stand in for social proof.
const testimonials: TestimonialData[] = [
  {
    quote:
      "The AI assistant is the reason I stayed. I type what I spent and it just shows up — logged, categorized, done.",
    name: "Sarah M.",
    role: "Early adopter",
  },
  {
    quote:
      "I finally know my net balance and total assets without juggling three different apps.",
    name: "James T.",
    role: "Freelancer",
  },
  {
    quote:
      "Free, open source, and my data stays mine. There aren't many finance apps you can say that about.",
    name: "Priya K.",
    role: "Developer",
  },
];

function TestimonialCard({ quote, name, role }: TestimonialData) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-night-raised p-6 shadow-lg">
      <Quote className="h-6 w-6 text-pop-yellow" aria-hidden="true" />
      <blockquote className="mt-4 flex-1 leading-[1.6] text-white/80">
        {quote}
      </blockquote>
      <figcaption className="mt-6">
        <p className="font-semibold text-white/90">{name}</p>
        <p className="text-sm text-muted">{role}</p>
      </figcaption>
    </figure>
  );
}

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="scroll-mt-20 bg-night py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Testimonials"
          title="Loved by people who track their money"
          description="What early users say about BudgetIQ — real quotes coming soon."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
