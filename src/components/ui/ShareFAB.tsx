"use client";
import { Plus } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import Link from "next/link";

export function ShareFAB() {
  return (
    <motion.div
      className="fixed bottom-4 right-4 z-40 md:hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link
        href={createPageUrl("Upload")}
        className="flex items-center justify-center w-14 h-14 rounded-full
                   bg-gradient-to-r from-emerald-600 to-emerald-700 text-white
                   shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </motion.div>
  );
} 