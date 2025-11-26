import { Badge } from "@/components/ui/badge";
import { AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LucideIcon } from "lucide-react";

interface CriterioAccordionHeaderProps {
  value: string;
  icon: LucideIcon;
  iconBgColor: string;
  title: string;
  subtitle: string;
  currentScore: number;
  maxScore: number;
  children?: React.ReactNode;
}

export function CriterioAccordionHeader({
  value,
  icon: Icon,
  iconBgColor,
  title,
  subtitle,
  currentScore,
  maxScore,
  children,
}: CriterioAccordionHeaderProps) {
  return (
    <AccordionItem value={value} className="border rounded-lg">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div className={`${iconBgColor} text-white rounded-lg p-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base">
              {currentScore} / {maxScore} pts
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      {children}
    </AccordionItem>
  );
}
