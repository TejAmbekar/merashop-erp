export default function ToastContainer({ toasts, onClose }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast success" role="status">
          <span className="toast-icon" aria-hidden="true">✓</span>
          <span className="toast-message">{toast.message}</span>
          <button type="button" className="toast-close" onClick={() => onClose(toast.id)} aria-label={`Dismiss notification: ${toast.message}`}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
