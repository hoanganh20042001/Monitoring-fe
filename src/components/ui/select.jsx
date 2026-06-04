export function Select({ children }){ return children }
export function SelectTrigger({ children, ...p }){ return <button className="w-full border rounded-md px-3 py-2 text-left" {...p}>{children}</button> }
export function SelectValue({ placeholder }){ return <span className="text-gray-500">{placeholder}</span> }
export function SelectContent({ children }){ return <div className="mt-2 border rounded-md bg-white p-2">{children}</div> }
export function SelectItem({ children, ...p }){ return <div className="px-2 py-1 hover:bg-gray-100 rounded" {...p}>{children}</div> }
