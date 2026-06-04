  // src/components/Notification.jsx
  import React, { useEffect } from "react";
  import { motion } from "framer-motion";
  import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

  const icons = {
    success: <CheckCircle className="w-6 h-6 text-white" />,
    error: <XCircle className="w-6 h-6 text-white" />,
    warning: <AlertTriangle className="w-6 h-6 text-white" />,
  };

  const bgColors = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-orange-500",
  };

  const Notification = ({ type = "success", message, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(() => onClose?.(), 3000);
      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white ${bgColors[type]} z-[1100]`}
      >
        {icons[type]}
        <span className="font-medium">{message}</span>
        <button onClick={onClose}>
          <X className="w-5 h-5 text-white hover:opacity-80" />
        </button>
      </motion.div>
    );
  };

  export default Notification;
