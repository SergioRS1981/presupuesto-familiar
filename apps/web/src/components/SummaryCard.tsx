import { Card } from "primereact/card";
import { ReactNode } from "react";

type SummaryCardProps = {
  title: string;
  value: string;
  caption: string;
  accentClassName: string;
  icon: ReactNode;
};

export const SummaryCard = ({ title, value, caption, accentClassName, icon }: SummaryCardProps) => (
  <Card className={`summary-card ${accentClassName}`}>
    <div className="summary-card__header">
      <div>
        <p className="summary-card__title">{title}</p>
        <h3 className="summary-card__value">{value}</h3>
      </div>
      <span className="summary-card__icon">{icon}</span>
    </div>
    <p className="summary-card__caption">{caption}</p>
  </Card>
);
