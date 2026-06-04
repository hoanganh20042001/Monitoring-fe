import React from 'react';
export default function Footer() {
return (
<footer className="border-t border-gray-200 bg-white">
<div className="container-max py-4 text-sm text-gray-500 flex items-center justify-between">
<span>© {new Date().getFullYear()} UPSC</span>
<span>Phiên bản 1.0.0</span>
</div>
</footer>
);
}