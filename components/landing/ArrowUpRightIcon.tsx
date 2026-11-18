import { ArrowUpRight } from "lucide-react";

interface ArrowUpRightIconProps {
  className?: string;
}

/** The landing page's one outbound-link gesture, including its hover and
 *  reduced-motion behaviour, declared in one place. */
export default function ArrowUpRightIcon({
  className = "h-4 w-4",
}: ArrowUpRightIconProps) {
  return (
    <ArrowUpRight
      aria-hidden="true"
      className={`${className} transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:translate-x-0`}
    />
  );
}
