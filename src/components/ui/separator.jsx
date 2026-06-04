export function Separator({ orientation="horizontal", className="" }){
  return <div className={`${orientation==="vertical"?"w-px h-4":"h-px w-full"} bg-gray-200 ${className}`} />
}
