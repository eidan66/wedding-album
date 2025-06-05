import { motion } from "framer-motion";
import { CheckCircle, Heart, Sparkles } from "lucide-react";

export default function SuccessAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="relative w-32 h-32 mx-auto mb-8"
      >
        {/* Background Circle */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full" />
        
        {/* Success Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <CheckCircle className="w-16 h-16 text-emerald-600" />
        </div>

        {/* Floating Hearts */}
        <motion.div
          animate={{ y: [-10, -20, -10] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-4 -left-4 text-red-400"
        >
          <Heart className="w-6 h-6" />
        </motion.div>
        
        <motion.div
          animate={{ y: [-15, -25, -15] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          className="absolute -bottom-2 -right-4 text-pink-400"
        >
          <Heart className="w-5 h-5" />
        </motion.div>

        {/* Sparkles */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute -top-6 -right-6 text-gold-400"
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-600 bg-clip-text text-transparent">
          הזיכרון נשתף בהצלחה!
        </h2>
        <p className="text-gray-600 text-lg max-w-md mx-auto">
          תודה שהוספתם לאוסף היפה של זכרונות החתונה שלנו. 
          התמונות והסרטונים שלכם הם עכשיו חלק מהסיפור הנצחי שלנו! 💕
        </p>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="text-4xl"
        >
          🎉✨💒✨🎉
        </motion.div>
      </motion.div>
    </motion.div>
  );
}