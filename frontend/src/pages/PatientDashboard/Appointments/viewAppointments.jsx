import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmationDialog from "../../../components/confirmationDialog";
import { 
    Calendar, 
    Clock, 
    User, 
    Video, 
    MapPin, 
    Edit2, 
    Trash2, 
    AlertCircle, 
    CheckCircle2, 
    X,
    Filter,
    ChevronRight,
    Search,
    Plus
} from "lucide-react";

const APPOINTMENT_SERVICE_URL = "http://localhost:3004/api/appointments";

export default function ViewAppointments() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editingAppt, setEditingAppt] = useState(null);
    const [deletingAppt, setDeletingAppt] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");

    // Form state for editing
    const [editForm, setEditForm] = useState({
        type: "",
        reason: ""
    });

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${APPOINTMENT_SERVICE_URL}/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError("Failed to load appointments. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`${APPOINTMENT_SERVICE_URL}/update/${editingAppt._id}`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMessage("Appointment updated successfully!");
            setEditingAppt(null);
            fetchAppointments();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Error updating appointment:", err);
            setError(err.response?.data?.message || "Failed to update appointment.");
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${APPOINTMENT_SERVICE_URL}/${deletingAppt._id}/patient`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMessage("Appointment deleted and slot freed successfully!");
            setDeletingAppt(null);
            fetchAppointments();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Error deleting appointment:", err);
            setError(err.response?.data?.message || "Failed to delete appointment.");
            setTimeout(() => setError(null), 3000);
        }
    };

    const openEditModal = (appt) => {
        setEditingAppt(appt);
        setEditForm({
            type: appt.type,
            reason: appt.reason || ""
        });
    };

    const filteredAppointments = appointments.filter(appt => {
        const matchesSearch = appt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             appt.specialty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "ALL" || appt.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'CONFIRMED': return { bg: '#ecfdf5', text: '#059669', dot: '#10b981' };
            case 'PENDING': return { bg: '#fffbeb', text: '#d97706', dot: '#f59e0b' };
            case 'COMPLETED': return { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' };
            case 'CANCELLED': return { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' };
            default: return { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af' };
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <div className="animate-spin" style={{ fontSize: "40px", marginBottom: "20px" }}>🔵</div>
                    <p style={{ color: "#6b7280", fontWeight: 500 }}>Loading your appointments...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: "32px 0" }}>
            {/* Header and Controls */}
            <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "32px",
                flexWrap: "wrap",
                gap: "20px"
            }}>
                <div>
                    <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>My Appointments</h2>
                    <p style={{ color: "#6b7280", margin: 0 }}>Manage your health visits and schedule</p>
                </div>
                
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <button
                        onClick={() => navigate("/book-appointment")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "10px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    >
                        <Plus size={18} /> Book Appointment
                    </button>

                    <div style={{ height: "24px", width: "1px", background: "#e5e7eb" }} />

                    <div style={{ position: "relative" }}>
                        <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                        <input 
                            type="text" 
                            placeholder="Search doctor or specialty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: "10px 12px 10px 40px",
                                borderRadius: "10px",
                                border: "1px solid #e5e7eb",
                                fontSize: "14px",
                                width: "260px",
                                outline: "none",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                            }}
                        />
                    </div>
                    
                    <div style={{ display: "flex", background: "white", padding: "4px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                        {["ALL", "PENDING", "CONFIRMED"].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    border: "none",
                                    background: filterStatus === status ? "#3b82f6" : "transparent",
                                    color: filterStatus === status ? "white" : "#6b7280",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{ 
                            background: "#ecfdf5", 
                            color: "#065f46", 
                            padding: "16px 20px", 
                            borderRadius: "12px", 
                            marginBottom: "24px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            border: "1px solid #a7f3d0"
                        }}
                    >
                        <CheckCircle2 size={20} />
                        <span style={{ fontWeight: 500 }}>{successMessage}</span>
                    </motion.div>
                )}

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{ 
                            background: "#fef2f2", 
                            color: "#991b1b", 
                            padding: "16px 20px", 
                            borderRadius: "12px", 
                            marginBottom: "24px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            border: "1px solid #fecaca"
                        }}
                    >
                        <AlertCircle size={20} />
                        <span style={{ fontWeight: 500 }}>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List Grid */}
            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", 
                gap: "24px" 
            }}>
                {filteredAppointments.length === 0 ? (
                    <div style={{ 
                        gridColumn: "1 / -1", 
                        textAlign: "center", 
                        padding: "80px", 
                        background: "white", 
                        borderRadius: "24px",
                        border: "2px dashed #e5e7eb"
                    }}>
                        <div style={{ fontSize: "64px", marginBottom: "20px" }}>📅</div>
                        <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", margin: "0 0 10px 0" }}>
                            {searchTerm || filterStatus !== "ALL" ? "No matching appointments found" : "No appointments yet"}
                        </h3>
                        <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>
                            {searchTerm || filterStatus !== "ALL" ? "Try adjusting your filters or search term." : "Schedule your first consultation with our top specialists today."}
                        </p>
                    </div>
                ) : (
                    filteredAppointments.map((appt) => {
                        const style = getStatusStyles(appt.status);
                        return (
                            <motion.div
                                layout
                                key={appt._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
                                style={{
                                    background: "white",
                                    borderRadius: "20px",
                                    padding: "24px",
                                    border: "1px solid #f3f4f6",
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "20px",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                {/* Top Section: Doctor & Status */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ display: "flex", gap: "16px" }}>
                                        <div style={{ 
                                            width: "56px", 
                                            height: "56px", 
                                            borderRadius: "14px", 
                                            background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#0284c7",
                                            fontWeight: 700,
                                            fontSize: "20px"
                                        }}>
                                            {appt.doctorName.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: 700, color: "#111827" }}>
                                                Dr. {appt.doctorName}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280", display: "flex", alignItems: "center", gap: "6px" }}>
                                                {appt.specialty}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ 
                                        padding: "6px 12px", 
                                        borderRadius: "99px", 
                                        background: style.bg, 
                                        color: style.text, 
                                        fontSize: "12px", 
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}>
                                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: style.dot }} />
                                        {appt.status}
                                    </div>
                                </div>

                                {/* Appointment Details */}
                                <div style={{ 
                                    background: "#f8fafc", 
                                    borderRadius: "16px", 
                                    padding: "16px",
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "16px"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <Calendar size={16} color="#64748b" />
                                        <div>
                                            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Date</p>
                                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                                                {new Date(appt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <Clock size={16} color="#64748b" />
                                        <div>
                                            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Time</p>
                                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#334155" }}>{appt.timeSlot}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        {appt.type === "TELEMEDICINE" ? <Video size={16} color="#64748b" /> : <MapPin size={16} color="#64748b" />}
                                        <div>
                                            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Type</p>
                                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#334155" }}>{appt.type}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <User size={16} color="#64748b" />
                                        <div>
                                            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Ref ID</p>
                                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#334155" }}>{appt.appointmentId || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Reason Section */}
                                {appt.reason && (
                                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                                        <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Reason for Visit</p>
                                        <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>
                                            {appt.reason}
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
                                    {!['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(appt.status) && (
                                        <button
                                            onClick={() => openEditModal(appt)}
                                            style={{
                                                flex: 1,
                                                padding: "12px",
                                                borderRadius: "12px",
                                                border: "1px solid #e2e8f0",
                                                background: "white",
                                                color: "#475569",
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "8px",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "#f8fafc";
                                                e.currentTarget.style.borderColor = "#cbd5e1";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "white";
                                                e.currentTarget.style.borderColor = "#e2e8f0";
                                            }}
                                        >
                                            <Edit2 size={16} /> Edit
                                        </button>
                                    )}
                                    
                                    {!['CONFIRMED'].includes(appt.status) && (
                                        <button
                                            onClick={() => setDeletingAppt(appt)}
                                            style={{
                                                flex: 1,
                                                padding: "12px",
                                                borderRadius: "12px",
                                                border: "none",
                                                background: "#fef2f2",
                                                color: "#dc2626",
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "8px",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "#fef2f2"}
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    )}

                                    {appt.status === 'CONFIRMED' && (
                                        <div style={{
                                            flex: 1,
                                            padding: "12px",
                                            textAlign: "center",
                                            borderRadius: "12px",
                                            border: "1px dashed #cbd5e1",
                                            color: "#94a3b8",
                                            fontSize: "13px",
                                            fontWeight: 500
                                        }}>
                                            Appointment locked
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingAppt && (
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
                        zIndex: 1000,
                        padding: "20px"
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{
                                background: "white",
                                borderRadius: "24px",
                                width: "100%",
                                maxWidth: "500px",
                                padding: "32px",
                                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
                                position: "relative"
                            }}
                        >
                            <button 
                                onClick={() => setEditingAppt(null)}
                                style={{ position: "absolute", top: "24px", right: "24px", border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}
                            >
                                <X size={24} />
                            </button>

                            <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>Edit Appointment</h3>
                            <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>Update your visit preferences for Dr. {editingAppt.doctorName}</p>

                            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                                        Appointment Type
                                    </label>
                                    <select
                                        value={editForm.type}
                                        onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            borderRadius: "12px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "15px",
                                            outline: "none"
                                        }}
                                    >
                                        <option value="IN-PERSON">In-Person Visit</option>
                                        <option value="TELEMEDICINE">Video Consultation</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                                        Reason for Visit
                                    </label>
                                    <textarea
                                        value={editForm.reason}
                                        onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                                        required
                                        placeholder="Describe your symptoms or reason for the visit..."
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            borderRadius: "12px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "15px",
                                            minHeight: "120px",
                                            outline: "none",
                                            resize: "none"
                                        }}
                                    />
                                </div>

                                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setEditingAppt(null)}
                                        style={{
                                            flex: 1,
                                            padding: "14px",
                                            borderRadius: "12px",
                                            border: "1px solid #e2e8f0",
                                            background: "white",
                                            color: "#475569",
                                            fontSize: "15px",
                                            fontWeight: 600,
                                            cursor: "pointer"
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            flex: 1,
                                            padding: "14px",
                                            borderRadius: "12px",
                                            border: "none",
                                            background: "#3b82f6",
                                            color: "white",
                                            fontSize: "15px",
                                            fontWeight: 600,
                                            cursor: "pointer"
                                        }}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Delete Confirmation Modal using Reusable Component */}
                <ConfirmationDialog
                    isOpen={!!deletingAppt}
                    onClose={() => setDeletingAppt(null)}
                    onConfirm={handleDelete}
                    title="Cancel Appointment?"
                    description={deletingAppt ? `Are you sure you want to cancel your appointment with Dr. ${deletingAppt.doctorName}? This action will free up the slot and cannot be undone.` : ""}
                    confirmText="Yes, Cancel"
                    cancelText="No, Keep it"
                    type="danger"
                    icon={Trash2}
                />
            </AnimatePresence>
        </div>
    );
}
