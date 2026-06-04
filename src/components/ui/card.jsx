export function Card({ className="", ...p }) { return <div className={`rounded-xl border bg-white ${className}`} {...p}/> }
export function CardHeader({ className="", ...p }) { return <div className={`p-4 border-b ${className}`} {...p}/> }
export function CardTitle({ className="", ...p }) { return <div className={`font-semibold ${className}`} {...p}/> }
export function CardContent({ className="", ...p }) { return <div className={`p-4 ${className}`} {...p}/> }
