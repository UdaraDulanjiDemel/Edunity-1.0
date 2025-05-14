import React, { useState } from "react";
import { motion } from "framer-motion";

const UserAvatar = ({ src, alt, name, size = "h-10 w-10", className = "" }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const getInitial = () => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const getTextSize = () => {
    if (size.includes("h-32") || size.includes("h-24")) return "text-4xl";
    if (size.includes("h-16") || size.includes("h-14")) return "text-2xl";
    if (size.includes("h-12") || size.includes("h-10")) return "text-lg";
    if (size.includes("h-8")) return "text-sm";
    return "text-xs";
  };

 

export default UserAvatar;
