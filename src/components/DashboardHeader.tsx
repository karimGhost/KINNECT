interface DashboardHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  title,
  description,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-headline font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}
