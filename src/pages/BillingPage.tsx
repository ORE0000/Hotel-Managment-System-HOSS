import React from "react";
import { Toaster } from "react-hot-toast";
import { CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import BillingSystem from "../components/BillingSystem/BillingSystem";
import "../components/BillingSystem/Billing.css";

const BillingPage: React.FC = () => {
  return (
    <div
      className="h-screen flex flex-col p-6 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--bg-primary), var(--bg-secondary))`,
      }}
    >
      <Toaster position="top-right" />
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex items-center justify-center gap-3 mb-8"
      >
        <div className="p-2 rounded-full bg-[var(--icon-bg-indigo)] text-white shadow-lg">
          <CreditCard size={28} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gradient-modern tracking-tight">
          Billing System
        </h1>
        <div className="absolute bottom-0 h-1 w-32 bg-gradient-to-r from-[var(--icon-bg-indigo)] to-[var(--icon-bg-purple)] rounded-full" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6 rounded-2xl neumorphic-card border border-[var(--border-color)] card-hover flex-1 overflow-auto"
      >
        <BillingSystem />
      </motion.div>
    </div>
  );
};

export default BillingPage;