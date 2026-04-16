import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, HelpCircle } from "lucide-react";

/**
 * Reusable Confirmation Dialog
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Function to close the dialog
 * @param {function} onConfirm - Function to execute on confirmation
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description text
 * @param {string} confirmText - Label for confirm button
 * @param {string} cancelText - Label for cancel button
 * @param {string} type - 'danger' or 'primary'
 * @param {React.ReactNode} icon - Optional Lucide icon
 */
export default function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "primary",
    icon
}) {
    const isDanger = type === "danger";
    
    // Default icons based on type if none provided
    const DefaultIcon = icon || (isDanger ? AlertCircle : HelpCircle);
    
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2000, // Higher than most UI
                    padding: "20px"
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={{
                            background: "white",
                            borderRadius: "24px",
                            width: "100%",
                            maxWidth: "450px",
                            padding: "32px",
                            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
                            textAlign: "center",
                            position: "relative"
                        }}
                    >
                        {/* Close button */}
                        <button 
                            onClick={onClose}
                            style={{ 
                                position: "absolute", 
                                top: "20px", 
                                right: "20px", 
                                border: "none", 
                                background: "none", 
                                cursor: "pointer", 
                                color: "#94a3b8",
                                padding: "4px",
                                borderRadius: "8px",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                            <X size={20} />
                        </button>

                        {/* Icon Header */}
                        <div style={{ 
                            width: "64px", 
                            height: "64px", 
                            borderRadius: "20px", 
                            background: isDanger ? "#fef2f2" : "#eff6ff", 
                            color: isDanger ? "#ef4444" : "#3b82f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 24px auto",
                            boxShadow: `0 8px 16px -4px ${isDanger ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)"}`
                        }}>
                            <DefaultIcon size={32} />
                        </div>

                        {/* Content */}
                        <h3 style={{ 
                            fontSize: "22px", 
                            fontWeight: 700, 
                            color: "#111827", 
                            margin: "0 0 12px 0",
                            letterSpacing: "-0.01em"
                        }}>
                            {title}
                        </h3>
                        <p style={{ 
                            color: "#64748b", 
                            margin: "0 0 32px 0", 
                            lineHeight: 1.6,
                            fontSize: "15px"
                        }}>
                            {description}
                        </p>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: "14px",
                                    borderRadius: "14px",
                                    border: "1px solid #e2e8f0",
                                    background: "white",
                                    color: "#475569",
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                style={{
                                    flex: 1,
                                    padding: "14px",
                                    borderRadius: "14px",
                                    border: "none",
                                    background: isDanger ? "#ef4444" : "#3b82f6",
                                    color: "white",
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    boxShadow: `0 4px 12px ${isDanger ? "rgba(239, 68, 68, 0.25)" : "rgba(59, 130, 246, 0.25)"}`,
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
