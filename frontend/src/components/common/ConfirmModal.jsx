import React from 'react';

export default function ConfirmModal({ visible, title = 'Confirm', message = '', onConfirm, onCancel }) {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
            <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{message}</p>

                <div className="mt-4 flex justify-end gap-3">
                    <button onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Cancel</button>
                    <button onClick={onConfirm} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Confirm</button>
                </div>
            </div>
        </div>
    );
}
