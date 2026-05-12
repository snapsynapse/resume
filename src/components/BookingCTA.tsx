import { Calendar, ArrowRight } from "lucide-react";

const BookingCTA = () => {
  return (
    <section id="booking" className="py-20 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
          Talked to the AI. Now talk to me.
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
          The chat answers the first round of questions honestly. The real conversation happens with me.
        </p>

        <a
          href="https://cal.com/paice"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-medium transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20"
        >
          <Calendar className="w-5 h-5" />
          <span>Book time on my calendar</span>
          <ArrowRight className="w-4 h-4" />
        </a>

        <p className="text-sm text-muted-foreground mt-6">
          Or email{" "}
          <a
            href="mailto:sam@sam-rogers.com"
            className="text-primary hover:underline"
          >
            sam@sam-rogers.com
          </a>
        </p>
      </div>
    </section>
  );
};

export default BookingCTA;
